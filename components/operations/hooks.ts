'use client';

import useSWR from 'swr';
import type { OperationDetail, OpType, ProductRow, ProductStockRow } from '@/lib/types';
import { fetcher } from './request';

export type StockLocation = { id: string; fullName: string };

export const useOperation = (id: string) => useSWR<OperationDetail>(`/api/operations/${id}`, fetcher);

// Loaded once: refetching on focus would wipe what the user typed. Keeping the previous
// answer while a new type loads stops the form unmounting when Operation type changes.
export const useBlankOperation = (type: OpType) =>
  useSWR<OperationDetail>(`/api/operations/new?type=${type}`, fetcher, { revalidateOnFocus: false, keepPreviousData: true });

export const useProducts = () => useSWR<ProductRow[]>('/api/products', fetcher);

export const useStockLocations = () => useSWR<StockLocation[]>('/api/locations?type=internal', fetcher);

// Only locations that hold the product come back, a missing one means 0 on hand
export const useProductStock = (productId: string) =>
  useSWR<ProductStockRow[]>(productId ? `/api/products/${productId}/stock` : null, fetcher);
