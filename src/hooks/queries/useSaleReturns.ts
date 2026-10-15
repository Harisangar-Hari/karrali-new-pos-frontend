import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createSaleReturn,
  getSaleReturn,
  listSaleReturns,
} from '@/api/saleReturns';
import type {
  CreateSaleReturnInput,
  QuerySaleReturnParams,
} from '@/types/saleReturn';

export function useSaleReturns(params: QuerySaleReturnParams) {
  return useQuery({
    queryKey: qk.saleReturns.list(params),
    queryFn: () => listSaleReturns(params),
    placeholderData: (prev) => prev,
  });
}

export function useSaleReturn(id: string | null) {
  return useQuery({
    queryKey: qk.saleReturns.detail(id ?? ''),
    queryFn: () => getSaleReturn(id!),
    enabled: !!id,
  });
}

export function useCreateSaleReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleReturnInput) => createSaleReturn(input),
    onSuccess: () => {
      // Return affects: sale status, customer balance, stock, cash ledger.
      qc.invalidateQueries({ queryKey: qk.saleReturns.all });
      qc.invalidateQueries({ queryKey: qk.sales.all });
      qc.invalidateQueries({ queryKey: qk.customers.all });
      qc.invalidateQueries({ queryKey: qk.products.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}