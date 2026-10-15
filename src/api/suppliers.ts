import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateSupplierInput,
  QuerySupplierParams,
  SupplierRow,
  UpdateSupplierInput,
} from '@/types/supplier';

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

export async function listSuppliers(
  params?: QuerySupplierParams,
): Promise<PaginatedResponse<SupplierRow>> {
  const { data } = await api.get<PaginatedResponse<SupplierRow>>('/suppliers', {
    params: cleanParams(params),
  });
  return data;
}

export async function getSupplier(id: string): Promise<SupplierRow> {
  const { data } = await api.get<SupplierRow>(`/suppliers/${id}`);
  return data;
}

export async function createSupplier(
  input: CreateSupplierInput,
): Promise<SupplierRow> {
  const { data } = await api.post<SupplierRow>('/suppliers', input);
  return data;
}

export async function updateSupplier(
  id: string,
  input: UpdateSupplierInput,
): Promise<SupplierRow> {
  const { data } = await api.patch<SupplierRow>(`/suppliers/${id}`, input);
  return data;
}

export async function deleteSupplier(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`/suppliers/${id}`);
  return data;
}