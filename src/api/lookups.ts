import { api } from '@/lib/api';
import { BankAccountRow } from '@/types/bankAccount';
import type { PaginatedResponse } from '@/types/common';
import { ExpenseCategoryRow } from '@/types/expenseCategory';
import { TerminalRow } from '@/types/terminal';

/**
 * Minimal lookup clients for form dropdowns. Categories/Brands/Warehouses
 * have full CRUD pages in F3b — these are read-only helpers used while
 * building the Products module.
 *
 * ASSUMPTION: all three return PaginatedResponse<{ Id, Name, ... }>.
 * If shapes differ, only these functions need adjusting.
 *
 * Note: backend PaginationDto caps limit at 100. For larger lookup sets,
 * switch to a server-side search-as-you-type flow later.
 */

export interface LookupOption {
    Id: string;
    Name: string;
    IsActive?: boolean;
    Code?: string;
    /** Categories only — used to build the parent picker tree. */
    ParentId?: string | null;
}

const LOOKUP_LIMIT = 100;

export async function listCategoriesLookup(): Promise<LookupOption[]> {
    const { data } = await api.get<PaginatedResponse<LookupOption>>('/categories', {
        params: { limit: LOOKUP_LIMIT, sortBy: 'Name', sortOrder: 'asc' },
    });
    return data.data;
}

export async function listBrandsLookup(): Promise<LookupOption[]> {
    const { data } = await api.get<PaginatedResponse<LookupOption>>('/brands', {
        params: { limit: LOOKUP_LIMIT, sortBy: 'Name', sortOrder: 'asc' },
    });
    return data.data;
}

export async function listWarehousesLookup(): Promise<LookupOption[]> {
    const { data } = await api.get<PaginatedResponse<LookupOption>>('/warehouses', {
        params: { limit: LOOKUP_LIMIT, sortBy: 'Name', sortOrder: 'asc' },
    });
    return data.data;
}

export async function listTerminalsLookup(): Promise<
  (LookupOption & { WarehouseId?: string })[]
> {
  const { data } = await api.get<PaginatedResponse<TerminalRow>>('/terminals', {
    params: { limit: LOOKUP_LIMIT, IsActive: true, sortBy: 'Name', sortOrder: 'asc' },
  });
  return data.data.map((t) => ({
    Id: t.Id,
    Name: `${t.Name} (${t.Code})`,
    IsActive: t.IsActive,
    WarehouseId: t.WarehouseId,
  }));
}

export async function listExpenseCategoriesLookup(): Promise<LookupOption[]> {
  const { data } = await api.get<PaginatedResponse<ExpenseCategoryRow>>(
    '/expense-categories',
    {
      params: { limit: LOOKUP_LIMIT, IsActive: true, sortBy: 'Name', sortOrder: 'asc' },
    },
  );
  return data.data.map((c) => ({
    Id: c.Id,
    Name: c.Name,
    IsActive: c.IsActive,
  }));
}

export async function listBankAccountsLookup(): Promise<LookupOption[]> {
  const { data } = await api.get<PaginatedResponse<BankAccountRow>>(
    '/bank-accounts',
    {
      params: { limit: LOOKUP_LIMIT, IsActive: true, sortBy: 'Name', sortOrder: 'asc' },
    },
  );
  return data.data.map((a) => ({
    Id: a.Id,
    Name: a.Name,
    IsActive: a.IsActive,
    Code: a.BankName ?? undefined,
  }));
}