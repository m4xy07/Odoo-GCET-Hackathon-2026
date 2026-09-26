import { isValidObjectId } from 'mongoose';
import { HttpError } from '@/lib/api';
import { connectDB } from '@/lib/db';
import type { LocationInput, WarehouseInput } from '@/lib/validators';
import { Location } from '@/models/Location';
import { Operation } from '@/models/Operation';
import { StockQuant } from '@/models/StockQuant';
import { Warehouse } from '@/models/Warehouse';

export type WarehouseRow = { id: string; name: string; shortCode: string; address: string };
export type LocationType = 'internal' | 'vendor' | 'customer' | 'adjustment';
export type LocationRow = {
  id: string;
  name: string;
  shortCode: string;
  type: LocationType;
  fullName: string;
  warehouseId: string | null;
};

type WarehouseLike = { _id: unknown; name: string; shortCode: string; address: string };
type LocationLike = { _id: unknown; name: string; shortCode: string; type: string; fullName: string; warehouse?: unknown };

const toWarehouseRow = (w: WarehouseLike): WarehouseRow => ({
  id: String(w._id),
  name: w.name,
  shortCode: w.shortCode,
  address: w.address,
});

const toLocationRow = (l: LocationLike): LocationRow => ({
  id: String(l._id),
  name: l.name,
  shortCode: l.shortCode,
  type: l.type as LocationType,
  fullName: l.fullName,
  warehouseId: l.warehouse ? String(l.warehouse) : null,
});

// Mongo answers a unique index clash with code 11000. Turn it into a field error the form can show.
function rethrowDuplicate(err: unknown, field: string, message: string): never {
  if ((err as { code?: number }).code === 11000) throw new HttpError(409, message, { [field]: message });
  throw err;
}

function checkId(id: string, what: string) {
  if (!isValidObjectId(id)) throw new HttpError(404, `${what} not found`);
}

// ---- warehouses ----

export async function listWarehouses() {
  await connectDB();
  const warehouses = await Warehouse.find().sort({ shortCode: 1 }).lean();
  return warehouses.map(toWarehouseRow);
}

export async function createWarehouse(input: WarehouseInput) {
  await connectDB();
  try {
    return toWarehouseRow(await Warehouse.create(input));
  } catch (err) {
    rethrowDuplicate(err, 'shortCode', 'Short code already exists');
  }
}

export async function updateWarehouse(id: string, input: WarehouseInput) {
  checkId(id, 'Warehouse');
  await connectDB();
  let warehouse;
  try {
    warehouse = await Warehouse.findByIdAndUpdate(id, input, { returnDocument: 'after', runValidators: true }).lean();
  } catch (err) {
    rethrowDuplicate(err, 'shortCode', 'Short code already exists');
  }
  if (!warehouse) throw new HttpError(404, 'Warehouse not found');
  // location names carry the warehouse code (WH/Stock1), so rename them with it
  await Location.updateMany(
    { warehouse: warehouse._id },
    [{ $set: { fullName: { $concat: [warehouse.shortCode, '/', '$name'] } } }],
    { updatePipeline: true },
  );
  return toWarehouseRow(warehouse);
}

export async function deleteWarehouse(id: string) {
  checkId(id, 'Warehouse');
  await connectDB();
  if (await Location.exists({ warehouse: id })) {
    throw new HttpError(409, 'Delete the locations in this warehouse first');
  }
  const warehouse = await Warehouse.findByIdAndDelete(id).lean();
  if (!warehouse) throw new HttpError(404, 'Warehouse not found');
  return toWarehouseRow(warehouse);
}

// ---- locations ----

// The fixed far ends of every move. Receipts come from Vendors, deliveries go to Customers,
// adjustments balance against Virtual/Adjustment. They belong to no warehouse and hold no stock.
const VIRTUAL_LOCATIONS = [
  { type: 'vendor', name: 'Vendors', shortCode: 'Vendors', fullName: 'Partners/Vendors' },
  { type: 'customer', name: 'Customers', shortCode: 'Customers', fullName: 'Partners/Customers' },
  { type: 'adjustment', name: 'Adjustment', shortCode: 'Adjustment', fullName: 'Virtual/Adjustment' },
] as const;

let virtualsReady = false;

// Safe to call often: upserts by type, so it only writes on the first call against an empty database
export async function ensureVirtualLocations() {
  if (virtualsReady) return;
  await connectDB();
  await Location.bulkWrite(
    VIRTUAL_LOCATIONS.map((v) => ({
      updateOne: { filter: { type: v.type }, update: { $setOnInsert: { ...v, warehouse: null } }, upsert: true },
    })),
  );
  virtualsReady = true;
}

export async function getVirtualLocation(type: Exclude<LocationType, 'internal'>) {
  await ensureVirtualLocations();
  const location = await Location.findOne({ type }).lean();
  return toLocationRow(location!); // ensureVirtualLocations just made sure it exists
}

export async function listLocations(filter: { type?: LocationType; warehouse?: string } = {}) {
  await ensureVirtualLocations();
  const query: Record<string, string> = {};
  if (filter.type) query.type = filter.type;
  if (filter.warehouse && isValidObjectId(filter.warehouse)) query.warehouse = filter.warehouse;
  const locations = await Location.find(query).sort({ fullName: 1 }).lean();
  return locations.map(toLocationRow);
}

async function findWarehouseForLocation(id: string) {
  const warehouse = await Warehouse.findById(id).lean();
  if (!warehouse) throw new HttpError(400, 'Pick a warehouse', { warehouse: 'Pick a warehouse' });
  return warehouse;
}

export async function createLocation(input: LocationInput) {
  await connectDB();
  const warehouse = await findWarehouseForLocation(input.warehouse);
  try {
    const location = await Location.create({
      ...input,
      type: 'internal',
      fullName: `${warehouse.shortCode}/${input.name}`,
    });
    return toLocationRow(location);
  } catch (err) {
    rethrowDuplicate(err, 'shortCode', 'Short code already exists in this warehouse');
  }
}

export async function updateLocation(id: string, input: LocationInput) {
  checkId(id, 'Location');
  await connectDB();
  const warehouse = await findWarehouseForLocation(input.warehouse);
  let location;
  try {
    // type filter keeps the virtual locations read only
    location = await Location.findOneAndUpdate(
      { _id: id, type: 'internal' },
      { ...input, fullName: `${warehouse.shortCode}/${input.name}` },
      { returnDocument: 'after', runValidators: true },
    ).lean();
  } catch (err) {
    rethrowDuplicate(err, 'shortCode', 'Short code already exists in this warehouse');
  }
  if (!location) throw new HttpError(404, 'Location not found');
  return toLocationRow(location);
}

export async function deleteLocation(id: string) {
  checkId(id, 'Location');
  await connectDB();
  const used =
    (await StockQuant.exists({ location: id })) ||
    (await Operation.exists({ $or: [{ sourceLocation: id }, { destLocation: id }] }));
  if (used) throw new HttpError(409, 'This location has stock or operations, it cannot be deleted');
  const location = await Location.findOneAndDelete({ _id: id, type: 'internal' }).lean();
  if (!location) throw new HttpError(404, 'Location not found');
  return toLocationRow(location);
}
