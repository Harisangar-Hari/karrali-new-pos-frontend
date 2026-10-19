import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import { cancelSale, getSale, listSales } from '@/api/sales';
import type { QuerySaleParams } from '@/types/sale';

export function useSales(params: QuerySaleParams) {
  return useQuery({
    queryKey: qk.sales.list(params),
    queryFn: () => listSales(params),
    placeholderData: (prev) => prev,
  });
}

export function useSale(id: string | null) {
  return useQuery({
    queryKey: qk.sales.detail(id ?? ''),
    queryFn: () => getSale(id!),
    enabled: !!id,
  });
}

export function useCancelSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelSale(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.sales.all });
      qc.invalidateQueries({ queryKey: qk.products.all });
      qc.invalidateQueries({ queryKey: qk.customers.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}