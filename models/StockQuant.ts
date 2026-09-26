import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

// How much of one product sits in one internal location. freeToUse = quantity - reserved.
// Only lib/services/inventory.ts writes here, always together with a StockMove.
const stockQuantSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    location: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    quantity: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
  },
  { timestamps: true },
);

stockQuantSchema.index({ product: 1, location: 1 }, { unique: true });

export type StockQuantDoc = InferSchemaType<typeof stockQuantSchema>;
export const StockQuant =
  (models.StockQuant as Model<StockQuantDoc>) || model<StockQuantDoc>('StockQuant', stockQuantSchema);
