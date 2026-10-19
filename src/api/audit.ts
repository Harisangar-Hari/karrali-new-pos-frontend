import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type { AuditLogRow, QueryAuditLogParams } from '@/types/audit';

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

export async function listAuditLogs(
  params?: QueryAuditLogParams,
): Promise<PaginatedResponse<AuditLogRow>> {
  const { data } = await api.get<PaginatedResponse<AuditLogRow>>(
    '/audit-logs',
    { params: cleanParams(params) },
  );
  return data;
}