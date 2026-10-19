export interface ProductStockWarehouse {
  WarehouseId: string;
  Warehouse: { Id: string; Name: string; Code: string };
  Qty: number;
}

export interface ProductStockSummary {
  ProductId: string;
  Total: number;
  Warehouses: ProductStockWarehouse[];
}

export type StockMovementType =
  | 'OPENING'
  | 'PURCHASE'
  | 'SALE'
  | 'SALE_RETURN'
  | 'PURCHASE_RETURN'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT';

export interface StockMovementRow {
  Id: string;
  ProductId: string;
  WarehouseId: string;
  Type: StockMovementType;
  Quantity: number;
  UnitCost: string | null;
  Notes: string | null;
  SaleId: string | null;
  SaleReturnId: string | null;
  PurchaseId: string | null;
  CreatedAt: string;
  CreatedByUserId: string | null;
  Product: { Id: string; Name: string; SKU: string | null };
  Warehouse: { Id: string; Name: string; Code: string };
}

export interface AdjustStockInput {
  ProductId: string;
  WarehouseId: string;
  /** Signed. Positive = into warehouse, negative = out. Must be non-zero. */
  Quantity: number;
  /** Only OPENING and ADJUSTMENT are accepted from the client. */
  Type: 'OPENING' | 'ADJUSTMENT';
  UnitCost?: number;
  Notes?: string;
}

export interface QueryStockMovementParams {
  page?: number;
  limit?: number;
  search?: string;
  ProductId?: string;
  WarehouseId?: string;
  Type?: StockMovementType;
}