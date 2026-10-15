import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  CreateTerminalInput,
  QueryTerminalParams,
  TerminalRow,
  UpdateTerminalInput,
} from '@/types/terminal';

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

export async function listTerminals(
  params?: QueryTerminalParams,
): Promise<PaginatedResponse<TerminalRow>> {
  const { data } = await api.get<PaginatedResponse<TerminalRow>>('/terminals', {
    params: cleanParams(params),
  });
  return data;
}

export async function getTerminal(id: string): Promise<TerminalRow> {
  const { data } = await api.get<TerminalRow>(`/terminals/${id}`);
  return data;
}

export async function createTerminal(
  input: CreateTerminalInput,
): Promise<TerminalRow> {
  const { data } = await api.post<TerminalRow>('/terminals', input);
  return data;
}

export async function updateTerminal(
  id: string,
  input: UpdateTerminalInput,
): Promise<TerminalRow> {
  const { data } = await api.patch<TerminalRow>(`/terminals/${id}`, input);
  return data;
}

export async function deleteTerminal(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`/terminals/${id}`);
  return data;
}