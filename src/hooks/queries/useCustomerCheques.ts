import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  bounceCustomerCheque,
  bulkCreateCustomerCheques,
  clearCustomerCheque,
  createCustomerCheque,
  getCustomerCheque,
  listCustomerCheques,
  voidCustomerCheque,
} from '@/api/customerCheques';
import type {
  BounceChequeInput,
  BulkCreateCustomerChequeInput,
  ClearChequeInput,
  CreateCustomerChequeInput,
  QueryCustomerChequeParams,
  VoidChequeInput,
} from '@/types/customerCheque';

export function useCustomerCheques(params: QueryCustomerChequeParams) {
  return useQuery({
    queryKey: qk.customerCheques.list(params),
    queryFn: () => listCustomerCheques(params),
    placeholderData: (prev) => prev,
  });
}

export function useCustomerCheque(id: string | null) {
  return useQuery({
    queryKey: qk.customerCheques.detail(id ?? ''),
    queryFn: () => getCustomerCheque(id!),
    enabled: !!id,
  });
}

/** Shared invalidation — every mutation touches these. */
function useChequeInvalidations() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.customerCheques.all });
    qc.invalidateQueries({ queryKey: qk.customers.all });
    qc.invalidateQueries({ queryKey: qk.sales.all });
  };
}

export function useCreateCustomerCheque() {
  const invalidate = useChequeInvalidations();
  return useMutation({
    mutationFn: (input: CreateCustomerChequeInput) =>
      createCustomerCheque(input),
    onSuccess: invalidate,
  });
}

export function useBulkCreateCustomerCheques() {
  const invalidate = useChequeInvalidations();
  return useMutation({
    mutationFn: (input: BulkCreateCustomerChequeInput) =>
      bulkCreateCustomerCheques(input),
    onSuccess: invalidate,
  });
}

export function useClearCustomerCheque() {
  const invalidate = useChequeInvalidations();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClearChequeInput }) =>
      clearCustomerCheque(id, input),
    onSuccess: invalidate,
  });
}

export function useBounceCustomerCheque() {
  const invalidate = useChequeInvalidations();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BounceChequeInput }) =>
      bounceCustomerCheque(id, input),
    onSuccess: invalidate,
  });
}

export function useVoidCustomerCheque() {
  const invalidate = useChequeInvalidations();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VoidChequeInput }) =>
      voidCustomerCheque(id, input),
    onSuccess: invalidate,
  });
}