import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createSupplierPayment,
  getSupplierPayment,
  listSupplierPayments,
  reverseSupplierPayment,
} from '@/api/supplierPayments';
import type {
  CreateSupplierPaymentInput,
  QuerySupplierPaymentParams,
} from '@/types/supplierPayment';

export function useSupplierPayments(params: QuerySupplierPaymentParams) {
  return useQuery({
    queryKey: qk.supplierPayments.list(params),
    queryFn: () => listSupplierPayments(params),
    placeholderData: (prev) => prev,
  });
}

export function useSupplierPayment(id: string | null) {
  return useQuery({
    queryKey: qk.supplierPayments.detail(id ?? ''),
    queryFn: () => getSupplierPayment(id!),
    enabled: !!id,
  });
}

export function useCreateSupplierPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupplierPaymentInput) =>
      createSupplierPayment(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.supplierPayments.all });
      qc.invalidateQueries({ queryKey: qk.purchases.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}

export function useReverseSupplierPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      reverseSupplierPayment(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.supplierPayments.all });
      qc.invalidateQueries({ queryKey: qk.purchases.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}