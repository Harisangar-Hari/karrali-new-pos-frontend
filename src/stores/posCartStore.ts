import { create } from 'zustand';
import Decimal from 'decimal.js';

export interface CartLine {
  ProductId: string;
  Name: string;
  SKU: string | null;
  UnitPrice: string;
  /** Product cost at add-time. Used to enforce the "no sale below cost" floor. */
  CostPrice: string;
  Qty: number;
  Discount: number; // % — line-specific
  TaxRate: number | null;
  Notes?: string;
}

interface CartState {
  lines: CartLine[];
  customerId: string | null;
  notes: string;
  invoiceDiscount: number;
  addLine: (
    line: Omit<CartLine, 'Qty' | 'Discount'> & {
      Qty?: number;
      Discount?: number;
    },
  ) => void;
  updateQty: (productId: string, qty: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  removeLine: (productId: string) => void;
  setCustomer: (id: string | null) => void;
  setNotes: (notes: string) => void;
  setInvoiceDiscount: (pct: number) => void;
  clear: () => void;
}

export const usePosCartStore = create<CartState>((set) => ({
  lines: [],
  customerId: null,
  notes: '',
  invoiceDiscount: 0,

  addLine: (line) =>
    set((state) => {
      const existing = state.lines.find((l) => l.ProductId === line.ProductId);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.ProductId === line.ProductId
              ? { ...l, Qty: l.Qty + (line.Qty ?? 1) }
              : l,
          ),
        };
      }
      return {
        lines: [
          ...state.lines,
          {
            ProductId: line.ProductId,
            Name: line.Name,
            SKU: line.SKU,
            UnitPrice: line.UnitPrice,
            CostPrice: line.CostPrice,
            Qty: line.Qty ?? 1,
            Discount: line.Discount ?? 0,
            TaxRate: line.TaxRate,
            Notes: line.Notes,
          },
        ],
      };
    }),

  updateQty: (productId, qty) =>
    set((state) => ({
      lines:
        qty <= 0
          ? state.lines.filter((l) => l.ProductId !== productId)
          : state.lines.map((l) =>
              l.ProductId === productId ? { ...l, Qty: qty } : l,
            ),
    })),

  updateDiscount: (productId, discount) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.ProductId === productId
          ? { ...l, Discount: Math.max(0, Math.min(100, discount)) }
          : l,
      ),
    })),

  removeLine: (productId) =>
    set((state) => ({
      lines: state.lines.filter((l) => l.ProductId !== productId),
    })),

  setCustomer: (id) => set({ customerId: id }),
  setNotes: (notes) => set({ notes }),
  setInvoiceDiscount: (pct) =>
    set({ invoiceDiscount: Math.max(0, Math.min(100, pct)) }),
  clear: () =>
    set({ lines: [], customerId: null, notes: '', invoiceDiscount: 0 }),
}));

/**
 * Combined effective discount % for a line, given an invoice-wide %.
 * Invoice discount is compound — applies to the post-line-discount amount.
 */
export function effectiveLineDiscount(
  line: CartLine,
  invoicePct: number,
): number {
  const lineFactor = new Decimal(1).sub(
    new Decimal(line.Discount ?? 0).div(100),
  );
  const invoiceFactor = new Decimal(1).sub(
    new Decimal(invoicePct ?? 0).div(100),
  );
  const combined = new Decimal(1).sub(lineFactor.mul(invoiceFactor));
  const pct = combined.mul(100);
  if (pct.isNegative()) return 0;
  if (pct.greaterThan(100)) return 100;
  return pct.toNumber();
}

/**
 * Maximum discount % (for either the line OR the invoice, whichever is
 * the "other" fixed side) so the effective unit price stays at or above
 * the product cost. Uses the compounded formula:
 *
 *   unitPrice × (1 − fixedPct/100) × (1 − maxPct/100) ≥ costPrice
 *
 * If unitPrice is already at or below cost, returns 0. Clamped to [0, 100].
 */
export function maxDiscountGiven(
  unitPrice: string,
  costPrice: string,
  otherPct: number,
): number {
  const up = new Decimal(unitPrice);
  const cp = new Decimal(costPrice);
  if (up.lte(0)) return 0;

  const otherFactor = new Decimal(1).sub(new Decimal(otherPct ?? 0).div(100));
  if (otherFactor.lte(0)) return 0;

  const afterOther = up.mul(otherFactor);
  if (afterOther.lte(0)) return 0;

  const max = new Decimal(1).sub(cp.div(afterOther)).mul(100);
  if (max.isNegative()) return 0;
  if (max.greaterThan(100)) return 100;
  // Round DOWN to the nearest 0.01 so a user input that matches the cap
  // never accidentally rounds above it.
  return max.toDecimalPlaces(2, Decimal.ROUND_DOWN).toNumber();
}

/**
 * Maximum invoice discount % across all lines so that NO line falls below
 * its cost price, taking each line's current line-level discount into
 * account. Returns 100 when the cart is empty.
 */
export function maxInvoiceDiscount(lines: CartLine[]): number {
  if (lines.length === 0) return 100;
  let min = 100;
  for (const line of lines) {
    const m = maxDiscountGiven(line.UnitPrice, line.CostPrice, line.Discount);
    if (m < min) min = m;
  }
  return Math.max(0, min);
}

export interface CartTotals {
  subtotal: string;
  lineDiscountAmount: string;
  invoiceDiscountAmount: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
}

export function computeCartTotals(
  lines: CartLine[],
  invoicePct = 0,
): CartTotals {
  const ZERO = new Decimal(0);
  let subtotal = ZERO;
  let lineDiscountOnly = ZERO;
  let invoiceDiscountOnly = ZERO;
  let taxAmount = ZERO;

  for (const line of lines) {
    const qty = new Decimal(line.Qty);
    const unitPrice = new Decimal(line.UnitPrice);
    const lineSubtotal = qty.mul(unitPrice).toDecimalPlaces(4);

    const linePct = new Decimal(line.Discount ?? 0);
    const lineDisc = lineSubtotal.mul(linePct).div(100).toDecimalPlaces(4);
    const afterLineDisc = lineSubtotal.sub(lineDisc);

    const invoicePctDec = new Decimal(invoicePct ?? 0);
    const invoiceDisc = afterLineDisc
      .mul(invoicePctDec)
      .div(100)
      .toDecimalPlaces(4);
    const afterAllDisc = afterLineDisc.sub(invoiceDisc);

    const lineTax =
      line.TaxRate !== null
        ? afterAllDisc.mul(new Decimal(line.TaxRate)).div(100).toDecimalPlaces(4)
        : ZERO;

    subtotal = subtotal.add(lineSubtotal);
    lineDiscountOnly = lineDiscountOnly.add(lineDisc);
    invoiceDiscountOnly = invoiceDiscountOnly.add(invoiceDisc);
    taxAmount = taxAmount.add(lineTax);
  }

  const combinedDiscount = lineDiscountOnly.add(invoiceDiscountOnly);
  const total = subtotal.sub(combinedDiscount).add(taxAmount);

  return {
    subtotal: subtotal.toFixed(4),
    lineDiscountAmount: lineDiscountOnly.toFixed(4),
    invoiceDiscountAmount: invoiceDiscountOnly.toFixed(4),
    discountAmount: combinedDiscount.toFixed(4),
    taxAmount: taxAmount.toFixed(4),
    total: total.toFixed(4),
  };
}