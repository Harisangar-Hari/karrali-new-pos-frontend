import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/config/queryKeys';
import type { PaginatedResponse } from '@/types/common';
import type { CustomerRow } from '@/types/customer';

const LOOKUP_LIMIT = 100;

async function listCustomersLookup(): Promise<
  Pick<CustomerRow, 'Id' | 'Name' | 'Code'>[]
> {
  const { data } = await api.get<PaginatedResponse<CustomerRow>>('/customers', {
    params: {
      limit: LOOKUP_LIMIT,
      IsActive: true,
      sortBy: 'Name',
      sortOrder: 'asc',
    },
  });
  return data.data.map((c) => ({ Id: c.Id, Name: c.Name, Code: c.Code }));
}

export function useCustomersLookup() {
  return useQuery({
    queryKey: [...qk.customers.all, 'lookup'] as const,
    queryFn: listCustomersLookup,
    staleTime: 5 * 60_000,
  });
}