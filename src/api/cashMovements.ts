import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CashMovementRow,
  CreateCashMovementInput,
  QueryCashMovementParams,
} from '@/types/cashMovement';

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

export async function listCashMovements(
  params?: QueryCashMovementParams,
): Promise<PaginatedResponse<CashMovementRow>> {
  const { data } = await api.get<PaginatedResponse<CashMovementRow>>(
    '/cash-movements',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getCashMovement(id: string): Promise<CashMovementRow> {
  const { data } = await api.get<CashMovementRow>(`/cash-movements/${id}`);
  return data;
}

export async function createCashMovement(
  input: CreateCashMovementInput,
): Promise<CashMovementRow> {
  const { data } = await api.post<CashMovementRow>('/cash-movements', input);
  return data;
}

export async function deleteCashMovement(
  id: string,
  reason: string,
): Promise<{ ok: true }> {
  // DELETE with body — axios supports it via `data` in the second arg config.
  const { data } = await api.delete<{ ok: true }>(`/cash-movements/${id}`, {
    data: { Reason: reason },
  });
  return data;
}