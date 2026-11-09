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
  /** Line-specific discount % (cashier editable). */
  Discount: number;
  /** Flat discount amount per unit (LKR), copied from the product at add-time. */
  DiscountAmount: number;
  /** Tax rate %, null = no tax. */
  TaxRate: number | null;
  Notes?: string;
}

interface CartState {
  lines: CartLine[];
  customerId: string | null;
  notes: string;
  invoiceDiscount: number;
  addLine: (
    line: Omit<CartLine, 'Qty' | 'Discount' | 'DiscountAmount'> & {
      Qty?: number;
      Discount?: number;
      DiscountAmount?: number;
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
            DiscountAmount: line.DiscountAmount ?? 0,
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
 * Combined effective discount % for a line, given the invoice-wide %.
 * Invoice discount is compound — applies to the post-line-discount amount.
 *
 * NOTE: This returns the % equivalent of ONLY the line % + invoice %.
 * The flat discount (DiscountAmount) is separate — it applies as an
 * absolute amount FIRST, reducing the unit price before any % math.
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
 * Maximum line % discount so the *post-flat-and-percent-and-invoice*
 * price does not fall below the product's cost price.
 *
 * Full unit-price derivation:
 *   effective = (unitPrice − flat) × (1 − linePct/100) × (1 − invoicePct/100)
 *
 * We solve for the maximum linePct such that effective ≥ costPrice.
 */
export function maxDiscountGiven(
  unitPrice: string,
  costPrice: string,
  flatDiscountAmount: number,
  invoicePct: number,
): number {
  const up = new Decimal(unitPrice);
  const cp = new Decimal(costPrice);
  const flat = new Decimal(flatDiscountAmount ?? 0);

  // Post-flat unit price
  const afterFlat = up.sub(flat);
  if (afterFlat.lte(0)) return 0;

  const invoiceFactor = new Decimal(1).sub(
    new Decimal(invoicePct ?? 0).div(100),
  );
  if (invoiceFactor.lte(0)) return 0;

  const afterInvoice = afterFlat.mul(invoiceFactor);
  if (afterInvoice.lte(0)) return 0;

  // Solve: afterInvoice × (1 − linePct/100) ≥ costPrice
  // → linePct/100 ≤ 1 − cp / afterInvoice
  const max = new Decimal(1).sub(cp.div(afterInvoice)).mul(100);
  if (max.isNegative()) return 0;
  if (max.greaterThan(100)) return 100;
  return max.toDecimalPlaces(2, Decimal.ROUND_DOWN).toNumber();
}

/**
 * Maximum invoice discount % across all lines so that no line falls
 * below its cost price, taking each line's current line % AND flat
 * discount into account. Returns 100 when the cart is empty.
 */
export function maxInvoiceDiscount(lines: CartLine[]): number {
  if (lines.length === 0) return 100;
  let min = 100;
  for (const line of lines) {
    const m = maxDiscountGiven(
      line.UnitPrice,
      line.CostPrice,
      line.DiscountAmount ?? 0,
      line.Discount,
    );
    if (m < min) min = m;
  }
  return Math.max(0, min);
}

export interface CartTotals {
  subtotal: string;
  flatDiscountAmount: string;
  lineDiscountAmount: string;
  invoiceDiscountAmount: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
}

/**
 * Cart totals with flat + line % + invoice % compounding in order:
 *   1. Flat discount (absolute, per unit) — subtracted from unit price
 *   2. Line % — applies to post-flat amount
 *   3. Invoice % — applies to post-line amount
 *   4. Tax — applies to post-invoice amount
 *
 * Result matches the backend `sales.service.ts` line math exactly
 * (4dp at every step), so the total we display equals what the backend
 * will compute. No "Payment total doesn't match" surprises at checkout.
 */
export function computeCartTotals(
  lines: CartLine[],
  invoicePct = 0,
): CartTotals {
  const ZERO = new Decimal(0);
  let subtotal = ZERO;
  let flatDiscountTotal = ZERO;
  let lineDiscountOnly = ZERO;
  let invoiceDiscountOnly = ZERO;
  let taxAmount = ZERO;

  for (const line of lines) {
    const qty = new Decimal(line.Qty);
    const unitPrice = new Decimal(line.UnitPrice);
    const lineSubtotal = qty.mul(unitPrice).toDecimalPlaces(4);

    // 1. Flat discount per unit × qty
    const flatPerUnit = new Decimal(line.DiscountAmount ?? 0);
    const flatLine = qty.mul(flatPerUnit).toDecimalPlaces(4);
    const afterFlat = lineSubtotal.sub(flatLine);

    // 2. Line % on post-flat amount
    const linePct = new Decimal(line.Discount ?? 0);
    const lineDisc = afterFlat.mul(linePct).div(100).toDecimalPlaces(4);
    const afterLine = afterFlat.sub(lineDisc);

    // 3. Invoice % on post-line amount
    const invoicePctDec = new Decimal(invoicePct ?? 0);
    const invoiceDisc = afterLine
      .mul(invoicePctDec)
      .div(100)
      .toDecimalPlaces(4);
    const afterInvoice = afterLine.sub(invoiceDisc);

    // 4. Tax on post-invoice amount
    const lineTax =
      line.TaxRate !== null
        ? afterInvoice
            .mul(new Decimal(line.TaxRate))
            .div(100)
            .toDecimalPlaces(4)
        : ZERO;

    subtotal = subtotal.add(lineSubtotal);
    flatDiscountTotal = flatDiscountTotal.add(flatLine);
    lineDiscountOnly = lineDiscountOnly.add(lineDisc);
    invoiceDiscountOnly = invoiceDiscountOnly.add(invoiceDisc);
    taxAmount = taxAmount.add(lineTax);
  }

  const combinedDiscount = flatDiscountTotal
    .add(lineDiscountOnly)
    .add(invoiceDiscountOnly);
  const total = subtotal.sub(combinedDiscount).add(taxAmount);

  return {
    subtotal: subtotal.toFixed(4),
    flatDiscountAmount: flatDiscountTotal.toFixed(4),
    lineDiscountAmount: lineDiscountOnly.toFixed(4),
    invoiceDiscountAmount: invoiceDiscountOnly.toFixed(4),
    discountAmount: combinedDiscount.toFixed(4),
    taxAmount: taxAmount.toFixed(4),
    total: total.toFixed(4),
  };
}