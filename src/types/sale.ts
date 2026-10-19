export type SalePaymentMethod = 'CASH' | 'CARD' | 'CREDIT' | 'CHEQUE';

export type SaleStatus =
  | 'COMPLETED'
  | 'PARTIALLY_RETURNED'
  | 'FULLY_RETURNED'
  | 'CANCELLED';

export interface SaleItemInput {
  ProductId: string;
  Qty: number;
  UnitPrice: number;
  Discount?: number;
  TaxRate?: number;
  Notes?: string;
}

export interface SalePaymentInput {
  Method: SalePaymentMethod;
  Amount: number;
  ChequeNumber?: string;
  BankName?: string;
  BankBranch?: string;
  ChequeIssueDate?: string;
  ChequeDueDate?: string;
  Notes?: string;
}

export interface CreateSaleInput {
  TerminalId: string;
  CustomerId?: string;
  Notes?: string;
  Items: SaleItemInput[];
  Payments: SalePaymentInput[];
  RedeemPoints?: number;
}

export interface SaleItemRow {
  Id: string;
  SaleId: string;
  ProductId: string;
  Qty: number;
  ReturnedQty: number;
  UnitPrice: string;
  Discount: string;
  TaxRate: string | null;
  LineSubtotal: string;
  LineDiscount: string;
  LineTax: string;
  LineTotal: string;
  Notes: string | null;
  Product: {
    Id: string;
    Name: string;
    SKU: string | null;
    Barcode: string | null;
  };
}

export interface SalePaymentChequeRef {
  Id: string;
  Code: string;
  ChequeNumber: string;
  Status: 'PENDING' | 'CLEARED' | 'BOUNCED' | 'VOIDED';
}

export interface SalePaymentRow {
  Id: string;
  SaleId: string;
  Method: SalePaymentMethod;
  Amount: string;
  ChequeId: string | null;
  Notes: string | null;
  CreatedAt: string;
  ReversedAt: string | null;
  ReversalReason: string | null;
  Cheque: SalePaymentChequeRef | null;
}

export interface SaleReturnRef {
  Id: string;
  Code: string;
  RefundMethod: 'CASH' | 'CREDIT';
  Subtotal: string;
  TaxAmount: string;
  RefundAmount: string;
  Notes: string | null;
  CreatedAt: string;
}

export interface SaleChequeRef {
  Id: string;
  Code: string;
  ChequeNumber: string;
  BankName: string | null;
  Amount: string;
  IssueDate: string;
  DueDate: string;
  Status: 'PENDING' | 'CLEARED' | 'BOUNCED' | 'VOIDED';
}

/**
 * Row returned by GET /sales (list). Slightly narrower than SaleDetail —
 * no items/payments/returns/cheques, but every cached money column is
 * present.
 */
export interface SaleListRow {
  Id: string;
  InvoiceNumber: string;
  TerminalId: string;
  WarehouseId: string;
  CashierId: string;
  CustomerId: string | null;
  Subtotal: string;
  DiscountAmount: string;
  TaxAmount: string;
  TotalAmount: string;
  CashAmount: string;
  CardAmount: string;
  CreditAmount: string;
  ChequeAmount: string;
  PaidAmount: string;
  RefundedAmount: string;
  LoyaltyEarnedPoints: number;
  LoyaltyRedeemedPoints: number;
  LoyaltyDiscountAmount: string;
  LoyaltyReversedPoints: number;
  Status: SaleStatus;
  Notes: string | null;
  CancelledAt: string | null;
  CancelledByUserId: string | null;
  CancelReason: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  Terminal: { Id: string; Name: string; Code: string };
  Cashier: { Id: string; Username: string; FullName: string | null };
  Customer: { Id: string; Name: string; Code: string } | null;
}

/**
 * Full response from GET /sales/:id and POST /sales.
 */
export interface SaleDetail {
  Id: string;
  InvoiceNumber: string;
  TerminalId: string;
  WarehouseId: string;
  CashierId: string;
  CustomerId: string | null;
  Subtotal: string;
  DiscountAmount: string;
  TaxAmount: string;
  TotalAmount: string;
  CashAmount: string;
  CardAmount: string;
  CreditAmount: string;
  ChequeAmount: string;
  PaidAmount: string;
  RefundedAmount: string;
  LoyaltyEarnedPoints: number;
  LoyaltyRedeemedPoints: number;
  LoyaltyDiscountAmount: string;
  LoyaltyReversedPoints: number;
  Status: SaleStatus;
  Notes: string | null;
  CancelledAt: string | null;
  CancelledByUserId: string | null;
  CancelReason: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  Terminal: { Id: string; Name: string; Code: string };
  Cashier: { Id: string; Username: string; FullName: string | null };
  Customer: { Id: string; Name: string; Code: string } | null;
  Warehouse: { Id: string; Name: string; Code: string };
  Items: SaleItemRow[];
  Payments: SalePaymentRow[];
  Returns: SaleReturnRef[];
  Cheques: SaleChequeRef[];
}

export interface QuerySaleParams {
  page?: number;
  limit?: number;
  search?: string;
  Status?: SaleStatus;
  TerminalId?: string;
  CashierId?: string;
  CustomerId?: string;
  hasCredit?: boolean;
  From?: string;
  To?: string;
  sortBy?: 'CreatedAt' | 'TotalAmount';
  sortOrder?: 'asc' | 'desc';
}

export interface CancelSaleInput {
  Reason: string;
}