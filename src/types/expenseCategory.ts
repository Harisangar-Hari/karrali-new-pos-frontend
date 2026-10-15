import type { PaginationParams } from './common';

export interface ExpenseCategoryCounts {
  Expenses: number;
}

export interface ExpenseCategoryRow {
  Id: string;
  Name: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  _count?: ExpenseCategoryCounts;
}

export interface CreateExpenseCategoryInput {
  Name: string;
  IsActive?: boolean;
}

export type UpdateExpenseCategoryInput = Partial<CreateExpenseCategoryInput>;

export interface QueryExpenseCategoryParams extends PaginationParams {
  IsActive?: boolean;
  includeDeleted?: boolean;
}

export type ExpenseCategorySortField =
  | 'Name'
  | 'IsActive'
  | 'CreatedAt'
  | 'UpdatedAt';