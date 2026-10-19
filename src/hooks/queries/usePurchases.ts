import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  cancelPurchase,
  createPurchase,
  getPurchase,
  listPurchases,
} from '@/api/purchases';
import type {
  CreatePurchaseInput,
  QueryPurchaseParams,
} from '@/types/purchase';

export function usePurchases(params: QueryPurchaseParams) {
  return useQuery({
    queryKey: qk.purchases.list(params),
    queryFn: () => listPurchases(params),
    placeholderData: (prev) => prev,
  });
}

export function usePurchase(id: string | null) {
  return useQuery({
    queryKey: qk.purchases.detail(id ?? ''),
    queryFn: () => getPurchase(id!),
    enabled: !!id,
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePurchaseInput) => createPurchase(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.purchases.all });
      qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}

export function useCancelPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelPurchase(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.purchases.all });
      qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}