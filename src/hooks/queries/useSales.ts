import { useQuery } from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import { getSale, listSales } from '@/api/sales';
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