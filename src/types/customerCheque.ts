import type { PaginationParams } from './common';

export type CustomerChequeStatus =
  | 'PENDING'
  | 'CLEARED'
  | 'BOUNCED'
  | 'VOIDED';

export interface CustomerChequeRow {
  Id: string;
  Code: string;
  CustomerId: string;
  SaleId: string | null;
  ChequeNumber: string;
  BankName: string | null;
  BankBranch: string | null;
  Amount: string;
  IssueDate: string;
  DueDate: string;
  Status: CustomerChequeStatus;
  ClearedAt: string | null;
  BouncedAt: string | null;
  BounceReason: string | null;
  Notes: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Customer: { Id: string; Name: string; Code: string };
  Sale: { Id: string; InvoiceNumber: string; TotalAmount: string } | null;
  SalePayment: { Id: string; Amount: string; ReversedAt: string | null } | null;
  CreditPayment: {
    Id: string;
    Code: string;
    Amount: string;
    ReversedAt: string | null;
  } | null;
}

export interface CreateCustomerChequeInput {
  CustomerId: string;
  SaleId?: string;
  ChequeNumber: string;
  BankName?: string;
  BankBranch?: string;
  Amount: number;
  IssueDate: string;
  DueDate: string;
  Notes?: string;
}

export interface BulkCreateCustomerChequeInput {
  Cheques: CreateCustomerChequeInput[];
}

export interface BulkCreateCustomerChequeResponse {
  count: number;
  items: CustomerChequeRow[];
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

export interface QueryCustomerChequeParams extends PaginationParams {
  CustomerId?: string;
  SaleId?: string;
  Status?: CustomerChequeStatus;
  dueAfter?: string;
  dueBefore?: string;
}

export type CustomerChequeSortField =
  | 'DueDate'
  | 'IssueDate'
  | 'Amount'
  | 'CreatedAt';