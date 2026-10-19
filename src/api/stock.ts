import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  AdjustStockInput,
  ProductStockSummary,
  QueryStockMovementParams,
  StockMovementRow,
} from '@/types/stock';

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

export async function getProductStock(
  productId: string,
): Promise<ProductStockSummary> {
  const { data } = await api.get<ProductStockSummary>(
    `/stock/product/${productId}`,
  );
  return data;
}

export async function listStockMovements(
  params?: QueryStockMovementParams,
): Promise<PaginatedResponse<StockMovementRow>> {
  const { data } = await api.get<PaginatedResponse<StockMovementRow>>(
    '/stock/ledger',
    { params: cleanParams(params) },
  );
  return data;
}

export async function adjustStock(
  input: AdjustStockInput,
): Promise<StockMovementRow> {
  const { data } = await api.post<StockMovementRow>('/stock/adjust', input);
  return data;
}