import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CategoryRow,
  CreateCategoryInput,
  QueryCategoryParams,
  UpdateCategoryInput,
} from '@/types/category';

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

export async function listCategories(
  params?: QueryCategoryParams,
): Promise<PaginatedResponse<CategoryRow>> {
  const { data } = await api.get<PaginatedResponse<CategoryRow>>('/categories', {
    params: cleanParams(params),
  });
  return data;
}

export async function getCategory(id: string): Promise<CategoryRow> {
  const { data } = await api.get<CategoryRow>(`/categories/${id}`);
  return data;
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<CategoryRow> {
  const { data } = await api.post<CategoryRow>('/categories', input);
  return data;
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<CategoryRow> {
  const { data } = await api.patch<CategoryRow>(`/categories/${id}`, input);
  return data;
}

export async function deleteCategory(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`/categories/${id}`);
  return data;
}