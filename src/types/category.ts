import type { PaginationParams } from './common';

export interface CategoryParentRef {
  Id: string;
  Name: string;
}

export interface CategoryCounts {
  Children: number;
  Products: number;
}

export interface CategoryRow {
  Id: string;
  Name: string;
  Description: string | null;
  ParentId: string | null;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Parent: CategoryParentRef | null;
  _count: CategoryCounts;
}

export interface CreateCategoryInput {
  Name: string;
  Description?: string;
  ParentId?: string | null;
  IsActive?: boolean;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface QueryCategoryParams extends PaginationParams {
  ParentId?: string;
  rootOnly?: boolean;
  IsActive?: boolean;
  includeDeleted?: boolean;
}

export type CategorySortField =
  | 'Name'
  | 'IsActive'
  | 'CreatedAt'
  | 'UpdatedAt';