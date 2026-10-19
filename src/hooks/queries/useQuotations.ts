import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  acceptQuotation,
  cancelQuotation,
  convertQuotation,
  createQuotation,
  deleteQuotation,
  getQuotation,
  listQuotations,
  rejectQuotation,
  sendQuotation,
  updateQuotation,
} from '@/api/quotations';
import type {
  ChangeQuotationStatusInput,
  ConvertQuotationInput,
  CreateQuotationInput,
  QueryQuotationParams,
  UpdateQuotationInput,
} from '@/types/quotation';

export function useQuotations(params: QueryQuotationParams) {
  return useQuery({
    queryKey: qk.quotations.list(params),
    queryFn: () => listQuotations(params),
    placeholderData: (prev) => prev,
  });
}

export function useQuotation(id: string | null) {
  return useQuery({
    queryKey: qk.quotations.detail(id ?? ''),
    queryFn: () => getQuotation(id!),
    enabled: !!id,
  });
}

function useQuotationInvalidations() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.quotations.all });
  };
}

export function useCreateQuotation() {
  const invalidate = useQuotationInvalidations();
  return useMutation({
    mutationFn: (input: CreateQuotationInput) => createQuotation(input),
    onSuccess: invalidate,
  });
}

export function useUpdateQuotation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateQuotationInput) => updateQuotation(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.quotations.all });
      qc.invalidateQueries({ queryKey: qk.quotations.detail(id) });
    },
  });
}

export function useSendQuotation() {
  const invalidate = useQuotationInvalidations();
  return useMutation({
    mutationFn: (id: string) => sendQuotation(id),
    onSuccess: invalidate,
  });
}

export function useAcceptQuotation() {
  const invalidate = useQuotationInvalidations();
  return useMutation({
    mutationFn: (id: string) => acceptQuotation(id),
    onSuccess: invalidate,
  });
}

export function useRejectQuotation() {
  const invalidate = useQuotationInvalidations();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ChangeQuotationStatusInput;
    }) => rejectQuotation(id, input),
    onSuccess: invalidate,
  });
}

export function useCancelQuotation() {
  const invalidate = useQuotationInvalidations();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ChangeQuotationStatusInput;
    }) => cancelQuotation(id, input),
    onSuccess: invalidate,
  });
}

export function useConvertQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ConvertQuotationInput;
    }) => convertQuotation(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.quotations.all });
      qc.invalidateQueries({ queryKey: qk.sales.all });
      qc.invalidateQueries({ queryKey: qk.products.all });
      qc.invalidateQueries({ queryKey: qk.customers.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}

export function useDeleteQuotation() {
  const invalidate = useQuotationInvalidations();
  return useMutation({
    mutationFn: (id: string) => deleteQuotation(id),
    onSuccess: invalidate,
  });
}