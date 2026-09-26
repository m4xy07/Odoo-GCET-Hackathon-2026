import type { ClientSession } from 'mongoose';
import type { OpType } from '@/lib/types';
import { Counter } from '@/models/Counter';

// WH/IN/0001: warehouse short code, operation type, sequence padded to 4 digits
export const formatReference = (shortCode: string, type: OpType, seq: number) =>
  `${shortCode}/${type}/${String(seq).padStart(4, '0')}`;

// One atomic $inc per call, so two people saving at the same moment never get the same number
export async function nextReference(shortCode: string, type: OpType, session?: ClientSession) {
  const counter = await Counter.findOneAndUpdate(
    { key: `${shortCode}/${type}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', session },
  );
  return formatReference(shortCode, type, counter!.seq); // upsert always returns a document
}
