import { PaginationParams } from "./common";



export interface TerminalRef {
  Id: string;
  Name: string;
  Code: string;
}

export interface CashierRef {
  Id: string;
  Username: string;
  FullName: string | null;
}

export interface CashSessionRow {
  Id: string;
  TerminalId: string;
  CashierId: string;
  OpenedAt: string;
  ClosedAt: string | null;
  Status: CashSessionStatus;
  StartingCash: string;
  CountedCash: string | null;
  ExpectedCash: string | null;
  Difference: string | null;
  Notes: string | null;
  ClosedByUserId: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedByUserId: string | null;
  Terminal: TerminalRef;
  Cashier: CashierRef;
}

/**
 * Returned by GET /cash-sessions/me when a session is open.
 * `ExpectedCash` is a live-computed string that overrides the DB column.
 */
export interface OpenSessionSummary extends Omit<CashSessionRow, 'ExpectedCash'> {
  LedgerTotal: string;
  ExpectedCash: string;
  EntryCount: number;
}

export interface OpenSessionInput {
  TerminalId: string;
  StartingCash: number;
  Notes?: string;
}

export interface ExpectedCashResult {
  SessionId: string;
  StartingCash: string;
  LedgerTotal: string;
  ExpectedCash: string;
  EntryCount: number;
  ByType: Record<string, { total: string; count: number }>;
}

export interface CloseSessionInput {
  CountedCash: number;
  DiscrepancyReason?: string;
  Notes?: string;
}

export type CashSessionStatus = 'OPEN' | 'CLOSED';

export type CashLedgerType =
  | 'SALE'
  | 'SALE_REFUND'
  | 'CREDIT_PAYMENT'
  | 'CREDIT_PAYMENT_REVERSED'
  | 'CASH_IN'
  | 'CASH_OUT'
  | 'EXPENSE'
  | 'EXPENSE_REVERSED'
  | 'BANK_DEPOSIT';

export interface TerminalRef {
  Id: string;
  Name: string;
  Code: string;
}

export interface CashierRef {
  Id: string;
  Username: string;
  FullName: string | null;
}

export interface CashSessionRow {
  Id: string;
  TerminalId: string;
  CashierId: string;
  OpenedAt: string;
  ClosedAt: string | null;
  Status: CashSessionStatus;
  StartingCash: string;
  CountedCash: string | null;
  ExpectedCash: string | null;
  Difference: string | null;
  Notes: string | null;
  ClosedByUserId: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedByUserId: string | null;
  Terminal: TerminalRef;
  Cashier: CashierRef;
}

export interface OpenSessionSummary extends Omit<CashSessionRow, 'ExpectedCash'> {
  LedgerTotal: string;
  ExpectedCash: string;
  EntryCount: number;
}

export interface ExpectedCashResult {
  SessionId: string;
  StartingCash: string;
  LedgerTotal: string;
  ExpectedCash: string;
  EntryCount: number;
}

export interface CashLedgerSessionRef {
  Id: string;
  OpenedAt: string;
  ClosedAt: string | null;
  Status: CashSessionStatus;
}

export interface CashLedgerRow {
  Id: string;
  Type: CashLedgerType;
  Amount: string;
  SaleId: string | null;
  SaleReturnId: string | null;
  ExpenseId: string | null;
  CashSessionId: string | null;
  Notes: string | null;
  CreatedAt: string;
  CreatedByUserId: string | null;
  CashSession: CashLedgerSessionRef | null;
}

export interface OpenSessionInput {
  TerminalId: string;
  StartingCash: number;
  Notes?: string;
}

export interface CloseSessionInput {
  CountedCash: number;
  DiscrepancyReason?: string;
  Notes?: string;
}

export interface QueryCashSessionParams extends PaginationParams {
  TerminalId?: string;
  CashierId?: string;
  Status?: CashSessionStatus;
  From?: string;
  To?: string;
}

export interface QueryCashLedgerParams extends PaginationParams {
  CashSessionId?: string;
  Type?: CashLedgerType;
  From?: string;
  To?: string;
}

export type CashSessionSortField = 'OpenedAt' | 'ClosedAt' | 'CreatedAt';