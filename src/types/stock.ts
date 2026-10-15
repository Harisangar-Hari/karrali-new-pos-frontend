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