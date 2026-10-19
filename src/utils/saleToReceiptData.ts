import type { SaleDetail } from '@/types/sale';
import type { ReceiptData, ReceiptItem, ReceiptReturnLine } from '@/types/receipt';

export function saleToReceiptData(sale: SaleDetail): ReceiptData {
  const items: ReceiptItem[] = sale.Items.map((item) => {
    const unitPrice = Number(item.UnitPrice);
    const discountPct = Number(item.Discount);
    const unitDiscount = (unitPrice * discountPct) / 100;
    const lineTotal = Number(item.LineTotal);
    return {
      name: item.Product.Name,
      quantity: item.Qty,
      unitPrice,
      unitDiscount,
      lineTotal,
      returnedQty: item.ReturnedQty,
    };
  });

  const returns: ReceiptReturnLine[] = sale.Returns.map((r) => ({
    code: r.Code,
    refundMethod: r.RefundMethod,
    refundAmount: Number(r.RefundAmount),
    createdAt: r.CreatedAt,
  }));

  const cashAmount = Number(sale.CashAmount);
  const cardAmount = Number(sale.CardAmount);
  const creditAmount = Number(sale.CreditAmount);
  const chequeAmount = Number(sale.ChequeAmount);

  const nonZeroMethods = [cashAmount, cardAmount, creditAmount, chequeAmount]
    .filter((n) => n > 0).length;

  const paymentMode: ReceiptData['paymentMode'] =
    nonZeroMethods === 0
      ? 'none'
      : nonZeroMethods > 1
        ? 'split'
        : cashAmount > 0
          ? 'cash'
          : cardAmount > 0
            ? 'card'
            : creditAmount > 0
              ? 'credit'
              : 'cheque';

  return {
    invoiceNumber: sale.InvoiceNumber,
    date: sale.CreatedAt,
    cashier: sale.Cashier.FullName ?? sale.Cashier.Username,
    customerName: sale.Customer?.Name,
    customerPhone: undefined,
    terminalName: `${sale.Terminal.Name} (${sale.Terminal.Code})`,

    items,

    subtotal: Number(sale.Subtotal),
    discountAmount: Number(sale.DiscountAmount),
    taxAmount: Number(sale.TaxAmount),
    loyaltyDiscount: Number(sale.LoyaltyDiscountAmount),
    total: Number(sale.TotalAmount),
    paid: Number(sale.PaidAmount),

    cashAmount,
    cardAmount,
    creditAmount,
    chequeAmount,

    returns,

    paymentMode,

    notes: sale.Notes ?? undefined,
    status: sale.Status,
    cancelReason: sale.CancelReason ?? undefined,
  };
}