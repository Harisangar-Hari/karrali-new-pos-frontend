import { api } from '@/lib/api';
import type {
  CashLedgerRow,
  CashSessionRow,
  CloseSessionInput,
  ExpectedCashResult,
  OpenSessionInput,
  OpenSessionSummary,
  QueryCashLedgerParams,
  QueryCashSessionParams,
} from '@/types/cashSession';
import type { PaginatedResponse } from '@/types/common';

export async function getMyOpenSession(): Promise<OpenSessionSummary | null> {
  const { data } = await api.get<OpenSessionSummary | null>('/cash-sessions/me');
  return data;
}

export async function openCashSession(
  input: OpenSessionInput,
): Promise<CashSessionRow> {
  const { data } = await api.post<CashSessionRow>('/cash-sessions/open', input);
  return data;
}


export async function getExpectedCash(
  sessionId: string,
): Promise<ExpectedCashResult> {
  const { data } = await api.get<ExpectedCashResult>(
    `/cash-sessions/${sessionId}/expected-cash`,
  );
  return data;
}

export async function closeCashSession(
  sessionId: string,
  input: CloseSessionInput,
): Promise<CashSessionRow> {
  const { data } = await api.post<CashSessionRow>(
    `/cash-sessions/${sessionId}/close`,
    input,
  );
  return data;
}

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

export async function listCashSessions(
  params?: QueryCashSessionParams,
): Promise<PaginatedResponse<CashSessionRow>> {
  const { data } = await api.get<PaginatedResponse<CashSessionRow>>(
    '/cash-sessions',
    { params: cleanParams(params) },
  );
  return data;
}

export async function getCashSession(id: string): Promise<CashSessionRow> {
  const { data } = await api.get<CashSessionRow>(`/cash-sessions/${id}`);
  return data;
}

export async function listCashLedger(
  params?: QueryCashLedgerParams,
): Promise<PaginatedResponse<CashLedgerRow>> {
  const { data } = await api.get<PaginatedResponse<CashLedgerRow>>(
    '/cash-sessions/ledger',
    { params: cleanParams(params) },
  );
  return data;
}