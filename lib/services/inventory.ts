import mongoose, { isValidObjectId, type ClientSession, type HydratedDocument, type Types } from 'mongoose';
import { HttpError } from '@/lib/api';
import { connectDB } from '@/lib/db';
import type { MoveRow, OpType } from '@/lib/types';
import type { AdjustInput, OperationInput } from '@/lib/validators';
import { Location } from '@/models/Location';
import { Operation, type OperationDoc } from '@/models/Operation';
import { Product } from '@/models/Product';
import { StockMove } from '@/models/StockMove';
import { StockQuant } from '@/models/StockQuant';
import { Warehouse } from '@/models/Warehouse';
import { checkProducts, freeByProduct, getOperation, virtualLocation } from './operations';
import { nextReference } from './references';
import { adjustmentDiff, lineAvailability, moveDirection, nextStatus } from './rules';

// The only file that writes StockQuant or StockMove. Every write runs inside one transaction,
// so stock, reservations and the ledger can never disagree.

type Op = HydratedDocument<OperationDoc>;
export type StockAction = 'confirm' | 'check' | 'validate' | 'cancel';

const NOT_ALLOWED: Record<StockAction, string> = {
  confirm: 'Only a draft can be marked To Do',
  check: 'Only a waiting delivery can be checked',
  validate: 'Only a ready operation can be validated',
  cancel: 'This operation is already done or canceled',
};

async function loadOperation(id: string, session: ClientSession) {
  const op = isValidObjectId(id) ? await Operation.findById(id).session(session) : null;
  if (!op) throw new HttpError(404, 'Operation not found');
  const source = await Location.findById(op.sourceLocation).session(session).lean();
  const dest = await Location.findById(op.destLocation).session(session).lean();
  return { op, fromStock: source?.type === 'internal', toStock: dest?.type === 'internal' };
}

async function availability(op: Op, session: ClientSession) {
  const lines = op.lines.map((l) => ({ product: String(l.product), quantity: l.quantity }));
  return lineAvailability(lines, await freeByProduct(op.sourceLocation, lines.map((l) => l.product), session));
}

// A ready delivery holds its stock so nobody else can promise it. sign -1 gives it back.
async function reserve(op: Op, sign: 1 | -1, session: ClientSession) {
  for (const line of op.lines) {
    await StockQuant.updateOne(
      { product: line.product, location: op.sourceLocation },
      { $inc: { reserved: sign * line.quantity } },
      { session },
    );
  }
}

// One ledger line per product line, with the matching quant change on each internal end
async function moveStock(op: Op, fromStock: boolean, toStock: boolean, userId: string, session: ClientSession) {
  for (const { product, quantity } of op.lines) {
    if (fromStock) {
      // the $gte guard makes the check and the decrement one atomic step
      const taken = await StockQuant.updateOne(
        { product, location: op.sourceLocation, quantity: { $gte: quantity } },
        { $inc: { quantity: -quantity } },
        { session },
      );
      if (taken.matchedCount === 0) {
        const item = await Product.findById(product).session(session).lean();
        throw new HttpError(409, `Not enough ${item?.name ?? 'stock'} at the source location to validate`);
      }
    }
    if (toStock) {
      await StockQuant.updateOne({ product, location: op.destLocation }, { $inc: { quantity } }, { upsert: true, session });
    }
  }

  const date = new Date();
  const moves = op.lines.map((l) => ({
    operation: op._id,
    reference: op.reference,
    type: op.type,
    product: l.product,
    fromLocation: op.sourceLocation,
    toLocation: op.destLocation,
    quantity: l.quantity,
    contact: op.contact,
    user: userId,
    date,
  }));
  await StockMove.insertMany(moves, { session });
}

// To Do, Check availability, Validate and Cancel all come through here
export async function applyAction(id: string, action: StockAction, userId: string) {
  await connectDB();
  await mongoose.connection.transaction(async (session) => {
    const { op, fromStock, toStock } = await loadOperation(id, session);
    const wasReserved = op.type === 'OUT' && op.status === 'ready';
    const checksStock = op.type === 'OUT' && (action === 'confirm' || action === 'check');
    const available = checksStock ? await availability(op, session) : null;

    const next = nextStatus(op.type, op.status, action, available?.every(Boolean) ?? true);
    if (!next) throw new HttpError(409, NOT_ALLOWED[action]);

    if (available) op.lines.forEach((line, i) => (line.available = available[i]));
    if (wasReserved) await reserve(op, -1, session); // validate and cancel both release first
    if (op.type === 'OUT' && next === 'ready' && !wasReserved) await reserve(op, 1, session);
    if (action === 'validate') await moveStock(op, fromStock, toStock, userId, session);

    op.status = next;
    if (next === 'done') op.doneAt = new Date();
    await op.save({ session });
  });
  return getOperation(id);
}

