import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateWarehouseInput,
  QueryWarehouseParams,
  UpdateWarehouseInput,
  WarehouseDetail,
  WarehouseRow,
} from '@/types/warehouse';

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

export async function listWarehouses(
  params?: QueryWarehouseParams,
): Promise<PaginatedResponse<WarehouseRow>> {
  const { data } = await api.get<PaginatedResponse<WarehouseRow>>(
    '/warehouses',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getWarehouse(id: string): Promise<WarehouseDetail> {
  const { data } = await api.get<WarehouseDetail>(`/warehouses/${id}`);
  return data;
}

export async function createWarehouse(
  input: CreateWarehouseInput,
): Promise<WarehouseRow> {
  const { data } = await api.post<WarehouseRow>('/warehouses', input);
  return data;
}

export async function updateWarehouse(
  id: string,
  input: UpdateWarehouseInput,
): Promise<WarehouseRow> {
  const { data } = await api.patch<WarehouseRow>(`/warehouses/${id}`, input);
  return data;
}

export async function deleteWarehouse(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`/warehouses/${id}`);
  return data;
}