import type { QuotationDocumentData } from '@/types/quotationDocument';
import { DEFAULT_SHOP_INFO, imageToBase64 } from './printReceipt';
import type { ShopInfo } from '@/types/receipt';

const LOGO_URL = '/logo.jpeg';

const m = (n: number): string => n.toFixed(2);

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Status badge for the printed doc. DRAFT and SENT are internal
 * workflow states — the customer sees a clean professional quote.
 * Terminal states (ACCEPTED, REJECTED, etc.) are shown so accidental
 * reprints of old quotes are obvious.
 */
function statusBadge(status: QuotationDocumentData['status']): string {
  if (status === 'DRAFT' || status === 'SENT') return '';

  const styles: Record<
    string,
    { bg: string; fg: string; label: string }
  > = {
    ACCEPTED: { bg: '#dcfce7', fg: '#15803d', label: 'ACCEPTED' },
    REJECTED: { bg: '#fee2e2', fg: '#b91c1c', label: 'REJECTED' },
    CANCELLED: { bg: '#f3f4f6', fg: '#6b7280', label: 'CANCELLED' },
    CONVERTED: { bg: '#ede9fe', fg: '#6d28d9', label: 'CONVERTED TO INVOICE' },
    EXPIRED: { bg: '#fef3c7', fg: '#b45309', label: 'EXPIRED' },
  };

  const s = styles[status];
  if (!s) return '';
  return `<div class="doc-status" style="background:${s.bg};color:${s.fg};">${s.label}</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface BuildQuotationOptions {
  shop?: ShopInfo;
  /** When true (default), the generated HTML auto-fires window.print(). */
  autoPrint?: boolean;
}

export function buildQuotationHtml(
  data: QuotationDocumentData,
  logoB64: string,
  options: BuildQuotationOptions = {},
): string {
  const shop = options.shop ?? DEFAULT_SHOP_INFO;
  const autoPrint = options.autoPrint ?? true;

  const displayDate = fmtDate(data.date);
  const displayValidUntil = fmtDate(data.validUntil);

  // ── Items rows ─────────────────────────────────────────────
  const itemRows = data.items
    .map((item, idx) => {
      const skuLine = item.sku
        ? `<div class="item-sku">SKU: ${escapeHtml(item.sku)}</div>`
        : '';
      const discountCell =
        item.discountPct > 0
          ? `<span style="color:#16a34a;font-weight:700;">−${m(item.discountPct)}%</span>`
          : '<span style="color:#9ca3af;">—</span>';
      return `
        <tr>
          <td class="num" style="color:#9ca3af;">${idx + 1}</td>
          <td>
            <div class="item-name">${escapeHtml(item.name)}</div>
            ${skuLine}
          </td>
          <td class="num">${item.quantity}</td>
          <td class="num">${m(item.unitPrice)}</td>
          <td class="num">${discountCell}</td>
          <td class="num">${m(item.lineSubtotal)}</td>
          <td class="num total-col">${m(item.lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  // ── Summary ─────────────────────────────────────────────────
  const hasDiscount = data.discountAmount > 0;
  const hasTax = data.taxAmount > 0;

  const summaryRows = `
    <div class="summary-row">
      <span>Subtotal</span>
      <span>LKR ${m(data.subtotal)}</span>
    </div>
    ${
      hasDiscount
        ? `<div class="summary-row" style="color:#16a34a;">
             <span>Discount</span>
             <span>− LKR ${m(data.discountAmount)}</span>
           </div>`
        : ''
    }
    ${
      hasTax
        ? `<div class="summary-row">
             <span>Tax</span>
             <span>LKR ${m(data.taxAmount)}</span>
           </div>`
        : ''
    }
    <div class="summary-row total">
      <span>TOTAL</span>
      <span>LKR ${m(data.total)}</span>
    </div>
  `;

  // ── Notes ───────────────────────────────────────────────────
  const notesBlock = data.notes
    ? `
      <div class="notes">
        <h4>Notes</h4>
        <p style="white-space:pre-wrap;">${escapeHtml(data.notes)}</p>
      </div>
    `
    : '';

  // ── Terms ───────────────────────────────────────────────────
  const termsList = [
    'This is a quotation, not a tax invoice.',
    data.validUntil
      ? `Prices valid until <strong>${displayValidUntil}</strong>.`
      : 'Prices valid for 30 days from issue date.',
    'No goods will be reserved or delivered until the quote is accepted and an invoice is issued.',
    'All prices are in Sri Lankan Rupees (LKR).',
  ]
    .map((t) => `<li>${t}</li>`)
    .join('');

  // ── Header logo ─────────────────────────────────────────────
  const logoTag = logoB64
    ? `<img class="logo" src="${logoB64}" alt="Logo" />`
    : '';

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
<title>Quotation ${escapeHtml(data.code)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  html, body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    color: #111;
    background: #fff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm;
    background: #fff;
    box-sizing: border-box;
  }

  @media screen {
    body { background: #e5e7eb; padding: 20px; }
    .page { margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  }

  @media print {
    @page { size: A4; margin: 0; }
    body { background: #fff; padding: 0; }
    .page { margin: 0; box-shadow: none; }
  }

  /* ── Header ─────────────────────────────────────────────── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 6mm;
    border-bottom: 2px solid #0d9488;
    margin-bottom: 6mm;
    gap: 10mm;
  }

  .header-left {
    display: flex;
    gap: 5mm;
    align-items: flex-start;
  }

  .logo {
    max-width: 22mm;
    max-height: 22mm;
    object-fit: contain;
  }

  .shop-name {
    font-size: 16pt;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #0d9488;
    line-height: 1.2;
  }

  .shop-meta {
    font-size: 8.5pt;
    color: #555;
    line-height: 1.4;
    margin-top: 1mm;
  }

  .header-right {
    text-align: right;
    flex-shrink: 0;
  }

  .doc-title {
    font-size: 20pt;
    font-weight: 900;
    letter-spacing: 4px;
    color: #0d9488;
    line-height: 1;
  }

  .doc-code {
    font-size: 10.5pt;
    font-weight: 700;
    color: #111;
    margin-top: 2mm;
    font-family: 'Courier New', monospace;
  }

  .doc-status {
    display: inline-block;
    margin-top: 3mm;
    padding: 1mm 3mm;
    border-radius: 10mm;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 1px;
  }

  /* ── Customer / Details row ─────────────────────────────── */
  .info-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10mm;
    margin-bottom: 6mm;
  }

  .info-block h3 {
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #9ca3af;
    font-weight: 700;
    margin-bottom: 2mm;
  }

  .info-block p {
    font-size: 10pt;
    line-height: 1.5;
    color: #222;
  }

  .info-block p strong {
    font-weight: 700;
    color: #111;
  }

  .info-block p.subtle {
    font-size: 9pt;
    color: #6b7280;
  }

  /* ── Items table ────────────────────────────────────────── */
  .items {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6mm;
    page-break-inside: auto;
  }

  .items thead {
    display: table-header-group;
  }

  .items thead th {
    background: #f0fdfa;
    color: #0f766e;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2.5mm 2mm;
    text-align: left;
    border-bottom: 2px solid #0d9488;
  }

  .items tbody tr {
    page-break-inside: avoid;
  }

  .items tbody td {
    padding: 2.5mm 2mm;
    border-bottom: 1px solid #e5e7eb;
    font-size: 9.5pt;
    vertical-align: top;
  }

  .items tbody tr:last-child td {
    border-bottom: none;
  }

  .item-name {
    font-weight: 700;
    color: #111;
    line-height: 1.3;
  }

  .item-sku {
    font-size: 7.5pt;
    color: #9ca3af;
    margin-top: 1mm;
  }

  .num {
    text-align: right;
    white-space: nowrap;
  }

  .total-col {
    font-weight: 700;
    color: #111;
  }

  /* ── Summary ────────────────────────────────────────────── */
  .summary {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 6mm;
    page-break-inside: avoid;
  }

  .summary-inner {
    min-width: 70mm;
    border-top: 2px solid #0d9488;
    padding-top: 3mm;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 10pt;
    padding: 1mm 0;
  }

  .summary-row.total {
    border-top: 1px solid #0d9488;
    margin-top: 2mm;
    padding-top: 3mm;
    font-size: 12pt;
    font-weight: 900;
    color: #0d9488;
  }

  /* ── Notes ──────────────────────────────────────────────── */
  .notes {
    background: #f9fafb;
    border-left: 3px solid #0d9488;
    padding: 3mm 4mm;
    margin-bottom: 6mm;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }

  .notes h4 {
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #0f766e;
    margin-bottom: 2mm;
    font-weight: 700;
  }

  /* ── Terms ──────────────────────────────────────────────── */
  .terms {
    border-top: 1px solid #e5e7eb;
    padding-top: 4mm;
    margin-bottom: 6mm;
    font-size: 8.5pt;
    color: #555;
    page-break-inside: avoid;
  }

  .terms h4 {
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #9ca3af;
    margin-bottom: 2mm;
    font-weight: 700;
  }

  .terms ul {
    list-style: none;
    padding-left: 0;
  }

  .terms li {
    padding: 0.5mm 0;
    padding-left: 4mm;
    position: relative;
    line-height: 1.5;
  }

  .terms li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: #0d9488;
    font-weight: 900;
  }

  /* ── Footer ─────────────────────────────────────────────── */
  .footer {
    text-align: center;
    border-top: 2px solid #0d9488;
    padding-top: 4mm;
    font-size: 9pt;
    color: #555;
    page-break-inside: avoid;
  }

  .footer-thanks {
    font-size: 11pt;
    font-weight: 700;
    color: #0d9488;
    margin-bottom: 1.5mm;
  }

  .footer-brand {
    font-size: 7.5pt;
    color: #9ca3af;
    margin-top: 3mm;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-left">
      ${logoTag}
      <div>
        <div class="shop-name">${escapeHtml(shop.name)}</div>
        <div class="shop-meta">
          ${escapeHtml(shop.address)}<br/>
          Tel: ${escapeHtml(shop.phone)}
        </div>
      </div>
    </div>
    <div class="header-right">
      <div class="doc-title">QUOTATION</div>
      <div class="doc-code">${escapeHtml(data.code)}</div>
      ${statusBadge(data.status)}
    </div>
  </div>

  <div class="info-row">
    <div class="info-block">
      <h3>Prepared for</h3>
      ${
        data.customerName
          ? `<p><strong>${escapeHtml(data.customerName)}</strong></p>
             ${
               data.customerCode
                 ? `<p class="subtle">${escapeHtml(data.customerCode)}</p>`
                 : ''
             }
             ${
               data.customerPhone
                 ? `<p class="subtle">${escapeHtml(data.customerPhone)}</p>`
                 : ''
             }`
          : `<p class="subtle">Walk-in customer</p>`
      }
    </div>
    <div class="info-block">
      <h3>Details</h3>
      <p><strong>Date:</strong> ${displayDate}</p>
      ${
        data.validUntil
          ? `<p><strong>Valid until:</strong> ${displayValidUntil}</p>`
          : ''
      }
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th style="width: 4%;">#</th>
        <th style="width: 38%;">Item</th>
        <th class="num" style="width: 8%;">Qty</th>
        <th class="num" style="width: 14%;">Unit price</th>
        <th class="num" style="width: 12%;">Discount</th>
        <th class="num" style="width: 12%;">Subtotal</th>
        <th class="num" style="width: 12%;">Line total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-inner">
      ${summaryRows}
    </div>
  </div>

  ${notesBlock}

  <div class="terms">
    <h4>Terms &amp; conditions</h4>
    <ul>
      ${termsList}
    </ul>
  </div>

  <div class="footer">
    <div class="footer-thanks">Thank you for considering our offer</div>
    <div>We look forward to serving you</div>
    <div class="footer-brand">Powered by Karrali POS</div>
  </div>

</div>
${script}
</body>
</html>`;
}

export async function printQuotation(
  data: QuotationDocumentData,
  options: BuildQuotationOptions = {},
): Promise<void> {
  const logoB64 = await imageToBase64(LOGO_URL).catch(() => '');
  const html = buildQuotationHtml(data, logoB64, {
    ...options,
    autoPrint: true,
  });

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const win = window.open(url, '_blank', 'width=900,height=800');
  if (!win) {
    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:9999;background:#fff;';
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => iframe.remove(), 20000);
  } else {
    win.addEventListener('load', () => URL.revokeObjectURL(url), {
      once: true,
    });
  }
}