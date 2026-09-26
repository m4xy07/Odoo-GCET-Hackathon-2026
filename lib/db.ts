import mongoose from 'mongoose';

// One connection per server process. Dev hot reload and serverless reuse it through globalThis.
const cache = globalThis as unknown as { mongoosePromise?: Promise<typeof mongoose> };

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set, copy .env.example to .env.local');

  cache.mongoosePromise ??= mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'stocksense',
    bufferCommands: false,
  });

  try {
    return await cache.mongoosePromise;
  } catch (err) {
    cache.mongoosePromise = undefined; // let the next request retry instead of caching the failure
    throw err;
  }
}
