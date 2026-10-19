import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateSupplierPaymentInput,
  QuerySupplierPaymentParams,
  SupplierPaymentRow,
} from '@/types/supplierPayment';

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

export async function listSupplierPayments(
  params?: QuerySupplierPaymentParams,
): Promise<PaginatedResponse<SupplierPaymentRow>> {
  const { data } = await api.get<PaginatedResponse<SupplierPaymentRow>>(
    '/supplier-payments',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getSupplierPayment(
  id: string,
): Promise<SupplierPaymentRow> {
  const { data } = await api.get<SupplierPaymentRow>(
    `/supplier-payments/${id}`,
  );
  return data;
}

export async function createSupplierPayment(
  input: CreateSupplierPaymentInput,
): Promise<SupplierPaymentRow> {
  const { data } = await api.post<SupplierPaymentRow>(
    '/supplier-payments',
    input,
  );
  return data;
}

export async function reverseSupplierPayment(
  id: string,
  reason: string,
): Promise<{ ok: true }> {
  const { data } = await api.post<{ ok: true }>(
    `/supplier-payments/${id}/reverse`,
    { Reason: reason },
  );
  return data;
}