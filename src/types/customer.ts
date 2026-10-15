import type { PaginationParams } from './common';

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'VIP';

export const CUSTOMER_TYPES: readonly CustomerType[] = [
  'RETAIL',
  'WHOLESALE',
  'VIP',
] as const;

export type CustomerLedgerType =
  | 'OPENING'
  | 'SALE'
  | 'PAYMENT'
  | 'RETURN'
  | 'ADJUSTMENT';

export interface CustomerRow {
  Id: string;
  Code: string;
  Name: string;
  Type: CustomerType;
  Phone: string | null;
  Email: string | null;
  Address: string | null;
  TaxNumber: string | null;
  Balance: string;
  CreditLimit: string;
  PaymentTerms: string | null;
  Notes: string | null;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
}

export interface CustomerLedgerRow {
  Id: string;
  CustomerId: string;
  Type: CustomerLedgerType;
  Amount: string;
  BalanceAfter: string;
  Notes: string | null;
  CreatedAt: string;
  CreatedByUserId: string | null;
}

export interface CreateCustomerInput {
  Name: string;
  Type?: CustomerType;
  Phone?: string | null;
  Email?: string | null;
  Address?: string;
  TaxNumber?: string;
  CreditLimit?: number;
  PaymentTerms?: string;
  Notes?: string;
  IsActive?: boolean;
  OpeningBalance?: number;
}

export type UpdateCustomerInput = Omit<CreateCustomerInput, 'OpeningBalance'>;

export interface AdjustBalanceInput {
  Amount: number;
  Reason: string;
}

export interface QueryCustomerParams extends PaginationParams {
  Type?: CustomerType;
  IsActive?: boolean;
  withBalance?: boolean;
  includeDeleted?: boolean;
}

export type CustomerSortField =
  | 'Name'
  | 'Code'
  | 'Type'
  | 'Balance'
  | 'CreditLimit'
  | 'CreatedAt'
  | 'UpdatedAt';

export interface CreditStatus {
  CustomerId: string;
  Code: string;
  Name: string;
  CreditLimit: string;
  Balance: string;
  Available: string;
  OverLimit: boolean;
}

export interface LookupResponse {
  found: boolean;
  customer?: CustomerRow;
}