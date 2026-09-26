import { isValidObjectId } from 'mongoose';
import { HttpError } from '@/lib/api';
import { connectDB } from '@/lib/db';
import { adjustStock } from '@/lib/services/inventory';
import type { ProductDetail, ProductRow, ProductStockRow } from '@/lib/types';
import type { CategoryInput, LocationInput, ProductInput, WarehouseInput } from '@/lib/validators';
import { Category } from '@/models/Category';
import { Location } from '@/models/Location';
import { Operation } from '@/models/Operation';
import { Product } from '@/models/Product';
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

// Partners/Vendors, Partners/Customers and Virtual/Adjustment come from virtualLocation() in operations.ts
export async function listLocations(filter: { type?: LocationType; warehouse?: string } = {}) {
  await connectDB();
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

// ---- categories ----

export type CategoryRow = { id: string; name: string };

export async function listCategories() {
  await connectDB();
  const categories = await Category.find().sort({ name: 1 }).lean();
  return categories.map((c): CategoryRow => ({ id: String(c._id), name: c.name }));
}

export async function createCategory(input: CategoryInput): Promise<CategoryRow> {
  await connectDB();
  try {
    const category = await Category.create(input);
    return { id: String(category._id), name: category.name };
  } catch (err) {
    rethrowDuplicate(err, 'name', 'Category already exists');
  }
}

// ---- products ----

// out = nothing on hand, low = at or below the reorder point
export function stockState(onHand: number, reorderMin: number): ProductRow['stockState'] {
  if (onHand <= 0) return 'out';
  return onHand <= reorderMin ? 'low' : 'ok';
}

// Totals over every location. Quants only ever exist for internal locations.
async function stockTotals(productIds: unknown[]) {
  const rows = await StockQuant.aggregate<{ _id: unknown; onHand: number; reserved: number }>([
    { $match: { product: { $in: productIds } } },
    { $group: { _id: '$product', onHand: { $sum: '$quantity' }, reserved: { $sum: '$reserved' } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

// SKU search wants "desk" to find DESK001, so a regex beats the word based text index
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type ProductDoc = {
  _id: unknown;
  name: string;
  sku: string;
  category: { _id: unknown; name: string } | null;
  uom?: string | null;
  unitCost: number;
  reorderMin?: number | null;
  reorderQty?: number | null;
  active?: boolean | null;
};

function toProductDetail(p: ProductDoc, total?: { onHand: number; reserved: number }): ProductDetail {
  const onHand = total?.onHand ?? 0;
  const reorderMin = p.reorderMin ?? 0;
  return {
    id: String(p._id),
    name: p.name,
    sku: p.sku,
    category: p.category?.name ?? '',
    categoryId: p.category ? String(p.category._id) : '',
    uom: p.uom ?? 'unit',
    unitCost: p.unitCost,
    reorderMin,
    reorderQty: p.reorderQty ?? 0,
    active: p.active ?? true,
    onHand,
    freeToUse: onHand - (total?.reserved ?? 0),
    stockState: stockState(onHand, reorderMin),
  };
}

export type ProductFilters = { q?: string; category?: string; state?: ProductRow['stockState'] };

export async function listProducts(filters: ProductFilters = {}): Promise<ProductRow[]> {
  await connectDB();
  const query: Record<string, unknown> = { active: true };
  if (filters.q?.trim()) {
    const match = new RegExp(escapeRegex(filters.q.trim()), 'i');
    query.$or = [{ name: match }, { sku: match }];
  }
  if (filters.category && isValidObjectId(filters.category)) query.category = filters.category;

  const products = await Product.find(query).sort({ name: 1 }).populate<Pick<ProductDoc, 'category'>>('category', 'name').lean();
  const totals = await stockTotals(products.map((p) => p._id));
  const rows = products.map((p) => toProductDetail(p, totals.get(String(p._id))));
  return filters.state ? rows.filter((r) => r.stockState === filters.state) : rows;
}

export async function getProduct(id: string) {
  checkId(id, 'Product');
  await connectDB();
  const product = await Product.findById(id).populate<Pick<ProductDoc, 'category'>>('category', 'name').lean();
  if (!product) throw new HttpError(404, 'Product not found');
  return toProductDetail(product, (await stockTotals([product._id])).get(id));
}

async function checkCategory(id: string) {
  if (!(await Category.exists({ _id: id }))) throw new HttpError(400, 'Pick a category', { category: 'Pick a category' });
}

export async function createProduct({ initialStock, ...fields }: ProductInput, userId: string) {
  await connectDB();
  await checkCategory(fields.category);
  const opening = initialStock && initialStock.quantity > 0 ? initialStock : null;
  // check the location before creating anything, so a bad pick never leaves a half made product
  if (opening && !(await Location.exists({ _id: opening.locationId, type: 'internal' }))) {
    throw new HttpError(400, 'Pick a stock location', { 'initialStock.locationId': 'Pick a stock location' });
  }

  let productId: string;
  try {
    productId = String((await Product.create(fields))._id);
  } catch (err) {
    rethrowDuplicate(err, 'sku', 'SKU already exists');
  }

  // opening stock goes through an adjustment, so the ledger explains every unit on hand
  if (opening) {
    try {
      await adjustStock({ productId, locationId: opening.locationId, countedQty: opening.quantity, reason: 'Initial stock' }, userId);
    } catch (err) {
      await Product.deleteOne({ _id: productId }); // no moves exist yet, so removing it is safe
      throw err;
    }
  }
  return getProduct(productId);
}

// Stock never changes here. On hand only moves through operations and adjustments.
export async function updateProduct(id: string, input: ProductInput) {
  checkId(id, 'Product');
  await connectDB();
  const { initialStock, ...fields } = input;
  void initialStock; // opening stock only applies when creating
  await checkCategory(fields.category);
  let product;
  try {
    product = await Product.findByIdAndUpdate(id, fields, { returnDocument: 'after', runValidators: true }).lean();
  } catch (err) {
    rethrowDuplicate(err, 'sku', 'SKU already exists');
  }
  if (!product) throw new HttpError(404, 'Product not found');
  return getProduct(id);
}

// Archive instead of delete: old moves and operations still point at the product
export async function archiveProduct(id: string) {
  checkId(id, 'Product');
  await connectDB();
  const product = await Product.findByIdAndUpdate(id, { active: false }).lean();
  if (!product) throw new HttpError(404, 'Product not found');
  return { id };
}

export async function getProductStock(id: string): Promise<ProductStockRow[]> {
  checkId(id, 'Product');
  await connectDB();
  const quants = await StockQuant.find({ product: id, $or: [{ quantity: { $ne: 0 } }, { reserved: { $ne: 0 } }] })
    .populate<{ location: { _id: unknown; fullName: string; type: string } | null }>('location', 'fullName type')
    .lean();
  return quants
    .flatMap((q) => (q.location?.type === 'internal' ? [{ ...q, location: q.location }] : []))
    .map((q) => ({
      locationId: String(q.location._id),
      location: q.location.fullName,
      quantity: q.quantity ?? 0,
      reserved: q.reserved ?? 0,
      freeToUse: (q.quantity ?? 0) - (q.reserved ?? 0),
    }))
    .sort((a, b) => a.location.localeCompare(b.location));
}
