import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const warehouseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // prefix of every reference, the WH in WH/IN/0001
    shortCode: { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 2, maxlength: 5 },
    address: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type WarehouseDoc = InferSchemaType<typeof warehouseSchema>;
export const Warehouse = (models.Warehouse as Model<WarehouseDoc>) || model<WarehouseDoc>('Warehouse', warehouseSchema);
