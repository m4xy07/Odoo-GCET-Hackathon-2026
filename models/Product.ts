import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    uom: { type: String, enum: ['unit', 'kg', 'g', 'l', 'm', 'box'], default: 'unit' },
    unitCost: { type: Number, required: true, min: 0 }, // INR
    reorderMin: { type: Number, default: 0, min: 0 },
    reorderQty: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', sku: 'text' });

export type ProductDoc = InferSchemaType<typeof productSchema>;
export const Product = (models.Product as Model<ProductDoc>) || model<ProductDoc>('Product', productSchema);
