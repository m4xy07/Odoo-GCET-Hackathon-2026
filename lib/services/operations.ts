import { isValidObjectId, type ClientSession, type Types } from 'mongoose';
import { HttpError } from '@/lib/api';
import { connectDB } from '@/lib/db';
import type { OperationDetail, OperationRow, OpStatus, OpType } from '@/lib/types';
import type { OperationInput } from '@/lib/validators';
import { Counter } from '@/models/Counter';
import { Location } from '@/models/Location';
import { Operation } from '@/models/Operation';
import { Product } from '@/models/Product';
import { StockQuant } from '@/models/StockQuant';
import { Warehouse } from '@/models/Warehouse';
import { formatReference, nextReference } from './references';
import { allowedActions, canEdit, isLate, lineAvailability, startOfToday } from './rules';

type Id = Types.ObjectId;
type Loc = { _id: Id; fullName: string; type: string; warehouse?: Id | null };
type DocType = Exclude<OpType, 'ADJ'>; // adjustments are created done by adjustStock, never drafted by hand

const VIRTUAL = {
  vendor: { name: 'Vendors', shortCode: 'Vendors', fullName: 'Partners/Vendors' },
  customer: { name: 'Customers', shortCode: 'Customers', fullName: 'Partners/Customers' },
  adjustment: { name: 'Adjustment', shortCode: 'Adjustment', fullName: 'Virtual/Adjustment' },
};

// Where each type is allowed to take stock from and put it
const ENDS: Record<DocType, [string, string]> = {
  IN: ['vendor', 'internal'],
  OUT: ['internal', 'customer'],
  INT: ['internal', 'internal'],
};

// The vendor, customer and adjustment ends of a move, created on first use so a fresh database just works
export async function virtualLocation(type: keyof typeof VIRTUAL, session?: ClientSession) {
  const location = await Location.findOneAndUpdate(
    { type, warehouse: null },
    { $setOnInsert: VIRTUAL[type] }, // type and warehouse come from the filter
    { upsert: true, returnDocument: 'after', session },
  ).lean();
  return location!;
}

// quantity - reserved per product at one location, read only
export async function freeByProduct(locationId: Id | string, productIds: (Id | string)[], session?: ClientSession) {
  const quants = await StockQuant.find({ location: locationId, product: { $in: productIds } })
    .session(session ?? null)
    .lean();
  return Object.fromEntries(quants.map((q) => [String(q.product), q.quantity - q.reserved])) as Record<string, number>;
}

export type OperationFilters = {
  type?: OpType;
  status?: OpStatus[];
  q?: string;
  warehouse?: string;
  location?: string;
  late?: boolean;
};

