import { useQuery } from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import { listTerminalsLookup } from '@/api/lookups';

export function useTerminalsLookup() {
  return useQuery({
    queryKey: [...qk.terminals.all, 'lookup'] as const,
    queryFn: listTerminalsLookup,
    staleTime: 5 * 60_000,
  });
}