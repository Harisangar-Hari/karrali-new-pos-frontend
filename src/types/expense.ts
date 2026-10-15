import type { PaginationParams } from './common';

export type ExpensePaymentMethod = 'CASH' | 'BANK';

export interface ExpenseCategoryRef {
  Id: string;
  Name: string;
}

export interface BankAccountRef {
  Id: string;
  Name: string;
  BankName: string | null;
}

export interface ExpenseRow {
  Id: string;
  Code: string;
  CategoryId: string;
  Amount: string;
  Method: ExpensePaymentMethod;
  BankAccountId: string | null;
  Description: string;
  Payee: string | null;
  PaidAt: string;
  Notes: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Category: ExpenseCategoryRef;
  BankAccount: BankAccountRef | null;
}

export interface CreateExpenseInput {
  CategoryId: string;
  Amount: number;
  Method: ExpensePaymentMethod;
  BankAccountId?: string;
  Description: string;
  Payee?: string;
  PaidAt?: string;
  Notes?: string;
}

/** Only these three fields are editable after posting. */
export interface UpdateExpenseInput {
  Description?: string;
  Payee?: string;
  Notes?: string;
}

export interface QueryExpenseParams extends PaginationParams {
  CategoryId?: string;
  BankAccountId?: string;
  Method?: ExpensePaymentMethod;
  From?: string;
  To?: string;
}

export type ExpenseSortField = 'PaidAt' | 'Amount' | 'CreatedAt';