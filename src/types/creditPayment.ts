import type { PaginationParams } from './common';

export type CreditPaymentMethod = 'CASH' | 'CHEQUE';

export interface CreditPaymentChequeRef {
  Id: string;
  Code: string;
  ChequeNumber: string;
  Status: 'PENDING' | 'CLEARED' | 'BOUNCED' | 'VOIDED';
  DueDate: string;
}

export interface CreditPaymentRow {
  Id: string;
  Code: string;
  CustomerId: string;
  Method: CreditPaymentMethod;
  Amount: string;
  PaidAt: string;
  ChequeId: string | null;
  Notes: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  ReversedAt: string | null;
  ReversedByUserId: string | null;
  ReversalReason: string | null;
  Customer: { Id: string; Name: string; Code: string };
  Cheque: CreditPaymentChequeRef | null;
}

export interface CreateCreditPaymentInput {
  CustomerId: string;
  Method: CreditPaymentMethod;
  Amount: number;
  PaidAt?: string;
  ChequeNumber?: string;
  BankName?: string;
  BankBranch?: string;
  ChequeIssueDate?: string;
  ChequeDueDate?: string;
  Notes?: string;
}

export interface QueryCreditPaymentParams extends PaginationParams {
  CustomerId?: string;
  Method?: CreditPaymentMethod;
  excludeReversed?: boolean;
  From?: string;
  To?: string;
}

export type CreditPaymentSortField = 'PaidAt' | 'Amount' | 'CreatedAt';