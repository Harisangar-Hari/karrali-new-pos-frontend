import type { ReceiptData, ShopInfo } from '@/types/receipt';

/** Where the logo lives. Drop it in `public/logo.jpeg`. */
const LOGO_URL = '/logo.jpeg';

/** Default shop info — override per call if you add a Settings key later. */
export const DEFAULT_SHOP_INFO: ShopInfo = {
  name: 'Karrali Manufacture',
  address: 'No 69, Palaly Road, Thirunelveli, Jaffna',
  phone: '0776925633',
};

/** Money format — compact, no thousand separator, matches the old receipt. */
const m = (n: number): string => n.toFixed(2);

/**
 * Convert a local image URL to a base64 data URI. Safe to call even if the
 * logo is missing — returns "" on failure so the receipt renders without one.
 */
export function imageToBase64(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } else {
          resolve('');
        }
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = src;
  });
}

function paymentModeLabel(data: ReceiptData): string {
  const modes: string[] = [];
  if (data.cashAmount > 0) modes.push('Cash');
  if (data.cardAmount > 0) modes.push('Card');
  if (data.creditAmount > 0) modes.push('Credit');
  if (data.chequeAmount > 0) modes.push('Cheque');
  return modes.length === 0 ? '—' : modes.join(' + ');
}

function statusBanner(status?: ReceiptData['status']): string {
  if (!status) return '';
  if (status === 'CANCELLED') {
    return `<div style="text-align:center;font-size:20px;font-weight:900;color:#dc2626;letter-spacing:6px;border:3px solid #dc2626;padding:4px 0;margin:6px 0;">CANCELLED</div>`;
  }
  if (status === 'FULLY_RETURNED') {
    return `<div style="text-align:center;font-size:14px;font-weight:900;color:#7c3aed;letter-spacing:3px;border:2px solid #7c3aed;padding:3px 0;margin:6px 0;">FULLY RETURNED</div>`;
  }
  if (status === 'PARTIALLY_RETURNED') {
    return `<div style="text-align:center;font-size:13px;font-weight:900;color:#d97706;letter-spacing:2px;border:2px solid #d97706;padding:3px 0;margin:6px 0;">PARTIALLY RETURNED</div>`;
  }
  return '';
}

export interface BuildOptions {
  shop?: ShopInfo;
  /** When true (default), the generated HTML auto-fires window.print(). */
  autoPrint?: boolean;
}

/**
 * Build the full receipt HTML. This is what gets printed AND what gets
 * rendered to PDF — keep it the single source of truth for layout.
 */
