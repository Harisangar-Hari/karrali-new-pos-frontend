import { useQueries } from '@tanstack/react-query';
import { getProductStock } from '@/api/stock';
import { qk } from '@/config/queryKeys';
import type { ProductStockSummary } from '@/types/stock';

/**
 * Batches N parallel stock lookups for the given product IDs. React Query
 * caches each product individually (60s stale), so repeated searches of
 * the same products are free.
 */
export function useProductStocks(productIds: string[]) {
  return useQueries({
    queries: productIds.map((id) => ({
      queryKey: qk.stock.product(id),
      queryFn: () => getProductStock(id),
      staleTime: 60_000,
    })),
  });
}

export function pickWarehouseQty(
  summary: ProductStockSummary | undefined,
  warehouseId: string | undefined,
): number | null {
  if (!summary) return null;
  if (!warehouseId) return summary.Total;
  const row = summary.Warehouses.find((w) => w.WarehouseId === warehouseId);
  return row?.Qty ?? 0;
}