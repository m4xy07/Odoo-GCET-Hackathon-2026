import { auth, currentUser } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { HttpError } from '@/lib/api';
import { User } from '@/models/User';

// First line of every API route: 401 if signed out, otherwise our Mongo user
export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new HttpError(401, 'Sign in to continue');
  return ensureUser(userId);
}

// Clerk owns the login, Mongo needs a User to point Operation.responsible and StockMove.user at.
// Created lazily on the first request after sign up, so no webhook is needed.
export async function ensureUser(clerkId: string) {
  await connectDB();
  const existing = await User.findOne({ clerkId });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) throw new HttpError(401, 'Sign in to continue');

  const loginId = clerkUser.username ?? clerkUser.id;
  const fields = {
    clerkId,
    loginId,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? `${loginId}@no-email.local`,
    name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || loginId,
  };

  try {
    return await User.findOneAndUpdate({ clerkId }, { $setOnInsert: fields }, { upsert: true, new: true });
  } catch {
    // two first requests raced on the unique clerkId, the other one created it
    const user = await User.findOne({ clerkId });
    if (!user) throw new HttpError(500, 'Could not create your profile');
    return user;
  }
}
