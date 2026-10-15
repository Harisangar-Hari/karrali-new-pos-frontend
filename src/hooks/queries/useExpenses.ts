import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createExpense,
  deleteExpense,
  getExpense,
  listExpenses,
  updateExpense,
} from '@/api/expenses';
import type {
  CreateExpenseInput,
  QueryExpenseParams,
  UpdateExpenseInput,
} from '@/types/expense';

export function useExpenses(params: QueryExpenseParams) {
  return useQuery({
    queryKey: qk.expenses.list(params),
    queryFn: () => listExpenses(params),
    placeholderData: (prev) => prev,
  });
}

export function useExpense(id: string | null) {
  return useQuery({
    queryKey: qk.expenses.detail(id ?? ''),
    queryFn: () => getExpense(id!),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpense(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.expenses.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}

export function useUpdateExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateExpenseInput) => updateExpense(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.expenses.all });
      qc.invalidateQueries({ queryKey: qk.expenses.detail(id) });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.expenses.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}