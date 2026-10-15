import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  BounceChequeInput,
  BulkCreateCustomerChequeInput,
  BulkCreateCustomerChequeResponse,
  ClearChequeInput,
  CreateCustomerChequeInput,
  CustomerChequeRow,
  QueryCustomerChequeParams,
  VoidChequeInput,
} from '@/types/customerCheque';

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

export async function listCustomerCheques(
  params?: QueryCustomerChequeParams,
): Promise<PaginatedResponse<CustomerChequeRow>> {
  const { data } = await api.get<PaginatedResponse<CustomerChequeRow>>(
    '/customer-cheques',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getCustomerCheque(
  id: string,
): Promise<CustomerChequeRow> {
  const { data } = await api.get<CustomerChequeRow>(
    `/customer-cheques/${id}`,
  );
  return data;
}

export async function createCustomerCheque(
  input: CreateCustomerChequeInput,
): Promise<CustomerChequeRow> {
  const { data } = await api.post<CustomerChequeRow>(
    '/customer-cheques',
    input,
  );
  return data;
}

export async function bulkCreateCustomerCheques(
  input: BulkCreateCustomerChequeInput,
): Promise<BulkCreateCustomerChequeResponse> {
  const { data } = await api.post<BulkCreateCustomerChequeResponse>(
    '/customer-cheques/bulk',
    input,
  );
  return data;
}

export async function clearCustomerCheque(
  id: string,
  input: ClearChequeInput,
): Promise<CustomerChequeRow> {
  const { data } = await api.post<CustomerChequeRow>(
    `/customer-cheques/${id}/clear`,
    input,
  );
  return data;
}

export async function bounceCustomerCheque(
  id: string,
  input: BounceChequeInput,
): Promise<CustomerChequeRow> {
  const { data } = await api.post<CustomerChequeRow>(
    `/customer-cheques/${id}/bounce`,
    input,
  );
  return data;
}

export async function voidCustomerCheque(
  id: string,
  input: VoidChequeInput,
): Promise<CustomerChequeRow> {
  const { data } = await api.post<CustomerChequeRow>(
    `/customer-cheques/${id}/void`,
    input,
  );
  return data;
}