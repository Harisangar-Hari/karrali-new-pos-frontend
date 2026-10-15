import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  AdjustBalanceInput,
  CreateCustomerInput,
  CreditStatus,
  CustomerLedgerRow,
  CustomerRow,
  LookupResponse,
  QueryCustomerParams,
  UpdateCustomerInput,
} from '@/types/customer';

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

export async function listCustomers(
  params?: QueryCustomerParams,
): Promise<PaginatedResponse<CustomerRow>> {
  const { data } = await api.get<PaginatedResponse<CustomerRow>>('/customers', {
    params: cleanParams(params),
  });
  return data;
}

export async function getCustomer(id: string): Promise<CustomerRow> {
  const { data } = await api.get<CustomerRow>(`/customers/${id}`);
  return data;
}

export async function getCreditStatus(id: string): Promise<CreditStatus> {
  const { data } = await api.get<CreditStatus>(`/customers/${id}/credit-status`);
  return data;
}

export async function getCustomerLedger(
  id: string,
  params?: { page?: number; limit?: number; Type?: string },
): Promise<PaginatedResponse<CustomerLedgerRow>> {
  const { data } = await api.get<PaginatedResponse<CustomerLedgerRow>>(
    `/customers/${id}/ledger`,
    { params: cleanParams(params) },
  );
  return data;
}

export async function lookupCustomer(
  by: 'code' | 'phone',
  value: string,
): Promise<LookupResponse> {
  const { data } = await api.get<LookupResponse>('/customers/lookup', {
    params: { by, value },
  });
  return data;
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<CustomerRow> {
  const { data } = await api.post<CustomerRow>('/customers', input);
  return data;
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<CustomerRow> {
  const { data } = await api.patch<CustomerRow>(`/customers/${id}`, input);
  return data;
}

export async function adjustCustomerBalance(
  id: string,
  input: AdjustBalanceInput,
): Promise<CustomerRow> {
  const { data } = await api.post<CustomerRow>(
    `/customers/${id}/adjust-balance`,
    input,
  );
  return data;
}

export async function deleteCustomer(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`/customers/${id}`);
  return data;
}