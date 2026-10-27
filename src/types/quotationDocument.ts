export interface QuotationDocumentItem {
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineSubtotal: number;
  lineDiscount: number;
  lineTax: number;
  lineTotal: number;
}

export type QuotationDocumentStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CONVERTED'
  | 'EXPIRED';

export interface QuotationDocumentData {
  code: string;
  /** ISO timestamp. Formatted inside the print HTML as DD/MM/YYYY. */
  date: string;
  validUntil: string | null;
  customerName?: string;
  customerCode?: string;
  customerPhone?: string;

  items: QuotationDocumentItem[];

  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;

  notes?: string;
  status: QuotationDocumentStatus;
}