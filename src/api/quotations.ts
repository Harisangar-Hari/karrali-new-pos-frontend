import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  ChangeQuotationStatusInput,
  ConvertQuotationInput,
  CreateQuotationInput,
  QuotationDetail,
  QuotationListRow,
  QueryQuotationParams,
  UpdateQuotationInput,
} from '@/types/quotation';

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

export async function listQuotations(
  params?: QueryQuotationParams,
): Promise<PaginatedResponse<QuotationListRow>> {
  const { data } = await api.get<PaginatedResponse<QuotationListRow>>(
    '/quotations',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getQuotation(id: string): Promise<QuotationDetail> {
  const { data } = await api.get<QuotationDetail>(`/quotations/${id}`);
  return data;
}

export async function createQuotation(
  input: CreateQuotationInput,
): Promise<QuotationDetail> {
  const { data } = await api.post<QuotationDetail>('/quotations', input);
  return data;
}

export async function updateQuotation(
  id: string,
  input: UpdateQuotationInput,
): Promise<QuotationDetail> {
  const { data } = await api.patch<QuotationDetail>(
    `/quotations/${id}`,
    input,
  );
  return data;
}

export async function sendQuotation(id: string): Promise<QuotationDetail> {
  const { data } = await api.post<QuotationDetail>(`/quotations/${id}/send`);
  return data;
}

export async function acceptQuotation(id: string): Promise<QuotationDetail> {
  const { data } = await api.post<QuotationDetail>(`/quotations/${id}/accept`);
  return data;
}

export async function rejectQuotation(
  id: string,
  input: ChangeQuotationStatusInput,
): Promise<QuotationDetail> {
  const { data } = await api.post<QuotationDetail>(
    `/quotations/${id}/reject`,
    input,
  );
  return data;
}

export async function cancelQuotation(
  id: string,
  input: ChangeQuotationStatusInput,
): Promise<QuotationDetail> {
  const { data } = await api.post<QuotationDetail>(
    `/quotations/${id}/cancel`,
    input,
  );
  return data;
}

export async function convertQuotation(
  id: string,
  input: ConvertQuotationInput,
): Promise<QuotationDetail> {
  const { data } = await api.post<QuotationDetail>(
    `/quotations/${id}/convert`,
    input,
  );
  return data;
}

export async function deleteQuotation(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`/quotations/${id}`);
  return data;
}