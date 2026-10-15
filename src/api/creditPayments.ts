import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateCreditPaymentInput,
  CreditPaymentRow,
  QueryCreditPaymentParams,
} from '@/types/creditPayment';

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

export async function listCreditPayments(
  params?: QueryCreditPaymentParams,
): Promise<PaginatedResponse<CreditPaymentRow>> {
  const { data } = await api.get<PaginatedResponse<CreditPaymentRow>>(
    '/credit-payments',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getCreditPayment(
  id: string,
): Promise<CreditPaymentRow> {
  const { data } = await api.get<CreditPaymentRow>(`/credit-payments/${id}`);
  return data;
}

export async function createCreditPayment(
  input: CreateCreditPaymentInput,
): Promise<CreditPaymentRow> {
  const { data } = await api.post<CreditPaymentRow>('/credit-payments', input);
  return data;
}

export async function reverseCreditPayment(
  id: string,
  reason: string,
): Promise<{ ok: true }> {
  const { data } = await api.post<{ ok: true }>(
    `/credit-payments/${id}/reverse`,
    { Reason: reason },
  );
  return data;
}