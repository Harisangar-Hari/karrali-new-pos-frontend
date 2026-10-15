import type { PaginationParams } from './common';

export interface WarehouseCounts {
  Terminals: number;
  WarehouseStocks: number;
}

export interface WarehouseRow {
  Id: string;
  Name: string;
  Code: string;
  Address: string | null;
  IsActive: boolean;
  IsDefault: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
}

export interface WarehouseDetail extends WarehouseRow {
  _count: WarehouseCounts;
}

export interface CreateWarehouseInput {
  Name: string;
  Code: string;
  Address?: string;
  IsActive?: boolean;
  IsDefault?: boolean;
}

export type UpdateWarehouseInput = Partial<CreateWarehouseInput>;

export interface QueryWarehouseParams extends PaginationParams {
  IsActive?: boolean;
  includeDeleted?: boolean;
}

export type WarehouseSortField =
  | 'Name'
  | 'Code'
  | 'IsActive'
  | 'CreatedAt'
  | 'UpdatedAt';