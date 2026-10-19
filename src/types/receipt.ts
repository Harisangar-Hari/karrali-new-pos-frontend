export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  unitDiscount: number;
  lineTotal: number;
  /** How many units of the original quantity have already been returned. */
  returnedQty?: number;
}

export interface ReceiptReturnLine {
  code: string;
  refundMethod: 'CASH' | 'CREDIT';
  refundAmount: number;
  createdAt: string;
}

export type ReceiptPaymentMode =
  | 'cash'
  | 'card'
  | 'credit'
  | 'cheque'
  | 'split'
  | 'none';

export type ReceiptStatus =
  | 'COMPLETED'
  | 'PARTIALLY_RETURNED'
  | 'FULLY_RETURNED'
  | 'CANCELLED';

export interface ReceiptData {
  invoiceNumber: string;
  date: string;
  cashier: string;
  customerName?: string;
  customerPhone?: string;
  terminalName: string;

  items: ReceiptItem[];

  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  loyaltyDiscount: number;
  total: number;
  paid: number;

  cashAmount: number;
  cardAmount: number;
  creditAmount: number;
  chequeAmount: number;

  cashTendered?: number;
  changeDue?: number;

  /** Return events already recorded against this sale. */
  returns?: ReceiptReturnLine[];

  paymentMode: ReceiptPaymentMode;

  notes?: string;
  status?: ReceiptStatus;
  cancelReason?: string;
}

export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
}