// Waiting and ready documents can still change quantities. A delivery gives back its
// reservation, then takes it again only if the new quantities are in stock.
export async function updateLines(id: string, lines: OperationInput['lines']) {
  await connectDB();
  await checkProducts(lines);
  await mongoose.connection.transaction(async (session) => {
    const { op } = await loadOperation(id, session);
    if (op.status !== 'waiting' && op.status !== 'ready') throw new HttpError(409, 'This operation can no longer be edited');
    if (op.type === 'OUT' && op.status === 'ready') await reserve(op, -1, session);

    op.set('lines', lines);
    if (op.type === 'OUT') {
      const available = await availability(op, session);
      op.lines.forEach((line, i) => (line.available = available[i]));
      op.status = available.every(Boolean) ? 'ready' : 'waiting';
      if (op.status === 'ready') await reserve(op, 1, session);
    }
    await op.save({ session });
  });
  return getOperation(id);
}

// Stock count: an ADJ operation born done, with one move of the difference in the right direction.
// Used by the Stock page inline edit, the Adjustment form and opening stock on a new product.
export async function adjustStock({ productId, locationId, countedQty, reason }: AdjustInput, userId: string) {
  await connectDB();
  const operationId = await mongoose.connection.transaction(async (session) => {
    const location = await Location.findById(locationId).session(session).lean();
    if (location?.type !== 'internal') throw new HttpError(400, 'Pick a stock location', { locationId: 'Pick a stock location' });
    const warehouse = await Warehouse.findById(location.warehouse).session(session).lean();
    if (!warehouse) throw new HttpError(400, 'That location is not in a warehouse', { locationId: 'Pick another location' });
    if (!(await Product.exists({ _id: productId }).session(session))) {
      throw new HttpError(400, 'Pick a product', { productId: 'Pick a product' });
    }

    const quant = await StockQuant.findOne({ product: productId, location: locationId }).session(session).lean();
    const diff = adjustmentDiff(quant?.quantity ?? 0, countedQty);
    if (diff.direction === 'none') {
      throw new HttpError(400, 'Counted quantity matches what is on hand', { countedQty: 'Nothing to adjust' });
    }

    const virtual = await virtualLocation('adjustment', session);
    const [from, to] = diff.direction === 'in' ? [virtual._id, location._id] : [location._id, virtual._id];
    const reference = await nextReference(warehouse.shortCode, 'ADJ', session);
    const now = new Date();

    const [op] = await Operation.create(
      [
        {
          reference,
          type: 'ADJ',
          status: 'done',
          warehouse: warehouse._id,
          sourceLocation: from,
          destLocation: to,
          scheduledDate: now,
          responsible: userId,
          notes: reason,
          lines: [{ product: productId, quantity: diff.quantity, available: true }],
          doneAt: now,
        },
      ],
      { session },
    );
    await StockMove.create(
      [{ operation: op._id, reference, type: 'ADJ', product: productId, fromLocation: from, toLocation: to, quantity: diff.quantity, user: userId, date: now }],
      { session },
    );
    const change = diff.direction === 'in' ? diff.quantity : -diff.quantity;
    await StockQuant.updateOne({ product: productId, location: locationId }, { $inc: { quantity: change } }, { upsert: true, session });
    return String(op._id);
  });
  return getOperation(operationId);
}

export type MoveFilters = { q?: string; type?: OpType; product?: string; location?: string; from?: Date; to?: Date; limit?: number };

type MoveLoc = { _id: Types.ObjectId; fullName: string; type: string };

// Move History reads the ledger straight, one row per product line
export async function listMoves(f: MoveFilters): Promise<MoveRow[]> {
  await connectDB();
  const and: Record<string, unknown>[] = [];
  if (f.type) and.push({ type: f.type });
  if (f.product) and.push({ product: f.product });
  if (f.location) and.push({ $or: [{ fromLocation: f.location }, { toLocation: f.location }] });
  if (f.from || f.to) and.push({ date: { ...(f.from && { $gte: f.from }), ...(f.to && { $lte: f.to }) } });
  if (f.q) {
    const search = new RegExp(f.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    and.push({ $or: [{ reference: search }, { contact: search }] });
  }

  const moves = await StockMove.find(and.length ? { $and: and } : {})
    .sort({ date: -1, _id: -1 })
    .limit(f.limit ?? 500)
    .populate<{ product: { name: string; sku: string } }>('product', 'name sku')
    .populate<{ fromLocation: MoveLoc; toLocation: MoveLoc }>('fromLocation toLocation', 'fullName type')
    .lean();

  return moves.map((m) => ({
    id: String(m._id),
    date: m.date.toISOString(),
    reference: m.reference,
    type: m.type,
    direction: moveDirection(m.type, m.toLocation?.type === 'internal'),
    product: m.product?.name ?? '',
    sku: m.product?.sku ?? '',
    from: m.fromLocation?.fullName ?? '',
    to: m.toLocation?.fullName ?? '',
    quantity: m.quantity,
    contact: m.contact,
    status: 'done',
  }));
}
