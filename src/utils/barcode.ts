import JsBarcode from 'jsbarcode';

/**
 * Generate a valid EAN-13 barcode using the GS1 "internal use" prefix
 * (200–299 reserved for in-store codes). Returns 13 digits with a valid
 * check digit — scannable by any standard EAN-13 reader.
 */
export function generateEan13(): string {
  // Start with "2" (in-store internal use range)
  let base = '2';
  for (let i = 0; i < 11; i++) {
    base += Math.floor(Math.random() * 10).toString();
  }
  // EAN-13 check digit: odd positions (0-indexed) × 1, even positions × 3
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check;
}

/**
 * Pick the barcode format from the string shape. Falls back to CODE128
 * (which accepts any alphanumeric input) when the length doesn't match
 * a numeric retail format.
 *
 *   - 13 digits  → EAN13
 *   - 12 digits  → UPC
 *   - anything   → CODE128
 */
export function detectFormat(barcode: string): 'EAN13' | 'UPC' | 'CODE128' {
  const trimmed = barcode.trim();
  if (/^\d{13}$/.test(trimmed)) return 'EAN13';
  if (/^\d{12}$/.test(trimmed)) return 'UPC';
  return 'CODE128';
}

/**
 * Shared defaults for the on-screen preview. The print path uses its
 * own taller options — see printBarcode.ts.
 */
export const DEFAULT_BARCODE_OPTIONS = {
  width: 2,
  height: 60,
  displayValue: true,
  fontSize: 14,
  margin: 2,
  background: '#ffffff',
  lineColor: '#000000',
} as const;

/**
 * Try to render a barcode into an SVG. Attempts the format detected
 * from the value; if that fails (e.g. EAN-13 with a bad check digit),
 * retries as CODE128. Returns true on success, false when both fail.
 *
 * Clears any partial output before each attempt, so a failed EAN13
 * render doesn't leave ghost bars on the element.
 */
export function renderBarcodeToSvg(
  svg: SVGSVGElement,
  value: string,
  height: number,
): boolean {
  const clear = () => {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  };

  const attempt = (format: 'EAN13' | 'UPC' | 'CODE128'): boolean => {
    clear();
    try {
      JsBarcode(svg, value, {
        ...DEFAULT_BARCODE_OPTIONS,
        height,
        format,
      });
      return true;
    } catch {
      return false;
    }
  };

  const primary = detectFormat(value);
  if (attempt(primary)) return true;

  // Fallback: CODE128 accepts almost any string.
  if (primary !== 'CODE128' && attempt('CODE128')) return true;

  clear();
  return false;
}