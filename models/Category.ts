import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true },
);

export type CategoryDoc = InferSchemaType<typeof categorySchema>;
export const Category = (models.Category as Model<CategoryDoc>) || model<CategoryDoc>('Category', categorySchema);
