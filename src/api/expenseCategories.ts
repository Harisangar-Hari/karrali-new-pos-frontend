import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateExpenseCategoryInput,
  ExpenseCategoryRow,
  QueryExpenseCategoryParams,
  UpdateExpenseCategoryInput,
} from '@/types/expenseCategory';

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

export async function listExpenseCategories(
  params?: QueryExpenseCategoryParams,
): Promise<PaginatedResponse<ExpenseCategoryRow>> {
  const { data } = await api.get<PaginatedResponse<ExpenseCategoryRow>>(
    '/expense-categories',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getExpenseCategory(
  id: string,
): Promise<ExpenseCategoryRow> {
  const { data } = await api.get<ExpenseCategoryRow>(
    `/expense-categories/${id}`,
  );
  return data;
}

export async function createExpenseCategory(
  input: CreateExpenseCategoryInput,
): Promise<ExpenseCategoryRow> {
  const { data } = await api.post<ExpenseCategoryRow>(
    '/expense-categories',
    input,
  );
  return data;
}

export async function updateExpenseCategory(
  id: string,
  input: UpdateExpenseCategoryInput,
): Promise<ExpenseCategoryRow> {
  const { data } = await api.patch<ExpenseCategoryRow>(
    `/expense-categories/${id}`,
    input,
  );
  return data;
}

export async function deleteExpenseCategory(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(
    `/expense-categories/${id}`,
  );
  return data;
}