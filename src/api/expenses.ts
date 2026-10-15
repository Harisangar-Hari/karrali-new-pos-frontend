import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateExpenseInput,
  ExpenseRow,
  QueryExpenseParams,
  UpdateExpenseInput,
} from '@/types/expense';

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

export async function listExpenses(
  params?: QueryExpenseParams,
): Promise<PaginatedResponse<ExpenseRow>> {
  const { data } = await api.get<PaginatedResponse<ExpenseRow>>('/expenses', {
    params: cleanParams(params),
  });
  return data;
}

export async function getExpense(id: string): Promise<ExpenseRow> {
  const { data } = await api.get<ExpenseRow>(`/expenses/${id}`);
  return data;
}

export async function createExpense(
  input: CreateExpenseInput,
): Promise<ExpenseRow> {
  const { data } = await api.post<ExpenseRow>('/expenses', input);
  return data;
}

export async function updateExpense(
  id: string,
  input: UpdateExpenseInput,
): Promise<ExpenseRow> {
  const { data } = await api.patch<ExpenseRow>(`/expenses/${id}`, input);
  return data;
}

export async function deleteExpense(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`/expenses/${id}`);
  return data;
}