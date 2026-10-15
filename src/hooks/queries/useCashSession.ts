import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import { closeCashSession, getExpectedCash, getMyOpenSession, openCashSession } from '@/api/cashSessions';
import type { CloseSessionInput, OpenSessionInput } from '@/types/cashSession';

import { getCashSession, listCashLedger, listCashSessions } from '@/api/cashSessions';
import type {
  QueryCashLedgerParams,
  QueryCashSessionParams,
} from '@/types/cashSession';

export function useMyOpenSession() {
  return useQuery({
    queryKey: qk.cashSessions.me,
    queryFn: getMyOpenSession,
    // Refresh when the tab regains focus — cashier may have opened/closed
    // the drawer from another tab or been re-assigned.
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useOpenCashSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OpenSessionInput) => openCashSession(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}

export function useExpectedCash(sessionId: string | null, enabled = true) {
  return useQuery({
    queryKey: qk.cashSessions.expectedCash(sessionId ?? ''),
    queryFn: () => getExpectedCash(sessionId!),
    enabled: !!sessionId && enabled,
    // Cash position must be live — every ledger entry during the shift
    // changes it. Don't cache.
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCloseCashSession(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CloseSessionInput) =>
      closeCashSession(sessionId, input),
    onSuccess: () => {
      // Invalidates /cash-sessions/me so PosPage falls back to the
      // OpenSessionPrompt automatically.
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
    },
  });
}

export function useCashSessions(params: QueryCashSessionParams) {
  return useQuery({
    queryKey: qk.cashSessions.list(params),
    queryFn: () => listCashSessions(params),
    placeholderData: (prev) => prev,
  });
}

export function useCashSessionDetail(id: string | null) {
  return useQuery({
    queryKey: qk.cashSessions.detail(id ?? ''),
    queryFn: () => getCashSession(id!),
    enabled: !!id,
  });
}

export function useCashLedger(params: QueryCashLedgerParams, enabled = true) {
  return useQuery({
    queryKey: [...qk.cashSessions.all, 'ledger', params] as const,
    queryFn: () => listCashLedger(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}