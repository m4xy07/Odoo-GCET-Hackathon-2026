import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const lineSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: [0.001, 'Quantity must be more than 0'] },
    available: { type: Boolean }, // false paints the line red on a delivery
  },
  { _id: false },
);

// The document the user edits: a receipt, delivery, internal transfer or adjustment
const operationSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true }, // WH/IN/0001
    type: { type: String, enum: ['IN', 'OUT', 'INT', 'ADJ'], required: true },
    status: { type: String, enum: ['draft', 'waiting', 'ready', 'done', 'canceled'], default: 'draft' },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    contact: { type: String, trim: true, default: '' }, // required for IN and OUT, enforced in lib/validators.ts
    sourceLocation: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    destLocation: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    scheduledDate: { type: Date, required: true },
    responsible: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deliveryAddress: { type: String, trim: true },
    notes: { type: String, trim: true },
    lines: { type: [lineSchema], default: [] },
    doneAt: { type: Date },
  },
  { timestamps: true },
);

// lists and dashboard counts filter by type and status, then sort by date
operationSchema.index({ type: 1, status: 1, scheduledDate: 1 });

export type OperationDoc = InferSchemaType<typeof operationSchema>;
export const Operation = (models.Operation as Model<OperationDoc>) || model<OperationDoc>('Operation', operationSchema);
