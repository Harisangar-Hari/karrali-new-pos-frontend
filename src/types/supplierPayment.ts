import type { PaginationParams } from './common';

export type SupplierPaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';

export interface SupplierPaymentSupplierRef {
  Id: string;
  Name: string;
  Code: string;
}

export interface SupplierPaymentPurchaseRef {
  Id: string;
  Code: string;
  TotalAmount: string;
  PaidAmount: string;
  Status: string;
}

export interface SupplierPaymentRow {
  Id: string;
  Code: string;
  SupplierId: string;
  PurchaseId: string;
  Method: SupplierPaymentMethod;
  Amount: string;
  PaidAt: string;
  ChequeId: string | null;
  Notes: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedByUserId: string | null;
  UpdatedByUserId: string | null;
  Supplier: SupplierPaymentSupplierRef;
  Purchase: SupplierPaymentPurchaseRef;
}

export interface CreateSupplierPaymentInput {
  PurchaseId: string;
  Method: 'CASH' | 'BANK_TRANSFER';
  Amount: number;
  PaidAt?: string;
  Notes?: string;
}

export interface QuerySupplierPaymentParams extends PaginationParams {
  SupplierId?: string;
  PurchaseId?: string;
  Method?: SupplierPaymentMethod;
  From?: string;
  To?: string;
}

export type SupplierPaymentSortField = 'PaidAt' | 'Amount' | 'CreatedAt';