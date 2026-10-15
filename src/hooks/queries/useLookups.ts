import { useQuery } from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  listBrandsLookup,
  listCategoriesLookup,
  listWarehousesLookup,
} from '@/api/lookups';

const LOOKUP_STALE = 5 * 60_000;

export function useCategoriesLookup() {
  return useQuery({
    queryKey: qk.categories.lookup,
    queryFn: listCategoriesLookup,
    staleTime: LOOKUP_STALE,
  });
}

export function useBrandsLookup() {
  return useQuery({
    queryKey: qk.brands.lookup,
    queryFn: listBrandsLookup,
    staleTime: LOOKUP_STALE,
  });
}

export function useWarehousesLookup() {
  return useQuery({
    queryKey: qk.warehouses.lookup,
    queryFn: listWarehousesLookup,
    staleTime: LOOKUP_STALE,
  });
}