export async function listOperations(f: OperationFilters): Promise<OperationRow[]> {
  await connectDB();
  const and: Record<string, unknown>[] = [];
  if (f.type) and.push({ type: f.type });
  if (f.status?.length) and.push({ status: { $in: f.status } });
  if (f.warehouse) and.push({ warehouse: f.warehouse });
  if (f.location) and.push({ $or: [{ sourceLocation: f.location }, { destLocation: f.location }] });
  if (f.late) and.push({ scheduledDate: { $lt: startOfToday() }, status: { $nin: ['done', 'canceled'] } });
  if (f.q) {
    const search = new RegExp(f.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    and.push({ $or: [{ reference: search }, { contact: search }] });
  }

  const ops = await Operation.find(and.length ? { $and: and } : {})
    .sort({ createdAt: -1 })
    .populate<{ sourceLocation: Loc; destLocation: Loc }>('sourceLocation destLocation', 'fullName')
    .lean();

  return ops.map((op) => ({
    id: String(op._id),
    reference: op.reference,
    type: op.type,
    status: op.status,
    contact: op.contact,
    from: op.sourceLocation?.fullName ?? '',
    to: op.destLocation?.fullName ?? '',
    scheduledDate: op.scheduledDate.toISOString(),
    isLate: isLate(op.scheduledDate, op.status),
  }));
}

export async function getOperation(id: string, session?: ClientSession): Promise<OperationDetail> {
  await connectDB();
  if (!isValidObjectId(id)) throw new HttpError(404, 'Operation not found');
  const op = await Operation.findById(id)
    .session(session ?? null)
    .populate<{ sourceLocation: Loc; destLocation: Loc }>('sourceLocation destLocation', 'fullName type')
    .populate<{ warehouse: { shortCode: string } }>('warehouse', 'shortCode')
    .populate<{ responsible: { _id: Id; name: string } }>('responsible', 'name')
    .populate<{
      lines: { product: { _id: Id; name: string; sku: string }; quantity: number; available?: boolean | null }[];
    }>('lines.product', 'name sku')
    .lean();
  if (!op) throw new HttpError(404, 'Operation not found');

  const lines = op.lines.map((l) => ({ product: String(l.product._id), quantity: l.quantity }));
  const fromStock = op.sourceLocation.type === 'internal';
  const free = fromStock ? await freeByProduct(op.sourceLocation._id, lines.map((l) => l.product), session) : {};
  // A ready delivery has already reserved its stock, so its own reservation must not paint it red
  const checkNow = fromStock && (op.status === 'draft' || op.status === 'waiting' || (op.status === 'ready' && op.type === 'INT'));
  const available = checkNow ? lineAvailability(lines, free) : op.lines.map((l) => l.available ?? true);

  return {
    id: String(op._id),
    reference: op.reference,
    type: op.type,
    status: op.status,
    contact: op.contact,
    from: op.sourceLocation.fullName,
    to: op.destLocation.fullName,
    scheduledDate: op.scheduledDate.toISOString(),
    isLate: isLate(op.scheduledDate, op.status),
    warehouse: op.warehouse?.shortCode ?? '',
    responsible: { id: String(op.responsible?._id ?? ''), name: op.responsible?.name ?? '' },
    deliveryAddress: op.deliveryAddress ?? undefined,
    notes: op.notes ?? undefined,
    sourceLocationId: String(op.sourceLocation._id),
    destLocationId: String(op.destLocation._id),
    lines: op.lines.map((l, i) => ({
      productId: String(l.product._id),
      name: l.product.name,
      sku: l.product.sku,
      quantity: l.quantity,
      available: available[i],
      freeToUse: free[String(l.product._id)] ?? 0,
    })),
    canEdit: canEdit(op.status),
    actions: allowedActions(op.type, op.status),
  };
}

// Checks both ends fit the operation type and returns the warehouse whose code goes in the reference
async function checkLocations(type: OpType, sourceId: string, destId: string) {
  if (type === 'ADJ') throw new HttpError(400, 'Adjustments are made from a counted quantity', { type: 'Pick another type' });
  const [source, dest] = await Promise.all([Location.findById(sourceId).lean(), Location.findById(destId).lean()]);
  const [sourceType, destType] = ENDS[type];
  if (!source || source.type !== sourceType) {
    throw new HttpError(400, 'Pick a valid source location', { sourceLocation: 'Pick a valid source location' });
  }
  if (!dest || dest.type !== destType) {
    throw new HttpError(400, 'Pick a valid destination location', { destLocation: 'Pick a valid destination location' });
  }
  const warehouse = await Warehouse.findById(type === 'IN' ? dest.warehouse : source.warehouse).lean();
  if (!warehouse) throw new HttpError(400, 'That location is not in a warehouse', { sourceLocation: 'Pick another location' });
  return warehouse;
}

async function checkProducts(lines: OperationInput['lines']) {
  const ids = [...new Set(lines.map((l) => l.product))];
  const found = await Product.countDocuments({ _id: { $in: ids } });
  if (found !== ids.length) throw new HttpError(400, 'A product on this list no longer exists', { lines: 'Remove missing products' });
}

export async function createOperation(input: OperationInput, userId: string) {
  await connectDB();
  const warehouse = await checkLocations(input.type, input.sourceLocation, input.destLocation);
  await checkProducts(input.lines);
  const reference = await nextReference(warehouse.shortCode, input.type);
  const op = await Operation.create({ ...input, reference, warehouse: warehouse._id, responsible: userId });
  return getOperation(String(op._id));
}

// Full edit, drafts only. Waiting and ready documents change lines through inventory.ts because stock may be reserved.
export async function updateOperation(id: string, input: OperationInput) {
  const current = await getOperation(id);
  if (input.type !== current.type) throw new HttpError(400, 'Operation type cannot change after saving', { type: 'Create a new one instead' });
  const warehouse = await checkLocations(input.type, input.sourceLocation, input.destLocation);
  await checkProducts(input.lines);

  const { contact, sourceLocation, destLocation, scheduledDate, deliveryAddress, notes, lines } = input;
  const changes = { contact, sourceLocation, destLocation, scheduledDate, deliveryAddress, notes, lines, warehouse: warehouse._id };
  const result = await Operation.updateOne({ _id: id, status: 'draft' }, { $set: changes });
  if (result.matchedCount === 0) throw new HttpError(409, 'Only a draft can be fully edited');
  return getOperation(id);
}

// A blank form: default locations, the reference it will most likely get, and the current user as Responsible
export async function newOperation(type: DocType, user: { id: string; name: string }): Promise<OperationDetail> {
  await connectDB();
  const internal = await Location.find({ type: 'internal' }).sort({ createdAt: 1 }).limit(2).lean();
  if (!internal.length) throw new HttpError(409, 'Add a warehouse and a location in Settings first');

  let source: Loc = internal[0];
  let dest: Loc = internal[1] ?? internal[0];
  if (type === 'IN') [source, dest] = [await virtualLocation('vendor'), internal[0]];
  if (type === 'OUT') dest = await virtualLocation('customer');

  const warehouse = await Warehouse.findById(type === 'IN' ? dest.warehouse : source.warehouse).lean();
  if (!warehouse) throw new HttpError(409, 'That location is not in a warehouse');
  const counter = await Counter.findOne({ key: `${warehouse.shortCode}/${type}` }).lean();

  return {
    id: '',
    reference: formatReference(warehouse.shortCode, type, (counter?.seq ?? 0) + 1),
    type,
    status: 'draft',
    contact: '',
    from: source.fullName,
    to: dest.fullName,
    scheduledDate: new Date().toISOString(),
    isLate: false,
    warehouse: warehouse.shortCode,
    responsible: user,
    sourceLocationId: String(source._id),
    destLocationId: String(dest._id),
    lines: [],
    canEdit: true,
    actions: allowedActions(type, 'draft'),
  };
}
