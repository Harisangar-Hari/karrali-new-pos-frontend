import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  BrandRow,
  CreateBrandInput,
  QueryBrandParams,
  UpdateBrandInput,
} from '@/types/brand';

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

export async function listBrands(
  params?: QueryBrandParams,
): Promise<PaginatedResponse<BrandRow>> {
  const { data } = await api.get<PaginatedResponse<BrandRow>>('/brands', {
    params: cleanParams(params),
  });
  return data;
}

export async function getBrand(id: string): Promise<BrandRow> {
  const { data } = await api.get<BrandRow>(`/brands/${id}`);
  return data;
}

export async function createBrand(
  input: CreateBrandInput,
): Promise<BrandRow> {
  const { data } = await api.post<BrandRow>('/brands', input);
  return data;
}

export async function updateBrand(
  id: string,
  input: UpdateBrandInput,
): Promise<BrandRow> {
  const { data } = await api.patch<BrandRow>(`/brands/${id}`, input);
  return data;
}

export async function deleteBrand(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`/brands/${id}`);
  return data;
}