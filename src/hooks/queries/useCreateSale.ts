import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSale } from '@/api/sales';
import { qk } from '@/config/queryKeys';
import type { CreateSaleInput, SaleDetail } from '@/types/sale';

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation<SaleDetail, unknown, CreateSaleInput>({
    mutationFn: (input) => createSale(input),
    onSuccess: () => {
      // A sale touches stock, cash ledger, customer balance, and loyalty.
      // Invalidate everything so POS search reflects the new stock on the
      // next keystroke.
      qc.invalidateQueries({ queryKey: qk.sales.all });
      qc.invalidateQueries({ queryKey: qk.products.all });
      qc.invalidateQueries({ queryKey: qk.customers.all });
      qc.invalidateQueries({ queryKey: qk.cashSessions.all });
      qc.invalidateQueries({ queryKey: qk.stock.all });
    },
  });
}