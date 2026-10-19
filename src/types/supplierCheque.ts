import type { PaginationParams } from './common';

export type SupplierChequeStatus = 'PENDING' | 'CLEARED' | 'BOUNCED' | 'VOIDED';

export interface SupplierChequeSupplierRef {
  Id: string;
  Name: string;
  Code: string;
}

export interface SupplierChequePurchaseRef {
  Id: string;
  Code: string;
  TotalAmount: string;
  PaidAmount: string;
  Status: string;
}

export interface SupplierChequePaymentRef {
  Id: string;
  Code: string;
  Method: string;
  Amount: string;
  PaidAt: string;
}

export interface SupplierChequeRow {
  Id: string;
  Code: string;
  SupplierId: string;
  PurchaseId: string;
  ChequeNumber: string;
  BankName: string | null;
  Amount: string;
  IssueDate: string;
  DueDate: string;
  Status: SupplierChequeStatus;
  ClearedAt: string | null;
  BouncedAt: string | null;
  BounceReason: string | null;
  PaymentId: string | null;
  Notes: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Supplier: SupplierChequeSupplierRef;
  Purchase: SupplierChequePurchaseRef;
  Payment: SupplierChequePaymentRef | null;
}

export interface CreateSupplierChequeInput {
  PurchaseId: string;
  ChequeNumber: string;
  BankName?: string;
  Amount: number;
  IssueDate: string;
  DueDate: string;
  Notes?: string;
}

export interface ClearChequeInput {
  ClearedAt?: string;
  Notes?: string;
}

export interface BounceChequeInput {
  Reason: string;
  BouncedAt?: string;
  Notes?: string;
}

export interface VoidChequeInput {
  Reason: string;
}

export interface QuerySupplierChequeParams extends PaginationParams {
  SupplierId?: string;
  PurchaseId?: string;
  Status?: SupplierChequeStatus;
  dueAfter?: string;
  dueBefore?: string;
}

export type SupplierChequeSortField =
  | 'DueDate'
  | 'IssueDate'
  | 'Amount'
  | 'CreatedAt';