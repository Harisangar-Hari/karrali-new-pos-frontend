import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  adjustCustomerBalance,
  createCustomer,
  deleteCustomer,
  getCreditStatus,
  getCustomer,
  getCustomerLedger,
  listCustomers,
  updateCustomer,
} from '@/api/customers';
import type {
  AdjustBalanceInput,
  CreateCustomerInput,
  QueryCustomerParams,
  UpdateCustomerInput,
} from '@/types/customer';

export function useCustomers(params: QueryCustomerParams) {
  return useQuery({
    queryKey: qk.customers.list(params),
    queryFn: () => listCustomers(params),
    placeholderData: (prev) => prev,
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: qk.customers.detail(id ?? ''),
    queryFn: () => getCustomer(id!),
    enabled: !!id,
  });
}

export function useCustomerCreditStatus(id: string | null) {
  return useQuery({
    queryKey: qk.customers.creditStatus(id ?? ''),
    queryFn: () => getCreditStatus(id!),
    enabled: !!id,
  });
}

export function useCustomerLedger(
  id: string | null,
  params?: { page?: number; limit?: number; Type?: string },
) {
  return useQuery({
    queryKey: qk.customers.ledger(id ?? '', params),
    queryFn: () => getCustomerLedger(id!, params),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => createCustomer(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.customers.all });
    },
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => updateCustomer(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.customers.all });
      qc.invalidateQueries({ queryKey: qk.customers.detail(id) });
      qc.invalidateQueries({ queryKey: qk.customers.creditStatus(id) });
    },
  });
}

export function useAdjustCustomerBalance(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustBalanceInput) => adjustCustomerBalance(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.customers.all });
      qc.invalidateQueries({ queryKey: qk.customers.detail(id) });
      qc.invalidateQueries({ queryKey: qk.customers.creditStatus(id) });
      qc.invalidateQueries({ queryKey: qk.customers.ledger(id, undefined) });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.customers.all });
    },
  });
}