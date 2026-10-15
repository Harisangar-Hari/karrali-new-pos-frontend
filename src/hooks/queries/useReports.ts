import { useQuery } from '@tanstack/react-query';
import {
  getArAging,
  getCashFlow,
  getChequeCalendar,
  getInventoryMovement,
  getProfitReport,
  getSalesSummary,
  getStockValuation,
  getZReport,
  type ArAgingParams,
  type CashFlowParams,
  type ChequeCalendarParams,
  type InventoryMovementParams,
  type ProfitParams,
  type SalesSummaryParams,
  type StockValuationParams,
  type ZReportParams,
} from '@/api/reports';
import { qk } from '@/config/queryKeys';

const REPORTS_STALE = 30_000;

export function useSalesSummary(params: SalesSummaryParams) {
  return useQuery({
    queryKey: [...qk.reports.all, 'sales-summary', params] as const,
    queryFn: () => getSalesSummary(params),
    staleTime: REPORTS_STALE,
    placeholderData: (prev) => prev,
  });
}

export function useZReport(params: ZReportParams, enabled = true) {
  return useQuery({
    queryKey: [...qk.reports.all, 'z-report', params] as const,
    queryFn: () => getZReport(params),
    enabled,
    staleTime: REPORTS_STALE,
  });
}

export function useCashFlow(params: CashFlowParams) {
  return useQuery({
    queryKey: [...qk.reports.all, 'cash-flow', params] as const,
    queryFn: () => getCashFlow(params),
    staleTime: REPORTS_STALE,
    placeholderData: (prev) => prev,
  });
}

export function useProfitReport(params: ProfitParams) {
  return useQuery({
    queryKey: [...qk.reports.all, 'profit', params] as const,
    queryFn: () => getProfitReport(params),
    staleTime: REPORTS_STALE,
    placeholderData: (prev) => prev,
  });
}

export function useStockValuation(params: StockValuationParams) {
  return useQuery({
    queryKey: [...qk.reports.all, 'stock-valuation', params] as const,
    queryFn: () => getStockValuation(params),
    staleTime: REPORTS_STALE,
    placeholderData: (prev) => prev,
  });
}

export function useInventoryMovement(params: InventoryMovementParams) {
  return useQuery({
    queryKey: [...qk.reports.all, 'inventory-movement', params] as const,
    queryFn: () => getInventoryMovement(params),
    staleTime: REPORTS_STALE,
    placeholderData: (prev) => prev,
  });
}

export function useArAging(params: ArAgingParams) {
  return useQuery({
    queryKey: [...qk.reports.all, 'ar-aging', params] as const,
    queryFn: () => getArAging(params),
    staleTime: REPORTS_STALE,
    placeholderData: (prev) => prev,
  });
}

export function useChequeCalendar(params: ChequeCalendarParams) {
  return useQuery({
    queryKey: [...qk.reports.all, 'cheque-calendar', params] as const,
    queryFn: () => getChequeCalendar(params),
    staleTime: REPORTS_STALE,
    placeholderData: (prev) => prev,
  });
}