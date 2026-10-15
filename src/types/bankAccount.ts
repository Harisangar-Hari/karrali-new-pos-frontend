import type { PaginationParams } from './common';

export interface BankAccountRow {
  Id: string;
  Name: string;
  BankName: string;
  AccountNumber: string;
  Branch: string | null;
  Swift: string | null;
  IsDefault: boolean;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
}

export interface CreateBankAccountInput {
  Name: string;
  BankName: string;
  AccountNumber: string;
  Branch?: string;
  Swift?: string;
  IsDefault?: boolean;
  IsActive?: boolean;
}

export type UpdateBankAccountInput = Partial<CreateBankAccountInput>;

export interface QueryBankAccountParams extends PaginationParams {
  IsActive?: boolean;
  includeDeleted?: boolean;
}

export type BankAccountSortField = 'Name' | 'BankName' | 'CreatedAt';