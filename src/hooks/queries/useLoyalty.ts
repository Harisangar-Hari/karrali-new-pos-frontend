import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  adjustLoyaltyPoints,
  getLoyaltyConfig,
  getLoyaltyStatus,
  listLoyaltyTransactions,
} from '@/api/loyalty';
import type {
  AdjustPointsInput,
  QueryLoyaltyTransactionParams,
} from '@/types/loyalty';

export function useLoyaltyConfig() {
  return useQuery({
    queryKey: qk.loyalty.config,
    queryFn: getLoyaltyConfig,
    staleTime: 60_000,
  });
}

export function useLoyaltyStatus(customerId: string | null) {
  return useQuery({
    queryKey: qk.loyalty.customer(customerId ?? ''),
    queryFn: () => getLoyaltyStatus(customerId!),
    enabled: !!customerId,
  });
}

export function useLoyaltyTransactions(
  params: QueryLoyaltyTransactionParams,
) {
  return useQuery({
    queryKey: qk.loyalty.transactions(params),
    queryFn: () => listLoyaltyTransactions(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdjustLoyaltyPoints(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustPointsInput) =>
      adjustLoyaltyPoints(customerId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.loyalty.all });
      qc.invalidateQueries({ queryKey: qk.customers.all });
    },
  });
}