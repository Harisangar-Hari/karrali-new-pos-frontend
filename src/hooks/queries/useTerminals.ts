import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createTerminal,
  deleteTerminal,
  getTerminal,
  listTerminals,
  updateTerminal,
} from '@/api/terminals';
import type {
  CreateTerminalInput,
  QueryTerminalParams,
  UpdateTerminalInput,
} from '@/types/terminal';

export function useTerminals(params: QueryTerminalParams) {
  return useQuery({
    queryKey: qk.terminals.list(params),
    queryFn: () => listTerminals(params),
    placeholderData: (prev) => prev,
  });
}

export function useTerminal(id: string | null) {
  return useQuery({
    queryKey: qk.terminals.detail(id ?? ''),
    queryFn: () => getTerminal(id!),
    enabled: !!id,
  });
}

export function useCreateTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTerminalInput) => createTerminal(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.terminals.all });
    },
  });
}

export function useUpdateTerminal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTerminalInput) => updateTerminal(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.terminals.all });
      qc.invalidateQueries({ queryKey: qk.terminals.detail(id) });
    },
  });
}

export function useDeleteTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTerminal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.terminals.all });
    },
  });
}