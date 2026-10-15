import type { PaginationParams } from './common';

export type SaleReturnRefundMethod = 'CASH' | 'CREDIT';

export interface SaleReturnItemRow {
  Id: string;
  SaleReturnId: string;
  SaleItemId: string;
  ProductId: string;
  Qty: number;
  UnitPrice: string;
  TaxRate: string | null;
  LineSubtotal: string;
  LineTax: string;
  RefundAmount: string;
  Product: { Id: string; Name: string; SKU: string | null };
  SaleItem: { Id: string; Qty: number; ReturnedQty: number };
}

export interface SaleReturnListRow {
  Id: string;
  Code: string;
  SaleId: string;
  CustomerId: string | null;
  RefundMethod: SaleReturnRefundMethod;
  Subtotal: string;
  TaxAmount: string;
  RefundAmount: string;
  Notes: string | null;
  CreatedAt: string;
  Sale: {
    Id: string;
    InvoiceNumber: string;
    Status: string;
    TotalAmount: string;
  };
  Customer: { Id: string; Name: string; Code: string } | null;
}

export interface SaleReturnDetail extends SaleReturnListRow {
  Items: SaleReturnItemRow[];
}

export interface SaleReturnItemInput {
  SaleItemId: string;
  Qty: number;
  Notes?: string;
}

export interface CreateSaleReturnInput {
  SaleId: string;
  RefundMethod: SaleReturnRefundMethod;
  CustomerId?: string;
  Notes?: string;
  Items: SaleReturnItemInput[];
}

export interface QuerySaleReturnParams extends PaginationParams {
  SaleId?: string;
  CustomerId?: string;
  From?: string;
  To?: string;
}

export type SaleReturnSortField = 'CreatedAt' | 'RefundAmount';