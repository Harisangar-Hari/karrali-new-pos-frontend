import type { PaginationParams } from './common';

/** Minimal shape returned alongside a product in list queries. */
export interface CategoryRef {
  Id: string;
  Name: string;
}

export interface BrandRef {
  Id: string;
  Name: string;
}

export interface WarehouseRef {
  Id: string;
  Name: string;
  Code: string;
}

/**
 * Row returned by GET /products. All Decimal columns arrive as strings
 * ("250.0000") — always go through formatMoney / Decimal, never Number.
 */
export interface ProductListRow {
  Id: string;
  Name: string;
  SKU: string | null;
  Barcode: string | null;
  Description: string | null;
  Unit: string;
  Price: string;
  CostPrice: string;
  Discount: string;
  TaxRate: string | null;
  ReorderLevel: number;
  WarrantyMonths: number;
  ImageUrl: string | null;
  IsActive: boolean;
  CategoryId: string;
  BrandId: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Category: CategoryRef;
  Brand: BrandRef | null;
  WarehouseStocks?: { WarehouseId?: string; Qty: number }[];
  /**
   * Per-warehouse stock. Present only after the backend PRODUCT_LIST_INCLUDE
   * adds `WarehouseStocks: { select: { Qty: true } }`. Before that change
   * lands, this is undefined and the list Qty column shows "—".
   */
  
}

export interface WarehouseStockRow {
  Id: string;
  WarehouseId: string;
  Qty: number;
  Warehouse: WarehouseRef;
}

export interface ProductDetail extends ProductListRow {
  /** The detail endpoint always includes per-warehouse stock. */
  WarehouseStocks: WarehouseStockRow[];
}

export interface CreateProductInput {
  Name: string;
  SKU?: string | null;
  Barcode?: string | null;
  Description?: string;
  Unit?: string;
  Price: number;
  CostPrice: number;
  Discount?: number;
  TaxRate?: number | null;
  ReorderLevel?: number;
  WarrantyMonths?: number;
  ImageUrl?: string;
  IsActive?: boolean;
  CategoryId: string;
  BrandId?: string | null;
  InitialQty?: number;
  InitialWarehouseId?: string;
}

/** Same as Create, minus opening-stock fields (create-only). */
export type UpdateProductInput = Omit<
  CreateProductInput,
  'InitialQty' | 'InitialWarehouseId'
>;

export interface QueryProductParams extends PaginationParams {
  CategoryId?: string;
  BrandId?: string;
  IsActive?: boolean;
  lowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  includeDeleted?: boolean;
   WarehouseId?: string;
}

export type ProductSortField =
  | 'Name'
  | 'SKU'
  | 'Price'
  | 'CostPrice'
  | 'CreatedAt'
  | 'UpdatedAt';