import type { QuotationDetail } from '@/types/quotation';
import type { QuotationDocumentData } from '@/types/quotationDocument';

/**
 * Flatten a QuotationDetail (from GET /quotations/:id) into the shape
 * consumed by printQuotation. Numbers are parsed from the backend's
 * Decimal-as-string columns.
 */
export function quotationToDocumentData(
  quotation: QuotationDetail,
): QuotationDocumentData {
  const items = quotation.Items.map((item) => {
    const qty = item.Qty;
    const unitPrice = Number(item.UnitPrice);
    const flatPerUnit = Number(item.DiscountAmount ?? 0);
    const lineDiscountPct = Number(item.Discount);
    return {
      name: item.Product.Name,
      sku: item.Product.SKU,
      quantity: qty,
      unitPrice,
      flatDiscountAmount: flatPerUnit,
      discountPct: lineDiscountPct,
      lineSubtotal: Number(item.LineSubtotal),
      lineDiscount: Number(item.LineDiscount),
      lineTax: Number(item.LineTax),
      lineTotal: Number(item.LineTotal),
    };
  });

  // Aggregate flat discounts so the summary can display them separately
  const flatDiscountTotal = items.reduce(
    (sum, it) => sum + it.flatDiscountAmount * it.quantity,
    0,
  );

  return {
    code: quotation.Code,
    date: quotation.CreatedAt,
    validUntil: quotation.ValidUntil,
    customerName: quotation.Customer?.Name,
    customerCode: quotation.Customer?.Code,
    items,
    subtotal: Number(quotation.Subtotal),
    flatDiscountAmount: flatDiscountTotal,
    discountAmount: Number(quotation.DiscountAmount),
    taxAmount: Number(quotation.TaxAmount),
    total: Number(quotation.TotalAmount),
    notes: quotation.Notes ?? undefined,
    status: quotation.EffectiveStatus,
  };
}