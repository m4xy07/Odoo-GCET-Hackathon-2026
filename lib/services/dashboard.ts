import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import type { DashboardData, OpStatus, OpType } from '@/lib/types';
import { Location } from '@/models/Location';
import { Operation } from '@/models/Operation';
import { Product } from '@/models/Product';
import { StockQuant } from '@/models/StockQuant';
import { stockState } from './catalog';
import { listMoves } from './inventory';
import { startOfToday } from './rules';

export type DashboardFilters = {
  type?: OpType;
  status?: OpStatus[];
  warehouse?: string;
  location?: string;
  category?: string;
};

// aggregate() does not cast strings the way find() does
const oid = (id: string) => new Types.ObjectId(id);
const OPEN = { $nin: ['done', 'canceled'] };
const count = (match: Record<string, unknown>) => [
  { $match: match },
  { $count: 'n' },
];

// Every card number in one pass over the operations that pass the filters.
// late = scheduled before today and still open, upcoming ("operations" on the card) = today or later and still open.
async function operationCounts(
  f: DashboardFilters,
  productIds: Types.ObjectId[] | null,
) {
  const match: Record<string, unknown> = {};
  if (f.type) match.type = f.type;
  if (f.status?.length) match.status = { $in: f.status };
  if (f.warehouse) match.warehouse = oid(f.warehouse);
  if (f.location)
    match.$or = [
      { sourceLocation: oid(f.location) },
      { destLocation: oid(f.location) },
    ];
  if (productIds) match['lines.product'] = { $in: productIds };

  const today = startOfToday();
  const byType = (type: OpType) => ({
    open: count({ type, status: OPEN }),
    ready: count({ type, status: 'ready' }),
    late: count({ type, status: OPEN, scheduledDate: { $lt: today } }),
    upcoming: count({ type, status: OPEN, scheduledDate: { $gte: today } }),
  });
  const receipts = byType('IN');
  const deliveries = byType('OUT');

  const [facets] = await Operation.aggregate<Record<string, { n: number }[]>>([
    { $match: match },
    {
      $facet: {
        receiptsOpen: receipts.open,
        receiptsReady: receipts.ready,
        receiptsLate: receipts.late,
        receiptsUpcoming: receipts.upcoming,
        deliveriesOpen: deliveries.open,
        deliveriesReady: deliveries.ready,
        deliveriesLate: deliveries.late,
        deliveriesUpcoming: deliveries.upcoming,
        deliveriesWaiting: count({ type: 'OUT', status: 'waiting' }),
        transfersOpen: count({ type: 'INT', status: OPEN }),
      },
    },
  ]);
  return (key: string) => facets?.[key]?.[0]?.n ?? 0;
}

// Products in stock, low and out, counted only over the chosen locations and category.
// A product with no stock row at all is out.
async function stockCounts(
  productIds: Types.ObjectId[] | null,
  locationIds: Types.ObjectId[] | null,
) {
  const products = await Product.find({
    active: true,
    ...(productIds && { _id: { $in: productIds } }),
  })
    .select('reorderMin')
    .lean();

  const quantMatch: Record<string, unknown> = {
    product: { $in: products.map((p) => p._id) },
  };
  if (locationIds) quantMatch.location = { $in: locationIds };
  const totals = await StockQuant.aggregate<{
    _id: Types.ObjectId;
    onHand: number;
  }>([
    { $match: quantMatch },
    { $group: { _id: '$product', onHand: { $sum: '$quantity' } } },
  ]);
  const onHand = new Map(totals.map((t) => [String(t._id), t.onHand]));

  const states = products.map((p) =>
    stockState(onHand.get(String(p._id)) ?? 0, p.reorderMin ?? 0),
  );
  return {
    productsInStock: states.filter((s) => s !== 'out').length,
    lowStock: states.filter((s) => s === 'low').length,
    outOfStock: states.filter((s) => s === 'out').length,
  };
}

export async function getDashboard(
  f: DashboardFilters,
): Promise<DashboardData> {
  await connectDB();
  const productIds = f.category
    ? ((await Product.find({ category: f.category, active: true }).distinct(
        '_id',
      )) as Types.ObjectId[])
    : null;
  const locationIds = f.location
    ? [oid(f.location)]
    : f.warehouse
      ? ((await Location.find({
          warehouse: f.warehouse,
          type: 'internal',
        }).distinct('_id')) as Types.ObjectId[])
      : null;

  const [n, stock, recent] = await Promise.all([
    operationCounts(f, productIds),
    stockCounts(productIds, locationIds),
    listMoves({ limit: 8, location: f.location }),
  ]);

  return {
    kpis: {
      ...stock,
      pendingReceipts: n('receiptsOpen'),
      pendingDeliveries: n('deliveriesOpen'),
      transfersScheduled: n('transfersOpen'),
    },
    receipts: {
      toReceive: n('receiptsReady'),
      late: n('receiptsLate'),
      upcoming: n('receiptsUpcoming'),
    },
    deliveries: {
      toDeliver: n('deliveriesReady'),
      late: n('deliveriesLate'),
      waiting: n('deliveriesWaiting'),
      upcoming: n('deliveriesUpcoming'),
    },
    recent,
  };
}
