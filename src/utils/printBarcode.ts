import JsBarcode from 'jsbarcode';

export interface BarcodeLabelData {
  productName: string;
  barcode: string;
  price?: number | string;
  copies?: number;
}

/** Label stock size. Change here if you use different labels. */
const LABEL_WIDTH_MM = 38;
const LABEL_HEIGHT_MM = 25;

/** Short brand line at the top of each label. */
const SHORT_BRAND = 'KARRALI';

/**
 * Pick the format from the string shape:
 *   - 13 digits → EAN13 (retail standard)
 *   - 12 digits → UPC (US retail standard)
 *   - anything else → CODE128 (accepts any alphanumeric)
 */
function detectFormat(barcode: string): 'EAN13' | 'UPC' | 'CODE128' {
  const trimmed = barcode.trim();
  if (/^\d{13}$/.test(trimmed)) return 'EAN13';
  if (/^\d{12}$/.test(trimmed)) return 'UPC';
  return 'CODE128';
}

/**
 * Render a barcode to a base64 PNG via canvas. Returns "" when JsBarcode
 * rejects the input — callers fall back to plain-text rendering.
 *
 * Canvas → PNG is used instead of inline SVG because SVG rendering has
 * minor inconsistencies on thermal printer drivers (fonts, margins,
 * dpi scaling). A fixed bitmap is bulletproof.
 */
function generateBarcodeImage(barcode: string): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 350;
    canvas.height = 120;

    JsBarcode(canvas, barcode, {
      format: detectFormat(barcode),
      width: 2,
      height: 80,
      displayValue: false,
      margin: 5,
      background: '#ffffff',
      lineColor: '#000000',
    });

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('[printBarcode] generation failed:', err);
    return createFallbackBarcode(barcode);
  }
}

/**
 * Last-resort fallback: draw a fake barcode from the digits. Not
 * scannable, but keeps the label looking right when JsBarcode fails.
 */
function createFallbackBarcode(barcode: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 350;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (!ctx) return createTextOnlyBarcode(barcode);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 350, 80);

  const digits = barcode.replace(/\D/g, '').split('');
  const barWidth = 350 / (digits.length * 2 + 1);
  let x = barWidth;

  digits.forEach((digit) => {
    const num = parseInt(digit) || 0;
    const width = (num + 1) * barWidth * 0.8;
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, 5, width, 60);
    x += width + barWidth;
  });

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18px Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(barcode, 175, 75);

  return canvas.toDataURL('image/png');
}

function createTextOnlyBarcode(barcode: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 350;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 350, 60);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(barcode, 175, 30);
  return canvas.toDataURL('image/png');
}

