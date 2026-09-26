import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

// Only internal locations hold real stock. vendor, customer and adjustment are the virtual ends of a move.
const locationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    shortCode: { type: String, required: true, trim: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', default: null },
    type: { type: String, enum: ['internal', 'vendor', 'customer', 'adjustment'], required: true },
    // WH/Stock1 for internal, Partners/Vendors, Partners/Customers, Virtual/Adjustment
    fullName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

locationSchema.index({ warehouse: 1, shortCode: 1 }, { unique: true });

export type LocationDoc = InferSchemaType<typeof locationSchema>;
export const Location = (models.Location as Model<LocationDoc>) || model<LocationDoc>('Location', locationSchema);
