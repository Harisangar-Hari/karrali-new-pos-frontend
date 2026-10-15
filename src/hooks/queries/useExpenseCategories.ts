import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createExpenseCategory,
  deleteExpenseCategory,
  getExpenseCategory,
  listExpenseCategories,
  updateExpenseCategory,
} from '@/api/expenseCategories';
import type {
  CreateExpenseCategoryInput,
  QueryExpenseCategoryParams,
  UpdateExpenseCategoryInput,
} from '@/types/expenseCategory';

export function useExpenseCategories(params: QueryExpenseCategoryParams) {
  return useQuery({
    queryKey: qk.expenseCategories.list(params),
    queryFn: () => listExpenseCategories(params),
    placeholderData: (prev) => prev,
  });
}

export function useExpenseCategory(id: string | null) {
  return useQuery({
    queryKey: qk.expenseCategories.detail(id ?? ''),
    queryFn: () => getExpenseCategory(id!),
    enabled: !!id,
  });
}

export function useCreateExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseCategoryInput) =>
      createExpenseCategory(input),
    onSuccess: () => {
      // Prefix invalidation — hits the list, the detail, AND the lookup.
      qc.invalidateQueries({ queryKey: qk.expenseCategories.all });
    },
  });
}

export function useUpdateExpenseCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateExpenseCategoryInput) =>
      updateExpenseCategory(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.expenseCategories.all });
      qc.invalidateQueries({ queryKey: qk.expenseCategories.detail(id) });
    },
  });
}

export function useDeleteExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpenseCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.expenseCategories.all });
    },
  });
}