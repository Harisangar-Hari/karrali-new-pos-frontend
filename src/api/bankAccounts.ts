import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  BankAccountRow,
  CreateBankAccountInput,
  QueryBankAccountParams,
  UpdateBankAccountInput,
} from '@/types/bankAccount';

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

export async function listBankAccounts(
  params?: QueryBankAccountParams,
): Promise<PaginatedResponse<BankAccountRow>> {
  const { data } = await api.get<PaginatedResponse<BankAccountRow>>(
    '/bank-accounts',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getBankAccount(id: string): Promise<BankAccountRow> {
  const { data } = await api.get<BankAccountRow>(`/bank-accounts/${id}`);
  return data;
}

export async function createBankAccount(
  input: CreateBankAccountInput,
): Promise<BankAccountRow> {
  const { data } = await api.post<BankAccountRow>('/bank-accounts', input);
  return data;
}

export async function updateBankAccount(
  id: string,
  input: UpdateBankAccountInput,
): Promise<BankAccountRow> {
  const { data } = await api.patch<BankAccountRow>(`/bank-accounts/${id}`, input);
  return data;
}

export async function deleteBankAccount(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`/bank-accounts/${id}`);
  return data;
}