import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createCreditPayment,
  getCreditPayment,
  listCreditPayments,
  reverseCreditPayment,
} from '@/api/creditPayments';
import type {
  CreateCreditPaymentInput,
  QueryCreditPaymentParams,
} from '@/types/creditPayment';

export function useCreditPayments(params: QueryCreditPaymentParams) {
  return useQuery({
    queryKey: qk.creditPayments.list(params),
    queryFn: () => listCreditPayments(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreditPayment(id: string | null) {
  return useQuery({
    queryKey: qk.creditPayments.detail(id ?? ''),
    queryFn: () => getCreditPayment(id!),
    enabled: !!id,
  });
}

export function useCreateCreditPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCreditPaymentInput) => createCreditPayment(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.creditPayments.all });
      qc.invalidateQueries({ queryKey: qk.customers.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}

export function useReverseCreditPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      reverseCreditPayment(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.creditPayments.all });
      qc.invalidateQueries({ queryKey: qk.customers.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}