import type { PaginationParams } from './common';

export type CashMovementType = 'CASH_IN' | 'CASH_OUT';

export interface BankAccountRef {
  Id: string;
  Name: string;
  BankName: string | null;
}

export interface CashSessionRef {
  Id: string;
  OpenedAt: string;
  ClosedAt: string | null;
  Status: 'OPEN' | 'CLOSED';
}

export interface CashMovementRow {
  Id: string;
  Code: string;
  Type: CashMovementType;
  Amount: string;
  Reason: string;
  Notes: string | null;
  BankAccountId: string | null;
  CashSessionId: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedByUserId: string | null;
  UpdatedByUserId: string | null;
  BankAccount: BankAccountRef | null;
  CashSession: CashSessionRef | null;
}

export interface CreateCashMovementInput {
  Type: CashMovementType;
  Amount: number;
  Reason: string;
  BankAccountId?: string;
  Notes?: string;
}

export interface QueryCashMovementParams extends PaginationParams {
  Type?: CashMovementType;
  BankAccountId?: string;
  CashSessionId?: string;
  From?: string;
  To?: string;
}

export type CashMovementSortField = 'CreatedAt' | 'Amount';