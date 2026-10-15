import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from '@/api/categories';
import type {
  CreateCategoryInput,
  QueryCategoryParams,
  UpdateCategoryInput,
} from '@/types/category';

export function useCategories(params: QueryCategoryParams) {
  return useQuery({
    queryKey: qk.categories.list(params),
    queryFn: () => listCategories(params),
    placeholderData: (prev) => prev,
  });
}

export function useCategory(id: string | null) {
  return useQuery({
    queryKey: qk.categories.detail(id ?? ''),
    queryFn: () => getCategory(id!),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: () => {
      // `qk.categories.all` prefix-invalidates both lists and the lookup.
      qc.invalidateQueries({ queryKey: qk.categories.all });
    },
  });
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCategoryInput) => updateCategory(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categories.all });
      qc.invalidateQueries({ queryKey: qk.categories.detail(id) });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categories.all });
    },
  });
}