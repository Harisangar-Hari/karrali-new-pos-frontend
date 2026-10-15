import { api } from '@/lib/api';
import type {
  ArAgingReport,
  CashFlowGroup,
  CashFlowReport,
  ChequeCalendarReport,
  InventoryMovementReport,
  ProfitGroup,
  ProfitReport,
  SalesSummaryGroup,
  SalesSummaryReport,
  StockMovementType,
  StockValuationReport,
  ZReport,
} from '@/types/reports';

function cleanParams<T extends object>(
  params: T | undefined,
): Record<string, unknown> {
  if (!params) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

// ─── Sales summary ─────────────────────────────────────────────
export interface SalesSummaryParams {
  From?: string;
  To?: string;
  GroupBy?: SalesSummaryGroup;
  TerminalId?: string;
  CashierId?: string;
}

export async function getSalesSummary(
  params: SalesSummaryParams,
): Promise<SalesSummaryReport> {
  const { data } = await api.get<SalesSummaryReport>('/reports/sales-summary', {
    params: cleanParams(params),
  });
  return data;
}

// ─── Z-Report ──────────────────────────────────────────────────
export interface ZReportParams {
  Date: string; // YYYY-MM-DD
  TerminalId?: string;
  CashSessionId?: string;
}

export async function getZReport(params: ZReportParams): Promise<ZReport> {
  const { data } = await api.get<ZReport>('/reports/z-report', {
    params: cleanParams(params),
  });
  return data;
}

// ─── Cash flow ─────────────────────────────────────────────────
export interface CashFlowParams {
  From?: string;
  To?: string;
  GroupBy?: CashFlowGroup;
  TerminalId?: string;
  CashSessionId?: string;
}

export async function getCashFlow(
  params: CashFlowParams,
): Promise<CashFlowReport> {
  const { data } = await api.get<CashFlowReport>('/reports/cash-flow', {
    params: cleanParams(params),
  });
  return data;
}

// ─── Profit (F8b) ──────────────────────────────────────────────
export interface ProfitParams {
  From?: string;
  To?: string;
  GroupBy?: ProfitGroup;
  TerminalId?: string;
  CategoryId?: string;
  ProductId?: string;
  IncludeZeroSales?: boolean;
}

export async function getProfitReport(
  params: ProfitParams,
): Promise<ProfitReport> {
  const { data } = await api.get<ProfitReport>('/reports/profit', {
    params: cleanParams(params),
  });
  return data;
}

// ─── Stock valuation (F8b) ─────────────────────────────────────
export interface StockValuationParams {
  WarehouseId?: string;
  CategoryId?: string;
  InStockOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'Name' | 'Qty' | 'Value';
  sortOrder?: 'asc' | 'desc';
}

export async function getStockValuation(
  params: StockValuationParams,
): Promise<StockValuationReport> {
  const { data } = await api.get<StockValuationReport>(
    '/reports/stock-valuation',
    { params: cleanParams(params) },
  );
  return data;
}

// ─── Inventory movement (F8b) ──────────────────────────────────
export interface InventoryMovementParams {
  ProductId?: string;
  WarehouseId?: string;
  Type?: StockMovementType;
  From?: string;
  To?: string;
  page?: number;
  limit?: number;
}

export async function getInventoryMovement(
  params: InventoryMovementParams,
): Promise<InventoryMovementReport> {
  const { data } = await api.get<InventoryMovementReport>(
    '/reports/inventory-movement',
    { params: cleanParams(params) },
  );
  return data;
}

// ─── AR aging (F8b) ────────────────────────────────────────────
export interface ArAgingParams {
  From?: string;
  To?: string;
  CustomerId?: string;
  IncludeZeroBalance?: boolean;
}

export async function getArAging(
  params: ArAgingParams,
): Promise<ArAgingReport> {
  const { data } = await api.get<ArAgingReport>('/reports/ar-aging', {
    params: cleanParams(params),
  });
  return data;
}

// ─── Cheque calendar (F8b) ─────────────────────────────────────
export interface ChequeCalendarParams {
  From?: string;
  To?: string;
  SupplierId?: string;
  CustomerId?: string;
}

export async function getChequeCalendar(
  params: ChequeCalendarParams,
): Promise<ChequeCalendarReport> {
  const { data } = await api.get<ChequeCalendarReport>(
    '/reports/cheque-calendar',
    { params: cleanParams(params) },
  );
  return data;
}