export function buildReceiptHtml(
  data: ReceiptData,
  logoB64: string,
  options: BuildOptions = {},
): string {
  const shop = options.shop ?? DEFAULT_SHOP_INFO;
  const autoPrint = options.autoPrint ?? true;

  const displayDate = new Date(data.date).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // ── Items ────────────────────────────────────────────────────
  const rows = data.items
    .map((item, index) => {
      const separator =
        index > 0
          ? `<tr><td colspan="2" class="item-separator">- - - - - - - - - - - - - - - -</td></tr>`
          : '';

      const priceDisplay =
        item.unitDiscount > 0
          ? `<span style="font-size:12px;font-weight:bold;color:#000;">Rs ${m(
              item.unitPrice,
            )}</span> <span style="color:#000;font-size:12px;font-weight:bold;">(-${m(
              item.unitDiscount,
            )})</span>`
          : `<span style="font-size:12px;font-weight:bold;color:#000;">Rs ${m(
              item.unitPrice,
            )}</span>`;

      // Show how many units of this line have already been returned.
      const returnedNote =
        item.returnedQty && item.returnedQty > 0
          ? `<div style="font-size:10px;color:#dc2626;font-weight:900;margin-top:1px;">&#8627; ${item.returnedQty} returned</div>`
          : '';

      return `
        ${separator}
        <tr>
          <td colspan="2" class="item-name">${item.name}${returnedNote}</td>
        </tr>
        <tr>
          <td class="qty">${item.quantity} x ${priceDisplay}</td>
          <td class="amount">${m(item.lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  // ── Returns totals ───────────────────────────────────────────
  const hasReturns = !!(data.returns && data.returns.length > 0);
  const totalRefunded = hasReturns
    ? data.returns!.reduce((s, r) => s + r.refundAmount, 0)
    : 0;
  const netKept = Math.max(0, data.total - totalRefunded);

  // ── Summary rows ─────────────────────────────────────────────
  const showDiscount = data.discountAmount > 0;
  const showTax = data.taxAmount > 0;
  const showLoyalty = data.loyaltyDiscount > 0;
  const showCash = data.cashAmount > 0;
  const showCard = data.cardAmount > 0;
  const showCheque = data.chequeAmount > 0;
  const showCredit = data.creditAmount > 0;

  // Refund + Net kept — only when the sale has recorded returns
  const refundSummaryRows = hasReturns
    ? `
      <tr class="discount-row">
        <td class="sum-label">Refunded</td>
        <td class="sum-amount">-${m(totalRefunded)}</td>
      </tr>
      <tr>
        <td class="sum-label" style="font-weight:900;">Net kept</td>
        <td class="sum-amount" style="font-weight:900;">${m(netKept)}</td>
      </tr>
    `
    : '';

  const summaryRows = `
    <tr class="subtotal-row">
      <td class="sum-label">Subtotal</td>
      <td class="sum-amount">${m(data.subtotal)}</td>
    </tr>
    ${
      showDiscount
        ? `<tr class="discount-row">
             <td class="sum-label">Discount</td>
             <td class="sum-amount">-${m(data.discountAmount)}</td>
           </tr>`
        : ''
    }
    ${
      showTax
        ? `<tr class="subtotal-row">
             <td class="sum-label">Tax</td>
             <td class="sum-amount">${m(data.taxAmount)}</td>
           </tr>`
        : ''
    }
    ${
      showLoyalty
        ? `<tr class="discount-row">
             <td class="sum-label">Loyalty</td>
             <td class="sum-amount">-${m(data.loyaltyDiscount)}</td>
           </tr>`
        : ''
    }
    <tr class="total-row">
      <td class="sum-label">TOTAL</td>
      <td class="sum-amount">${m(data.total)}</td>
    </tr>
    ${
      showCash
        ? `<tr><td class="sum-label">Cash</td><td class="sum-amount">${m(
            data.cashAmount,
          )}</td></tr>`
        : ''
    }
    ${
      data.cashTendered !== undefined &&
      data.cashTendered > data.cashAmount + 0.0001
        ? `<tr><td class="sum-label">Tendered</td><td class="sum-amount">${m(
            data.cashTendered,
          )}</td></tr>`
        : ''
    }
    ${
      data.changeDue !== undefined && data.changeDue > 0.0001
        ? `<tr class="discount-row"><td class="sum-label">Change</td><td class="sum-amount">${m(
            data.changeDue,
          )}</td></tr>`
        : ''
    }
    ${
      showCard
        ? `<tr><td class="sum-label">Card</td><td class="sum-amount">${m(
            data.cardAmount,
          )}</td></tr>`
        : ''
    }
    ${
      showCheque
        ? `<tr><td class="sum-label">Cheque</td><td class="sum-amount">${m(
            data.chequeAmount,
          )}</td></tr>`
        : ''
    }
    ${
      showCredit
        ? `<tr class="discount-row"><td class="sum-label">Credit (owed)</td><td class="sum-amount">${m(
            data.creditAmount,
          )}</td></tr>`
        : ''
    }
    ${refundSummaryRows}
  `;

  // ── Returns block ────────────────────────────────────────────
  const returnsSection = hasReturns
    ? `
      <hr class="div" />
      <div style="font-size:12px;font-weight:900;text-align:center;letter-spacing:2px;margin-bottom:4px;color:#000;">RETURNS</div>
      <table>
        <tbody>
          ${data.returns!
            .map((r) => {
              const d = new Date(r.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
              const methodLabel =
                r.refundMethod === 'CASH' ? 'Cash refund' : 'Store credit';
              return `
                <tr>
                  <td style="font-size:11px;font-weight:700;padding:2px 0;color:#000;">
                    ${r.code}
                    <br/>
                    <span style="font-size:9px;color:#444;font-weight:600;">
                      ${d} &middot; ${methodLabel}
                    </span>
                  </td>
                  <td style="font-size:12px;font-weight:900;text-align:right;color:#dc2626;padding:2px 0;">
                    -${m(r.refundAmount)}
                  </td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    `
    : '';

  // ── Logo, notes, cancel reason ───────────────────────────────
  const logoTag = logoB64
    ? `<img class="logo" src="${logoB64}" alt="Logo" />`
    : '';

  const notesBlock = data.notes
    ? `<div style="font-size:11px;color:#000;font-weight:600;margin-top:6px;padding:4px;border-top:1px dashed #000;">
         <strong>Note:</strong> ${data.notes}
       </div>`
    : '';

  const cancelBlock =
    data.status === 'CANCELLED' && data.cancelReason
      ? `<div style="font-size:11px;color:#dc2626;font-weight:700;margin-top:4px;padding:4px;border-top:1px dashed #dc2626;">
           <strong>Cancel reason:</strong> ${data.cancelReason}
         </div>`
      : '';

  // ── Auto-print script ────────────────────────────────────────
  const script = autoPrint
    ? `
    <script>
      (function () {
        function fire() {
          setTimeout(function () { window.print(); }, 400);
        }
        if (document.readyState === 'complete') fire();
        else window.addEventListener('load', fire);
      })();
    </script>
    `
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Receipt ${data.invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page { size: 80mm auto; margin: 0; }

  html, body {
    width: 80mm;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    line-height: 1.55;
    color: #000 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 4mm padding each side = 72mm content on 80mm paper */
  .page { padding: 3mm 4mm 6mm 4mm; max-width: 80mm; }

  .logo { display: block; max-width: 60px; height: auto; margin: 0 auto 4px; }

  .header-left { text-align: left; }

  .shop-name {
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 1px;
    color: #000;
  }

  .shop-address {
    font-size: 12px;
    line-height: 1.5;
    color: #000;
    font-weight: 600;
  }

  .meta { font-size: 13px; line-height: 1.7; font-weight: 600; color: #000; }

  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .meta-label { font-weight: 900; color: #000; flex-shrink: 0; min-width: 55px; }

  .meta-value {
    font-weight: 700;
    color: #000;
    text-align: right;
    flex: 1;
    word-break: break-word;
  }

  .div { width: 100%; border: none; border-top: 2px solid #000; margin: 5px 0; }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; }

  td { padding: 2px 0; font-size: 14px; vertical-align: top; }

  .item-name {
    font-size: 14px;
    font-weight: 900;
    padding-top: 4px;
    padding-bottom: 1px;
    color: #000;
  }

  .item-separator {
    font-size: 12px;
    color: #000;
    text-align: center;
    padding: 3px 0;
    letter-spacing: 2px;
    font-weight: bold;
    line-height: 1;
  }

  .qty {
    width: 58%;
    font-size: 13px;
    padding-left: 4px;
    padding-bottom: 4px;
    font-weight: 600;
    color: #000;
  }

  .amount {
    width: 42%;
    text-align: right;
    font-size: 13px;
    font-weight: 900;
    padding-bottom: 4px;
    color: #000;
  }

  .sum-label { width: 55%; font-size: 14px; font-weight: 700; color: #000; }

  .sum-amount {
    width: 45%;
    text-align: right;
    font-size: 14px;
    font-weight: 900;
    color: #000;
  }

  .total-row td {
    font-size: 18px;
    font-weight: 900;
    padding-top: 5px;
    padding-bottom: 3px;
    color: #000;
  }

  .discount-row td {
    font-size: 14px;
    color: #000;
    font-weight: 900;
    padding-top: 3px;
  }

  .subtotal-row td {
    font-size: 14px;
    color: #000;
    font-weight: 700;
    padding-top: 3px;
  }

  .footer {
    text-align: center;
    font-size: 13px;
    margin-top: 6px;
    font-weight: 600;
    color: #000;
  }

  .footer-brand { margin-top: 6px; font-size: 11px; color: #000; font-weight: 600; }

  .footer-thanks { font-size: 16px; font-weight: 900; margin-top: 5px; color: #000; }

  .footer-no-return { font-size: 12px; color: #000; margin-top: 3px; font-weight: 700; }

  @media print {
    body { margin: 0; padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="page">

  ${logoTag}

  <div class="header-left">
    <div class="shop-name">${shop.name}</div>
    <div class="shop-address">${shop.address}</div>
    <div class="shop-address">Tel: ${shop.phone}</div>
  </div>

  <hr class="div">

  ${statusBanner(data.status)}

  <div class="meta">
    <div class="meta-row"><span class="meta-label">Invoice:</span><span class="meta-value">${data.invoiceNumber}</span></div>
    <div class="meta-row"><span class="meta-label">Date:</span><span class="meta-value">${displayDate}</span></div>
    <div class="meta-row"><span class="meta-label">Cashier:</span><span class="meta-value">${data.cashier}</span></div>
    ${
      data.customerName
        ? `<div class="meta-row"><span class="meta-label">Customer:</span><span class="meta-value">${data.customerName}</span></div>`
        : ''
    }
    ${
      data.customerPhone
        ? `<div class="meta-row"><span class="meta-label">Phone:</span><span class="meta-value">${data.customerPhone}</span></div>`
        : ''
    }
    <div class="meta-row"><span class="meta-label">Terminal:</span><span class="meta-value">${data.terminalName}</span></div>
    <div class="meta-row"><span class="meta-label">Payment:</span><span class="meta-value">${paymentModeLabel(
      data,
    )}</span></div>
  </div>

  <hr class="div">

  <table><tbody>${rows}</tbody></table>

  <hr class="div">

  <table><tbody>${summaryRows}</tbody></table>

  ${returnsSection}

  ${notesBlock}
  ${cancelBlock}

  <hr class="div">

  <div class="footer">
    <div class="footer-no-return">No Return &bull; No Cash Refund</div>
    <div class="footer-thanks">Thank You! Come Again</div>
    <div class="footer-brand">Powered by Karrali POS</div>
  </div>

</div>
${script}
</body>
</html>`;
}

/**
 * Open a print window with the receipt. The user's browser opens the print
 * dialog automatically. Works with thermal, network, and PDF printers.
 */
export async function printReceipt(
  data: ReceiptData,
  options: BuildOptions = {},
): Promise<void> {
  const logoB64 = await imageToBase64(LOGO_URL).catch(() => '');
  const html = buildReceiptHtml(data, logoB64, {
    ...options,
    autoPrint: true,
  });

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const win = window.open(url, '_blank', 'width=380,height=720');
  if (!win) {
    // Popup blocked — fall back to a full-screen iframe
    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:9999;background:#fff;';
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => iframe.remove(), 15000);
  } else {
    win.addEventListener('load', () => URL.revokeObjectURL(url), {
      once: true,
    });
  }
}