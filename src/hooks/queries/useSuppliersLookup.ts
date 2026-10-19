import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/config/queryKeys';
import type { PaginatedResponse } from '@/types/common';
import type { SupplierRow } from '@/types/supplier';

const LOOKUP_LIMIT = 100;

async function listSuppliersLookup(): Promise<
  Pick<SupplierRow, 'Id' | 'Name' | 'Code'>[]
> {
  const { data } = await api.get<PaginatedResponse<SupplierRow>>('/suppliers', {
    params: {
      limit: LOOKUP_LIMIT,
      IsActive: true,
      sortBy: 'Name',
      sortOrder: 'asc',
    },
  });
  return data.data.map((s) => ({ Id: s.Id, Name: s.Name, Code: s.Code }));
}

export function useSuppliersLookup() {
  return useQuery({
    queryKey: [...qk.suppliers.all, 'lookup'] as const,
    queryFn: listSuppliersLookup,
    staleTime: 5 * 60_000,
  });
}