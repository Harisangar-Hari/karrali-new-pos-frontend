import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateProductInput,
  ImportProductsInput,
  ImportProductsResult,
  ProductDetail,
  ProductListRow,
  QueryProductParams,
  UpdateProductInput,
} from '@/types/product';

/**
 * Strips undefined values and boolean/string coercions before hitting the
 * network. Prisma-side DTOs use `@Transform` for most things, but sending
 * a lean payload keeps URLs and bodies predictable.
 */
function cleanParams<T extends object>(
  params: T | undefined,
): Record<string, unknown> {
  if (!params) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

export async function listProducts(
  params?: QueryProductParams,
): Promise<PaginatedResponse<ProductListRow>> {
  const { data } = await api.get<PaginatedResponse<ProductListRow>>(
    '/products',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getProduct(id: string): Promise<ProductDetail> {
  const { data } = await api.get<ProductDetail>(`/products/${id}`);
  return data;
}

export async function createProduct(
  input: CreateProductInput,
): Promise<ProductListRow> {
  const { data } = await api.post<ProductListRow>('/products', input);
  return data;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<ProductListRow> {
  const { data } = await api.patch<ProductListRow>(`/products/${id}`, input);
  return data;
}

export async function deleteProduct(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`/products/${id}`);
  return data;
}

export async function importProducts(
  input: ImportProductsInput,
): Promise<ImportProductsResult> {
  const { data } = await api.post<ImportProductsResult>(
    '/products/import',
    input,
  );
  return data;
}