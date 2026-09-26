import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

// Our copy of the Clerk user, created on first request by ensureUser()
const userSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    loginId: { type: String, required: true, unique: true, trim: true, minlength: 6, maxlength: 12 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['manager', 'staff'], default: 'manager' },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = (models.User as Model<UserDoc>) || model<UserDoc>('User', userSchema);
