import type { PaginationParams } from './common';

export interface BrandCounts {
  Products: number;
}

export interface BrandRow {
  Id: string;
  Name: string;
  Description: string | null;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  _count: BrandCounts;
}

export interface CreateBrandInput {
  Name: string;
  Description?: string;
  IsActive?: boolean;
}

export type UpdateBrandInput = Partial<CreateBrandInput>;

export interface QueryBrandParams extends PaginationParams {
  IsActive?: boolean;
  includeDeleted?: boolean;
}

export type BrandSortField = 'Name' | 'IsActive' | 'CreatedAt' | 'UpdatedAt';