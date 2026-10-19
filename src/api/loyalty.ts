import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  AdjustPointsInput,
  LoyaltyConfig,
  LoyaltyStatus,
  LoyaltyTransactionRow,
  QueryLoyaltyTransactionParams,
} from '@/types/loyalty';

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

export async function getLoyaltyConfig(): Promise<LoyaltyConfig> {
  const { data } = await api.get<LoyaltyConfig>('/loyalty/config');
  return data;
}

export async function getLoyaltyStatus(
  customerId: string,
): Promise<LoyaltyStatus> {
  const { data } = await api.get<LoyaltyStatus>(
    `/loyalty/customers/${customerId}`,
  );
  return data;
}

export async function listLoyaltyTransactions(
  params?: QueryLoyaltyTransactionParams,
): Promise<PaginatedResponse<LoyaltyTransactionRow>> {
  const { data } = await api.get<PaginatedResponse<LoyaltyTransactionRow>>(
    '/loyalty/transactions',
    { params: cleanParams(params) },
  );
  return data;
}

export async function adjustLoyaltyPoints(
  customerId: string,
  input: AdjustPointsInput,
): Promise<LoyaltyStatus> {
  const { data } = await api.post<LoyaltyStatus>(
    `/loyalty/customers/${customerId}/adjust`,
    input,
  );
  return data;
}