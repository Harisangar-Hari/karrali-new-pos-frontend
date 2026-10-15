// ─── Sales Summary ─────────────────────────────────────────────
export type SalesSummaryGroup = 'none' | 'day' | 'week' | 'month';

export interface SalesSummaryRow {
  Period: string | null;
  SaleCount: number;
  GrossSales: string;
  Discounts: string;
  TaxCollected: string;
  NetSales: string;
  CashTotal: string;
  CardTotal: string;
  CreditTotal: string;
  ChequeTotal: string;
  RefundTotal: string;
}

export interface SalesSummaryReport {
  Group: SalesSummaryGroup;
  From: string;
  To: string;
  Rows: SalesSummaryRow[];
}

// ─── Z-Report ──────────────────────────────────────────────────
export interface ZReport {
  Date: string;
  Window: { From: string; To: string };
  Terminal: { Id: string; Name: string; Code: string } | null;
  Session: {
    Id: string;
    OpenedAt: string;
    ClosedAt: string | null;
    Status: string;
    StartingCash: string;
    ExpectedCash: string | null;
    CountedCash: string | null;
    Difference: string | null;
  } | null;
  Sales: {
    Count: number;
    GrossSales: string;
    Discounts: string;
    TaxCollected: string;
    NetSales: string;
    PaidAmount: string;
  };
  Payments: {
    Cash: string;
    Card: string;
    Credit: string;
    Cheque: string;
  };
  Returns: {
    Count: number;
    Total: string;
    CashRefunded: string;
    CreditIssued: string;
  };
  Cancels: {
    Count: number;
    Value: string;
  };
  CashFlow: {
    StartingCash: string | null;
    CashSales: string;
    CashCreditPayments: string;
    CashIn: string;
    CashOut: string;
    CashRefunds: string;
    CashExpenses: string;
    ExpectedDrawer: string;
  };
  TopProducts: {
    ProductId: string;
    Name: string;
    SKU: string | null;
    QtySold: number;
    Revenue: string;
  }[];
}

// ─── Cash Flow ─────────────────────────────────────────────────
export type CashFlowGroup = 'day' | 'week' | 'month';

export interface CashFlowRow {
  Period: string;
  Opening: string;
  In: {
    Sale: string;
    CreditPayment: string;
    CashIn: string;
    ExpenseReversed: string;
    CreditPaymentReversed: string;
  };
  Out: {
    SaleRefund: string;
    CashOut: string;
    Expense: string;
  };
  NetChange: string;
  Closing: string;
  EntryCount: number;
}

export interface CashFlowReport {
  Group: CashFlowGroup;
  From: string;
  To: string;
  OpeningBalance: string;
  ClosingBalance: string;
  Rows: CashFlowRow[];
}

// ─── Types for F8b — declared now to keep one types file ───────
export type ProfitGroup = 'none' | 'day' | 'week' | 'month';

export interface ProfitReportRow {
  ProductId: string | null;
  Name: string;
  SKU: string | null;
  CategoryName: string | null;
  QtySold: number;
  NetRevenue: string;
  TaxCollected: string;
  COGS: string;
  GrossProfit: string;
  MarginPct: string;
}

export interface ProfitReportTotals {
  QtySold: number;
  NetRevenue: string;
  TaxCollected: string;
  COGS: string;
  GrossProfit: string;
  MarginPct: string;
}

export interface ProfitReport {
  Group: ProfitGroup;
  From: string;
  To: string;
  Rows: ProfitReportRow[];
  Total: ProfitReportTotals;
}

export interface StockValuationRow {
  ProductId: string;
  Name: string;
  SKU: string | null;
  Barcode: string | null;
  CategoryName: string;
  SellingPrice: string;
  CostPrice: string;
  ReorderLevel: number;
  Qty: number;
  CostValue: string;
  RetailValue: string;
}

export interface StockValuationReport {
  Rows: StockValuationRow[];
  Meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  TotalRetail: string;
  TotalCost: string;
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

export interface InventoryMovementRow {
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

export interface InventoryMovementReport {
  Rows: InventoryMovementRow[];
  Meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  NetChange: string;
}

export interface ArAgingBucket {
  Current: string;
  Days31To60: string;
  Days61To90: string;
  Days91To180: string;
  DaysOver180: string;
}

export interface ArAgingRow {
  CustomerId: string;
  Code: string;
  Name: string;
  Phone: string | null;
  Balance: string;
  CreditLimit: string;
  AvailableCredit: string;
  LastCreditSaleDate: string | null;
  Buckets: ArAgingBucket;
}

export interface ArAgingReport {
  From: string;
  To: string;
  Rows: ArAgingRow[];
  Totals: ArAgingBucket & { Grand: string };
}

export interface ChequeCalendarEntry {
  Side: 'CUSTOMER' | 'SUPPLIER';
  ChequeId: string;
  Code: string;
  ChequeNumber: string;
  Amount: string;
  IssueDate: string;
  DueDate: string;
  CounterpartyId: string;
  CounterpartyName: string;
  CounterpartyCode: string;
  BankName: string | null;
  Notes: string | null;
}

export interface ChequeCalendarReport {
  From: string;
  To: string;
  CustomerTotal: string;
  SupplierTotal: string;
  NetExposure: string;
  Entries: ChequeCalendarEntry[];
  ByDay: {
    Day: string;
    CustomerAmount: string;
    SupplierAmount: string;
    Count: number;
  }[];
}