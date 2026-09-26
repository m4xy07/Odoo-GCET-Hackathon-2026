import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

// The ledger. Append only: never update, never delete. If a number on screen disagrees with this, this wins.
const stockMoveSchema = new Schema(
  {
    operation: { type: Schema.Types.ObjectId, ref: 'Operation', required: true },
    reference: { type: String, required: true },
    type: { type: String, enum: ['IN', 'OUT', 'INT', 'ADJ'], required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    fromLocation: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    toLocation: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    quantity: { type: Number, required: true, min: [0.001, 'Quantity must be more than 0'] },
    contact: { type: String, default: '' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// move history lists newest first
stockMoveSchema.index({ date: -1 });

export type StockMoveDoc = InferSchemaType<typeof stockMoveSchema>;
export const StockMove = (models.StockMove as Model<StockMoveDoc>) || model<StockMoveDoc>('StockMove', stockMoveSchema);
