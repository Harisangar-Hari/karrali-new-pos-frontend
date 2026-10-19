import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  adjustStock,
  getProductStock,
  listStockMovements,
} from '@/api/stock';
import type {
  AdjustStockInput,
  QueryStockMovementParams,
} from '@/types/stock';

export function useProductStock(productId: string | null) {
  return useQuery({
    queryKey: qk.stock.product(productId ?? ''),
    queryFn: () => getProductStock(productId!),
    enabled: !!productId,
    staleTime: 30_000,
  });
}

export function useStockMovements(params: QueryStockMovementParams) {
  return useQuery({
    queryKey: qk.stock.ledger(params),
    queryFn: () => listStockMovements(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustStockInput) => adjustStock(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.stock.all });
      qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}