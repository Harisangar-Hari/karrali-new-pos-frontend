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
  return {
    code: quotation.Code,
    date: quotation.CreatedAt,
    validUntil: quotation.ValidUntil,
    customerName: quotation.Customer?.Name,
    customerCode: quotation.Customer?.Code,
    items: quotation.Items.map((item) => ({
      name: item.Product.Name,
      sku: item.Product.SKU,
      quantity: item.Qty,
      unitPrice: Number(item.UnitPrice),
      discountPct: Number(item.Discount),
      lineSubtotal: Number(item.LineSubtotal),
      lineDiscount: Number(item.LineDiscount),
      lineTax: Number(item.LineTax),
      lineTotal: Number(item.LineTotal),
    })),
    subtotal: Number(quotation.Subtotal),
    discountAmount: Number(quotation.DiscountAmount),
    taxAmount: Number(quotation.TaxAmount),
    total: Number(quotation.TotalAmount),
    notes: quotation.Notes ?? undefined,
    status: quotation.EffectiveStatus,
  };
}