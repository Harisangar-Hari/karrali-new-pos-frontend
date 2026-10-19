import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  bounceSupplierCheque,
  clearSupplierCheque,
  createSupplierCheque,
  getSupplierCheque,
  listSupplierCheques,
  voidSupplierCheque,
} from '@/api/supplierCheques';
import type {
  BounceChequeInput,
  ClearChequeInput,
  CreateSupplierChequeInput,
  QuerySupplierChequeParams,
  VoidChequeInput,
} from '@/types/supplierCheque';

export function useSupplierCheques(params: QuerySupplierChequeParams) {
  return useQuery({
    queryKey: qk.supplierCheques.list(params),
    queryFn: () => listSupplierCheques(params),
    placeholderData: (prev) => prev,
  });
}

export function useSupplierCheque(id: string | null) {
  return useQuery({
    queryKey: qk.supplierCheques.detail(id ?? ''),
    queryFn: () => getSupplierCheque(id!),
    enabled: !!id,
  });
}

function useChequeInvalidations() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.supplierCheques.all });
    qc.invalidateQueries({ queryKey: qk.purchases.all });
    qc.invalidateQueries({ queryKey: qk.supplierPayments.all });
  };
}

export function useCreateSupplierCheque() {
  const invalidate = useChequeInvalidations();
  return useMutation({
    mutationFn: (input: CreateSupplierChequeInput) =>
      createSupplierCheque(input),
    onSuccess: invalidate,
  });
}

export function useClearSupplierCheque() {
  const invalidate = useChequeInvalidations();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClearChequeInput }) =>
      clearSupplierCheque(id, input),
    onSuccess: invalidate,
  });
}

export function useBounceSupplierCheque() {
  const invalidate = useChequeInvalidations();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BounceChequeInput }) =>
      bounceSupplierCheque(id, input),
    onSuccess: invalidate,
  });
}

export function useVoidSupplierCheque() {
  const invalidate = useChequeInvalidations();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VoidChequeInput }) =>
      voidSupplierCheque(id, input),
    onSuccess: invalidate,
  });
}