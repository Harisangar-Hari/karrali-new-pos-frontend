import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateSaleInput,
  QuerySaleParams,
  SaleDetail,
  SaleListRow,
} from '@/types/sale';

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

export async function createSale(input: CreateSaleInput): Promise<SaleDetail> {
  const { data } = await api.post<SaleDetail>('/sales', input);
  return data;
}

export async function listSales(
  params?: QuerySaleParams,
): Promise<PaginatedResponse<SaleListRow>> {
  const { data } = await api.get<PaginatedResponse<SaleListRow>>('/sales', {
    params: cleanParams(params),
  });
  return data;
}

export async function getSale(id: string): Promise<SaleDetail> {
  const { data } = await api.get<SaleDetail>(`/sales/${id}`);
  return data;
}