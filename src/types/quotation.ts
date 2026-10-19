import type { PaginationParams } from './common';
import type { SalePaymentMethod } from './sale';

export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CONVERTED';

/** What the backend actually returns — includes runtime-computed EXPIRED. */
export type QuotationEffectiveStatus = QuotationStatus | 'EXPIRED';

export interface QuotationCustomerRef {
  Id: string;
  Name: string;
  Code: string;
}

export interface QuotationProductRef {
  Id: string;
  Name: string;
  SKU: string | null;
}

export interface QuotationItemRow {
  Id: string;
  QuotationId: string;
  ProductId: string;
  Qty: number;
  UnitPrice: string;
  Discount: string;
  TaxRate: string | null;
  LineSubtotal: string;
  LineDiscount: string;
  LineTax: string;
  LineTotal: string;
  Notes: string | null;
  Product: QuotationProductRef;
}

export interface QuotationSaleRef {
  Id: string;
  InvoiceNumber: string;
  Status: string;
}

export interface QuotationListRow {
  Id: string;
  Code: string;
  CustomerId: string | null;
  Status: QuotationStatus;
  EffectiveStatus: QuotationEffectiveStatus;
  Subtotal: string;
  DiscountAmount: string;
  TaxAmount: string;
  TotalAmount: string;
  ValidUntil: string | null;
  Notes: string | null;
  SaleId: string | null;
  ConvertedAt: string | null;
  ConvertedByUserId: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  CreatedByUserId: string | null;
  UpdatedByUserId: string | null;
  Customer: QuotationCustomerRef | null;
}

export interface QuotationDetail extends QuotationListRow {
  Items: QuotationItemRow[];
  Sale: QuotationSaleRef | null;
}

export interface QuotationItemInput {
  ProductId: string;
  Qty: number;
  UnitPrice: number;
  Discount?: number;
  TaxRate?: number;
  Notes?: string;
}

export interface CreateQuotationInput {
  CustomerId?: string;
  ValidUntil?: string;
  Notes?: string;
  Items: QuotationItemInput[];
}

export type UpdateQuotationInput = Partial<CreateQuotationInput>;

export interface ConvertQuotationInput {
  TerminalId: string;
  Notes?: string;
  Payments: {
    Method: SalePaymentMethod;
    Amount: number;
    ChequeNumber?: string;
    BankName?: string;
    BankBranch?: string;
    ChequeIssueDate?: string;
    ChequeDueDate?: string;
    Notes?: string;
  }[];
}

export interface ChangeQuotationStatusInput {
  Reason?: string;
}

export interface QueryQuotationParams extends PaginationParams {
  CustomerId?: string;
  Status?: QuotationStatus;
  From?: string;
  To?: string;
}

export type QuotationSortField =
  | 'CreatedAt'
  | 'ValidUntil'
  | 'TotalAmount'
  | 'Code';