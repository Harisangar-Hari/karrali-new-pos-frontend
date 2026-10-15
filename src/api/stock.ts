import { api } from '@/lib/api';
import type { ProductStockSummary } from '@/types/stock';

export async function getProductStock(
  productId: string,
): Promise<ProductStockSummary> {
  const { data } = await api.get<ProductStockSummary>(
    `/stock/product/${productId}`,
  );
  return data;
}