import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createBrand,
  deleteBrand,
  getBrand,
  listBrands,
  updateBrand,
} from '@/api/brands';
import type {
  CreateBrandInput,
  QueryBrandParams,
  UpdateBrandInput,
} from '@/types/brand';

export function useBrands(params: QueryBrandParams) {
  return useQuery({
    queryKey: qk.brands.list(params),
    queryFn: () => listBrands(params),
    placeholderData: (prev) => prev,
  });
}

export function useBrand(id: string | null) {
  return useQuery({
    queryKey: qk.brands.detail(id ?? ''),
    queryFn: () => getBrand(id!),
    enabled: !!id,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBrandInput) => createBrand(input),
    onSuccess: () => {
      // Prefix invalidation — hits both list rows and the lookup cache.
      qc.invalidateQueries({ queryKey: qk.brands.all });
    },
  });
}

export function useUpdateBrand(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBrandInput) => updateBrand(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.brands.all });
      qc.invalidateQueries({ queryKey: qk.brands.detail(id) });
    },
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.brands.all });
    },
  });
}