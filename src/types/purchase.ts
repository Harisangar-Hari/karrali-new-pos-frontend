import type { PaginationParams } from './common';

export type PurchaseStatus = 'POSTED' | 'CANCELLED';

export interface SupplierRef {
  Id: string;
  Name: string;
  Code: string;
}

export interface WarehouseRef {
  Id: string;
  Name: string;
  Code: string;
}

export interface PurchaseListRow {
  Id: string;
  Code: string;
  SupplierId: string;
  SupplierInvoiceNo: string | null;
  InvoiceDate: string;
  DueDate: string | null;
  WarehouseId: string;
  Status: PurchaseStatus;
  Subtotal: string;
  TaxAmount: string;
  TotalAmount: string;
  PaidAmount: string;
  Notes: string | null;
  CancelledAt: string | null;
  CancelledByUserId: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  Supplier: SupplierRef;
  Warehouse: WarehouseRef;
}

export interface PurchaseItemRow {
  Id: string;
  PurchaseId: string;
  ProductId: string;
  Qty: number;
  UnitCost: string;
  TaxRate: string | null;
  LineSubtotal: string;
  LineTax: string;
  LineTotal: string;
  Notes: string | null;
  Product: { Id: string; Name: string; SKU: string | null };
}

export interface PurchasePaymentRef {
  Id: string;
  Method: string;
  Amount: string;
  PaidAt: string;
  ReversedAt: string | null;
}

export interface PurchaseChequeRef {
  Id: string;
  Code: string;
  ChequeNumber: string;
  Amount: string;
  DueDate: string;
  Status: string;
}

export interface PurchaseDetail extends PurchaseListRow {
  Items: PurchaseItemRow[];
  Payments: PurchasePaymentRef[];
  Cheques: PurchaseChequeRef[];
}

export interface PurchaseItemInput {
  ProductId: string;
  Qty: number;
  UnitCost: number;
  TaxRate?: number;
  Notes?: string;
}

export interface CreatePurchaseInput {
  SupplierId: string;
  SupplierInvoiceNo?: string;
  InvoiceDate: string;
  DueDate?: string;
  WarehouseId: string;
  Notes?: string;
  Items: PurchaseItemInput[];
}

export interface QueryPurchaseParams extends PaginationParams {
  SupplierId?: string;
  WarehouseId?: string;
  Status?: PurchaseStatus;
  From?: string;
  To?: string;
}

export type PurchaseSortField =
  | 'InvoiceDate'
  | 'DueDate'
  | 'CreatedAt'
  | 'TotalAmount';