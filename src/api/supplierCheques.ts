import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  BounceChequeInput,
  ClearChequeInput,
  CreateSupplierChequeInput,
  QuerySupplierChequeParams,
  SupplierChequeRow,
  VoidChequeInput,
} from '@/types/supplierCheque';

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

export async function listSupplierCheques(
  params?: QuerySupplierChequeParams,
): Promise<PaginatedResponse<SupplierChequeRow>> {
  const { data } = await api.get<PaginatedResponse<SupplierChequeRow>>(
    '/supplier-cheques',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getSupplierCheque(
  id: string,
): Promise<SupplierChequeRow> {
  const { data } = await api.get<SupplierChequeRow>(`/supplier-cheques/${id}`);
  return data;
}

export async function createSupplierCheque(
  input: CreateSupplierChequeInput,
): Promise<SupplierChequeRow> {
  const { data } = await api.post<SupplierChequeRow>(
    '/supplier-cheques',
    input,
  );
  return data;
}

export async function clearSupplierCheque(
  id: string,
  input: ClearChequeInput,
): Promise<SupplierChequeRow> {
  const { data } = await api.post<SupplierChequeRow>(
    `/supplier-cheques/${id}/clear`,
    input,
  );
  return data;
}

export async function bounceSupplierCheque(
  id: string,
  input: BounceChequeInput,
): Promise<SupplierChequeRow> {
  const { data } = await api.post<SupplierChequeRow>(
    `/supplier-cheques/${id}/bounce`,
    input,
  );
  return data;
}

export async function voidSupplierCheque(
  id: string,
  input: VoidChequeInput,
): Promise<SupplierChequeRow> {
  const { data } = await api.post<SupplierChequeRow>(
    `/supplier-cheques/${id}/void`,
    input,
  );
  return data;
}