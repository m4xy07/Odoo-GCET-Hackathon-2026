// npm run seed            fills your own MONGODB_DB (stocksense_<name>) with demo data
// npm run seed -- --demo  also allowed on the shared "stocksense" database used by the deployed demo
//
// Stock and operations go through the same services the app uses, so every number is backed by ledger lines.
import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });

import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { operationSchema } from '@/lib/validators';
import { createLocation, createWarehouse, ensureVirtualLocations, getVirtualLocation } from '@/lib/services/catalog';
import { createOperation } from '@/lib/services/operations';
import { adjustStock, applyAction } from '@/lib/services/inventory';
import { Category } from '@/models/Category';
import { Counter } from '@/models/Counter';
import { Location } from '@/models/Location';
import { Operation } from '@/models/Operation';
import { Product } from '@/models/Product';
import { StockMove } from '@/models/StockMove';
import { StockQuant } from '@/models/StockQuant';
import { User } from '@/models/User';
import { Warehouse } from '@/models/Warehouse';

const DAY = 24 * 60 * 60 * 1000;
const inDays = (n: number) => new Date(Date.now() + n * DAY);

async function main() {
  const db = process.env.MONGODB_DB || 'stocksense';
  if (db === 'stocksense' && !process.argv.includes('--demo')) {
    throw new Error('MONGODB_DB is the shared demo database. Run with --demo if you really mean it.');
  }
  await connectDB();
  console.log(`seeding ${db}`);

  // start clean, but keep users: they mirror Clerk accounts and are recreated on sign in anyway
  const wiped = [Warehouse, Location, Category, Product, StockQuant, Operation, StockMove, Counter];
  await Promise.all(wiped.map((m) => m.collection.deleteMany({})));

  // operations need a responsible user: the oldest real account, or a placeholder on an empty database
  const user =
    (await User.findOne().sort({ createdAt: 1 })) ??
    (await User.create({ clerkId: 'seed', loginId: 'manager', email: 'manager@stocksense.local', name: 'Warehouse Manager' }));
  const userId = String(user._id);

  // ---- settings ----
  await ensureVirtualLocations();
  const wh = await createWarehouse({ name: 'Main Warehouse', shortCode: 'WH', address: 'Plot 12, IDA Uppal, Hyderabad 500039' });
  const stock1 = await createLocation({ name: 'Stock1', shortCode: 'Stock1', warehouse: wh.id });
  const stock2 = await createLocation({ name: 'Stock2', shortCode: 'Stock2', warehouse: wh.id });
  await createLocation({ name: 'Production', shortCode: 'Prod', warehouse: wh.id });
  const vendors = await getVirtualLocation('vendor');
  const customers = await getVirtualLocation('customer');
  if (!stock1 || !stock2) throw new Error('could not create stock locations');

  // ---- catalog (direct until the product service lands) ----
  const [furniture, raw] = await Category.create([{ name: 'Furniture' }, { name: 'Raw Material' }]);
  const [desk, table, chair, steel] = await Product.create([
    { name: 'Desk', sku: 'DESK001', category: furniture._id, uom: 'unit', unitCost: 3000, reorderMin: 5, reorderQty: 20 },
    { name: 'Table', sku: 'TABLE001', category: furniture._id, uom: 'unit', unitCost: 3000, reorderMin: 5, reorderQty: 10 },
    { name: 'Chair', sku: 'CHAIR001', category: furniture._id, uom: 'unit', unitCost: 1200, reorderMin: 10, reorderQty: 40 },
    { name: 'Steel Rods', sku: 'STEEL001', category: raw._id, uom: 'kg', unitCost: 80, reorderMin: 20, reorderQty: 200 },
  ]);
  const id = (doc: { _id: unknown }) => String(doc._id);

  // ---- opening stock, logged as adjustments. Chair ends up low, Steel Rods out of stock. ----
  await adjustStock({ productId: id(desk), locationId: stock1.id, countedQty: 50, reason: 'Opening stock' }, userId);
  await adjustStock({ productId: id(table), locationId: stock1.id, countedQty: 20, reason: 'Opening stock' }, userId);
  await adjustStock({ productId: id(chair), locationId: stock1.id, countedQty: 8, reason: 'Opening stock' }, userId);

  // ---- operations in every state the dashboard counts ----
  async function op(
    type: 'IN' | 'OUT' | 'INT',
    contact: string,
    product: { _id: unknown },
    quantity: number,
    scheduledInDays: number,
    actions: ('confirm' | 'validate')[],
  ) {
    const [from, to] = type === 'IN' ? [vendors.id, stock1.id] : type === 'OUT' ? [stock1.id, customers.id] : [stock1.id, stock2.id];
    const input = operationSchema.parse({
      type,
      contact,
      sourceLocation: from,
      destLocation: to,
      scheduledDate: inDays(scheduledInDays),
      deliveryAddress: type === 'OUT' ? `${contact}, Hyderabad` : undefined,
      lines: [{ product: id(product), quantity }],
    });
    const created = await createOperation(input, userId);
    for (const action of actions) await applyAction(created.id, action, userId);
    const done = await Operation.findById(created.id).lean();
    console.log(`  ${created.reference.padEnd(12)} ${done?.status}`);
  }

  await op('IN', 'Azure Interior', desk, 6, 0, ['confirm', 'validate']); // done, stock +6
  await op('IN', 'Wood Corner', chair, 20, -1, ['confirm']); // ready and late
  await op('IN', 'Azure Interior', desk, 12, 0, ['confirm']); // ready, to receive today
  await op('IN', 'Deco Addict', table, 10, 3, []); // draft, upcoming
  await op('OUT', 'Deco Addict', desk, 10, 0, ['confirm', 'validate']); // done, stock -10
  await op('OUT', 'Azure Interior', chair, 30, 1, ['confirm']); // waiting, only 8 chairs
  await op('OUT', 'Wood Corner', table, 5, -1, ['confirm']); // ready and late
  await op('OUT', 'Deco Addict', desk, 4, 2, []); // draft, upcoming
  await op('INT', '', desk, 5, 0, ['confirm', 'validate']); // Stock1 to Stock2, total unchanged

  const moves = await StockMove.countDocuments();
  console.log(`done: 1 warehouse, 3 locations, 4 products, 9 operations, ${moves} ledger lines. Steel Rods starts at 0 for the demo receipt.`);
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
