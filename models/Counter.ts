import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

// Reference sequences, one per key like "WH/IN". Bumped with a single atomic $inc so two users never get the same number.
const counterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export type CounterDoc = InferSchemaType<typeof counterSchema>;
export const Counter = (models.Counter as Model<CounterDoc>) || model<CounterDoc>('Counter', counterSchema);
