import { useQuery } from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  listBankAccountsLookup,
  listExpenseCategoriesLookup,
} from '@/api/lookups';

const LOOKUP_STALE = 5 * 60_000;

export function useExpenseCategoriesLookup() {
  return useQuery({
    queryKey: [...qk.expenseCategories.all, 'lookup'] as const,
    queryFn: listExpenseCategoriesLookup,
    staleTime: LOOKUP_STALE,
  });
}

export function useBankAccountsLookup() {
  return useQuery({
    queryKey: [...qk.bankAccounts.all, 'lookup'] as const,
    queryFn: listBankAccountsLookup,
    staleTime: LOOKUP_STALE,
  });
}