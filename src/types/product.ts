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
  /**
   * Flat discount amount per unit (LKR). Applied before `Discount` % — the
   * base Price is reduced by this amount, then any line % stacks on the
   * post-flat amount. Cannot exceed Price (validated on backend).
   */
  DiscountAmount: string;
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
  /**
   * Per-warehouse stock. When a `WarehouseId` filter is active on the
   * list request, this contains a single row (that warehouse). Otherwise
   * it contains every warehouse's qty. The Stock column sums whichever
   * rows are present, so the total is always correct for the current
   * filter.
   */
  WarehouseStocks?: { WarehouseId?: string; Qty: number }[];
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
  DiscountAmount?: number;
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
  /** Scope stock quantities to one warehouse. */
  WarehouseId?: string;
  /** Only products with non-zero stock (respects WarehouseId when set). */
  inStock?: boolean;
}

export type ProductSortField =
  | 'Name'
  | 'SKU'
  | 'Price'
  | 'CostPrice'
  | 'CreatedAt'
  | 'UpdatedAt';

// ─── Bulk import ────────────────────────────────────────────────

export interface ImportProductRow {
  Name: string;
  SKU?: string;
  Barcode?: string;
  CategoryName: string;
  BrandName?: string;
  Price: number;
  CostPrice: number;
  Unit?: string;
  Description?: string;
  Discount?: number;
  DiscountAmount?: number;
  TaxRate?: number;
  ReorderLevel?: number;
  WarrantyMonths?: number;
  IsActive?: boolean;
  InitialQty?: number;
  InitialWarehouseCode?: string;
}

export interface ImportProductsInput {
  Rows: ImportProductRow[];
}

export interface ImportProductsResult {
  Total: number;
  Created: number;
  Updated: number;
  CategoriesCreated: number;
  BrandsCreated: number;
}