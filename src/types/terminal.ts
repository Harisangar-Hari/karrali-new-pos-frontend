import type { PaginationParams } from './common';

export interface WarehouseRef {
  Id: string;
  Name: string;
  Code: string;
}

export interface TerminalRow {
  Id: string;
  Name: string;
  Code: string;
  WarehouseId: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Warehouse: WarehouseRef;
}

export interface CreateTerminalInput {
  Name: string;
  Code: string;
  WarehouseId: string;
  IsActive?: boolean;
}

export type UpdateTerminalInput = Partial<CreateTerminalInput>;

export interface QueryTerminalParams extends PaginationParams {
  WarehouseId?: string;
  IsActive?: boolean;
  includeDeleted?: boolean;
}

export type TerminalSortField =
  | 'Name'
  | 'Code'
  | 'IsActive'
  | 'CreatedAt'
  | 'UpdatedAt';