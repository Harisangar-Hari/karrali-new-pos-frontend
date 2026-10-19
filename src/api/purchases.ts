import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreatePurchaseInput,
  PurchaseDetail,
  PurchaseListRow,
  QueryPurchaseParams,
} from '@/types/purchase';

function cleanParams<T extends object>(
  params: T | undefined,
): Record<string, unknown> {
  if (!params) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

export async function listPurchases(
  params?: QueryPurchaseParams,
): Promise<PaginatedResponse<PurchaseListRow>> {
  const { data } = await api.get<PaginatedResponse<PurchaseListRow>>(
    '/purchases',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getPurchase(id: string): Promise<PurchaseDetail> {
  const { data } = await api.get<PurchaseDetail>(`/purchases/${id}`);
  return data;
}

export async function createPurchase(
  input: CreatePurchaseInput,
): Promise<PurchaseDetail> {
  const { data } = await api.post<PurchaseDetail>('/purchases', input);
  return data;
}

export async function cancelPurchase(
  id: string,
  reason?: string,
): Promise<PurchaseDetail> {
  const { data } = await api.post<PurchaseDetail>(`/purchases/${id}/cancel`, {
    Reason: reason,
  });
  return data;
}