import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateSaleReturnInput,
  QuerySaleReturnParams,
  SaleReturnDetail,
  SaleReturnListRow,
} from '@/types/saleReturn';

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

export async function listSaleReturns(
  params?: QuerySaleReturnParams,
): Promise<PaginatedResponse<SaleReturnListRow>> {
  const { data } = await api.get<PaginatedResponse<SaleReturnListRow>>(
    '/sale-returns',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getSaleReturn(id: string): Promise<SaleReturnDetail> {
  const { data } = await api.get<SaleReturnDetail>(`/sale-returns/${id}`);
  return data;
}

export async function createSaleReturn(
  input: CreateSaleReturnInput,
): Promise<SaleReturnDetail> {
  const { data } = await api.post<SaleReturnDetail>('/sale-returns', input);
  return data;
}