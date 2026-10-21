import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createProduct,
  deleteProduct,
  getProduct,
  importProducts,
  listProducts,
  updateProduct,
} from '@/api/products';
import type {
  CreateProductInput,
  ImportProductsInput,
  QueryProductParams,
  UpdateProductInput,
} from '@/types/product';

export function useProducts(params: QueryProductParams) {
  return useQuery({
    queryKey: qk.products.list(params),
    queryFn: () => listProducts(params),
    placeholderData: (prev) => prev, // keeps previous page while fetching next
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: qk.products.detail(id ?? ''),
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.products.all });
    },
  });
}

export function useImportProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportProductsInput) => importProducts(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.products.all });
      qc.invalidateQueries({ queryKey: qk.categories.all });
      qc.invalidateQueries({ queryKey: qk.brands.all });
    },
  });
}