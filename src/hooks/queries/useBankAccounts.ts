import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createBankAccount,
  deleteBankAccount,
  getBankAccount,
  listBankAccounts,
  updateBankAccount,
} from '@/api/bankAccounts';
import type {
  CreateBankAccountInput,
  QueryBankAccountParams,
  UpdateBankAccountInput,
} from '@/types/bankAccount';

export function useBankAccounts(params: QueryBankAccountParams) {
  return useQuery({
    queryKey: qk.bankAccounts.list(params),
    queryFn: () => listBankAccounts(params),
    placeholderData: (prev) => prev,
  });
}

export function useBankAccount(id: string | null) {
  return useQuery({
    queryKey: qk.bankAccounts.detail(id ?? ''),
    queryFn: () => getBankAccount(id!),
    enabled: !!id,
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBankAccountInput) => createBankAccount(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.bankAccounts.all });
    },
  });
}

export function useUpdateBankAccount(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBankAccountInput) => updateBankAccount(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.bankAccounts.all });
      qc.invalidateQueries({ queryKey: qk.bankAccounts.detail(id) });
    },
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBankAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.bankAccounts.all });
    },
  });
}