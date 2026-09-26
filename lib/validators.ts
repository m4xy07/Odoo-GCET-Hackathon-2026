import { z } from 'zod';

// Same schemas run in the browser (react-hook-form) and in every API route, so the messages match.

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Pick a valid option');

// ---- auth (rules from the sign up screen of the mockup) ----

export const loginId = z
  .string()
  .trim()
  .min(6, 'Login ID must be 6 to 12 characters')
  .max(12, 'Login ID must be 6 to 12 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and _ only');

export const email = z.string().trim().email('Enter a valid email');

export const password = z
  .string()
  .min(9, 'Use more than 8 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[^A-Za-z0-9]/, 'Add a special character');

export const signUpSchema = z
  .object({ loginId, email, password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
  // the mockup asks for a "unique" password, we read that as: not built from your Login ID
  .refine((v) => !v.password.toLowerCase().includes(v.loginId.toLowerCase()), {
    path: ['password'],
    message: 'Password cannot contain your Login ID',
  });

export const resetPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

// sign in only checks that something was typed, the real answer comes from Clerk
export const signInSchema = z.object({
  loginId: z.string().trim().min(1, 'Enter your Login ID'),
  password: z.string().min(1, 'Enter your password'),
});

// ---- settings ----

export const warehouseSchema = z.object({
  name: z.string().trim().min(2, 'Name needs at least 2 characters'),
  shortCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,5}$/, 'Short code is 2 to 5 letters or numbers'),
  address: z.string().trim().min(5, 'Address needs at least 5 characters'),
});

export const locationSchema = z.object({
  name: z.string().trim().min(2, 'Name needs at least 2 characters'),
  shortCode: z.string().trim().regex(/^[A-Za-z0-9]{2,10}$/, 'Short code is 2 to 10 letters or numbers'),
  warehouse: objectId,
});

// ---- catalog ----

export const uom = z.enum(['unit', 'kg', 'g', 'l', 'm', 'box']);

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name needs at least 2 characters'),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Name needs at least 2 characters'),
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,20}$/, 'SKU is 3 to 20 letters, numbers or -'),
  category: objectId,
  uom,
  unitCost: z.number().min(0, 'Cost cannot be negative'),
  reorderMin: z.number().int('Whole numbers only').min(0, 'Cannot be negative'),
  reorderQty: z.number().int('Whole numbers only').min(0, 'Cannot be negative'),
  // optional opening stock on create, goes through adjustStock so it shows in the ledger
  initialStock: z.object({ locationId: objectId, quantity: z.number().min(0, 'Cannot be negative') }).optional(),
});

// ---- operations ----

export const opType = z.enum(['IN', 'OUT', 'INT', 'ADJ']);
export const opStatus = z.enum(['draft', 'waiting', 'ready', 'done', 'canceled']);

export const operationLineSchema = z.object({
  product: objectId,
  quantity: z.number().positive('Quantity must be more than 0'),
});

export const operationSchema = z
  .object({
    type: opType,
    contact: z.string().trim().max(80, 'Keep it under 80 characters'),
    sourceLocation: objectId,
    destLocation: objectId,
    scheduledDate: z.coerce.date({ error: 'Pick a schedule date' }),
    deliveryAddress: z.string().trim().max(200, 'Keep it under 200 characters').optional(),
    notes: z.string().trim().max(500, 'Keep it under 500 characters').optional(),
    lines: z.array(operationLineSchema).min(1, 'Add at least one product'),
  })
  .refine((v) => v.sourceLocation !== v.destLocation, { path: ['destLocation'], message: 'From and To must be different' })
  .refine((v) => (v.type !== 'IN' && v.type !== 'OUT') || v.contact.length > 0, {
    path: ['contact'],
    message: 'Contact is required',
  });

export const adjustSchema = z.object({
  productId: objectId,
  locationId: objectId,
  countedQty: z.number().min(0, 'Counted quantity cannot be negative'),
  reason: z.string().trim().max(120, 'Keep it under 120 characters').optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type OperationInput = z.infer<typeof operationSchema>;
export type AdjustInput = z.infer<typeof adjustSchema>;
