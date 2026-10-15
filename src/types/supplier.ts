import type { PaginationParams } from './common';

export interface SupplierRow {
  Id: string;
  Code: string;
  Name: string;
  Phone: string | null;
  Email: string | null;
  Address: string | null;
  TaxNumber: string | null;
  PaymentTerms: string | null;
  BankName: string | null;
  BankAccountNo: string | null;
  BankBranch: string | null;
  BankSwift: string | null;
  Notes: string | null;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
}

export interface CreateSupplierInput {
  Name: string;
  Phone?: string | null;
  Email?: string | null;
  Address?: string;
  TaxNumber?: string;
  PaymentTerms?: string;
  BankName?: string;
  BankAccountNo?: string;
  BankBranch?: string;
  BankSwift?: string;
  Notes?: string;
  IsActive?: boolean;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export interface QuerySupplierParams extends PaginationParams {
  IsActive?: boolean;
  includeDeleted?: boolean;
}

export type SupplierSortField = 'Name' | 'Code' | 'CreatedAt' | 'UpdatedAt';