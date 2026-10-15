import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createCashMovement,
  deleteCashMovement,
  getCashMovement,
  listCashMovements,
} from '@/api/cashMovements';
import type {
  CreateCashMovementInput,
  QueryCashMovementParams,
} from '@/types/cashMovement';

export function useCashMovements(params: QueryCashMovementParams) {
  return useQuery({
    queryKey: qk.cashMovements.list(params),
    queryFn: () => listCashMovements(params),
    placeholderData: (prev) => prev,
  });
}

export function useCashMovement(id: string | null) {
  return useQuery({
    queryKey: qk.cashMovements.detail(id ?? ''),
    queryFn: () => getCashMovement(id!),
    enabled: !!id,
  });
}

export function useCreateCashMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCashMovementInput) => createCashMovement(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.cashMovements.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}

export function useDeleteCashMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      deleteCashMovement(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.cashMovements.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}