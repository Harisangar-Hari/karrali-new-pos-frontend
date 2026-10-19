import { useQuery } from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import { listAuditLogs } from '@/api/audit';
import type { QueryAuditLogParams } from '@/types/audit';

export function useAuditLogs(params: QueryAuditLogParams) {
  return useQuery({
    queryKey: qk.audit.list(params),
    queryFn: () => listAuditLogs(params),
    placeholderData: (prev) => prev,
  });
}