function formatPrice(price: number | string): string {
  const n = typeof price === 'string' ? Number(price) : price;
  return Number.isFinite(n) ? n.toFixed(2) : String(price);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build the full label HTML for one or more labels (expanding copies).
 * Each `.page` = one physical label with a page break after it.
 */
function buildBarcodeHtml(labels: BarcodeLabelData[]): string {
  const labelHtml = labels
    .flatMap((label) => {
      const copies = Math.max(1, label.copies ?? 1);
      const barcode = label.barcode.trim();
      if (!barcode) return [];
      const imgData = generateBarcodeImage(barcode);
      const priceHtml =
        label.price !== undefined && label.price !== ''
          ? `<div class="price">Rs ${formatPrice(label.price)}</div>`
          : '';
      return Array.from({ length: copies }).map(
        () => `
          <div class="page">
            <div class="label">
              <div class="shop">${SHORT_BRAND}</div>
              ${
                imgData
                  ? `<img class="barcode" src="${imgData}" alt="${escapeHtml(
                      barcode,
                    )}" />`
                  : `<div class="barcode-text">${escapeHtml(barcode)}</div>`
              }
              <div class="barcode-number">${escapeHtml(barcode)}</div>
              ${priceHtml}
            </div>
          </div>
        `,
      );
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Barcode Labels</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: ${LABEL_WIDTH_MM}mm ${LABEL_HEIGHT_MM}mm;
    margin: 0 !important;
  }

  html, body {
    font-family: 'Courier New', Courier, monospace;
    color: #000 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin: 0 !important;
    padding: 0 !important;
    width: ${LABEL_WIDTH_MM}mm;
    height: ${LABEL_HEIGHT_MM}mm;
    overflow: hidden !important;
  }

  .page {
    width: ${LABEL_WIDTH_MM}mm;
    height: ${LABEL_HEIGHT_MM}mm;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    page-break-after: always !important;
    page-break-inside: avoid !important;
    margin: 0 !important;
    padding: 0.5mm 1mm !important;
    box-sizing: border-box;
  }

  .page:last-child {
    page-break-after: auto !important;
  }

  .label {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0;
    padding: 0;
    margin: 0;
  }

  .shop {
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 3px;
    line-height: 1.2;
    color: #000;
    text-align: center;
    width: 100%;
    flex-shrink: 0;
    margin-bottom: 1px;
    padding: 0;
  }

  .barcode {
    max-width: 34mm;
    max-height: 12mm;
    width: auto;
    height: auto;
    display: block;
    margin: 0 auto;
    padding: 0;
    image-rendering: pixelated;
    flex-shrink: 0;
  }

  .barcode-text {
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 2px;
    color: #000;
    text-align: center;
    width: 100%;
    flex-shrink: 0;
    padding: 2px 0;
  }

  .barcode-number {
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 1.5px;
    color: #000;
    text-align: center;
    width: 100%;
    flex-shrink: 0;
    margin-top: 0;
    padding: 0;
    line-height: 1.2;
  }

  .price {
    font-size: 13px;
    font-weight: 900 !important;
    color: #000;
    text-align: center;
    width: 100%;
    flex-shrink: 0;
    margin-top: 1px;
    padding: 0;
    line-height: 1.2;
  }

  @media print {
    @page {
      size: ${LABEL_WIDTH_MM}mm ${LABEL_HEIGHT_MM}mm;
      margin: 0 !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${LABEL_WIDTH_MM}mm;
      height: ${LABEL_HEIGHT_MM}mm !important;
      overflow: hidden !important;
    }
    .page {
      width: ${LABEL_WIDTH_MM}mm;
      height: ${LABEL_HEIGHT_MM}mm;
      margin: 0 !important;
      padding: 0.5mm 1mm !important;
      overflow: hidden;
      page-break-after: always !important;
      page-break-inside: avoid !important;
    }
    .page:last-child {
      page-break-after: auto !important;
    }
  }

  /* On-screen preview — shows the labels stacked so you can eyeball before printing */
  @media screen {
    html, body {
      width: auto;
      height: auto;
      overflow: visible !important;
    }
    body {
      background: #f0f0f0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .page {
      width: ${LABEL_WIDTH_MM}mm;
      height: ${LABEL_HEIGHT_MM}mm;
      background: #fff;
      margin: 5px auto !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 2px;
      border: 1px dashed #ccc;
      page-break-after: auto;
    }
  }
</style>
</head>
<body>

${labelHtml}

<script>
  (function () {
    var printAttempted = false;

    function waitForImagesAndPrint() {
      var images = document.querySelectorAll('.barcode');
      var loadedCount = 0;
      var total = images.length;

      if (total === 0) { doPrint(); return; }

      function check() {
        loadedCount++;
        if (loadedCount === total && !printAttempted) {
          printAttempted = true;
          doPrint();
        }
      }

      images.forEach(function (img) {
        if (img.complete && img.naturalWidth > 0) {
          check();
        } else {
          img.onload = check;
          img.onerror = check;
        }
      });

      // Defensive: if load never fires (very rare), print after 3s
      setTimeout(function () {
        if (loadedCount < total && !printAttempted) {
          printAttempted = true;
          doPrint();
        }
      }, 3000);
    }

    function doPrint() {
      try {
        window.focus();
        requestAnimationFrame(function () { window.print(); });
      } catch (err) {
        console.error('Print error:', err);
      }
    }

    if (document.readyState === 'complete') {
      waitForImagesAndPrint();
    } else {
      window.addEventListener('load', waitForImagesAndPrint);
    }
  })();
</script>
</body>
</html>`;
}

/**
 * Print one or more barcode labels. Each entry is repeated `copies` times
 * (default 1). Opens a new window with an on-screen preview and triggers
 * the print dialog automatically.
 */
export async function printBarcodeLabels(
  labels: BarcodeLabelData[],
): Promise<void> {
  try {
    // Clean and validate
    const cleaned = labels
      .map((l) => ({
        ...l,
        barcode: l.barcode.replace(/\s/g, ''),
        copies: l.copies ?? 1,
      }))
      .filter((l) => l.barcode.length >= 4);

    if (cleaned.length === 0) {
      // eslint-disable-next-line no-alert
      alert(
        'No printable barcodes — each product needs a barcode of at least 4 characters.',
      );
      return;
    }

    const html = buildBarcodeHtml(cleaned);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const win = window.open(
      url,
      '_blank',
      'width=400,height=600,menubar=yes,toolbar=yes,status=yes,scrollbars=yes',
    );

    if (win) {
      win.addEventListener('load', () => {
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      });
      win.focus();
    } else {
      // Popup blocked — fall back to iframe
      const iframe = document.createElement('iframe');
      iframe.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:9999;background:#fff;';
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(() => iframe.remove(), 15000);
    }
  } catch (error) {
    console.error('[printBarcodeLabels] failed:', error);
    // eslint-disable-next-line no-alert
    alert(
      `Failed to print barcode: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}