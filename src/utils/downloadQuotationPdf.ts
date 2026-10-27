import type { QuotationDocumentData } from '@/types/quotationDocument';
import { buildQuotationHtml } from './printQuotation';
import { imageToBase64 } from './printReceipt';
import type { BuildQuotationOptions } from './printQuotation';

const LOGO_URL = '/logo.jpeg';

/** A4 width at 96dpi (210mm ≈ 794px). */
const IFRAME_WIDTH_PX = 794;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Download the quotation as an A4 PDF. Renders the same HTML as
 * printQuotation via jsPDF + html2canvas. Long quotations automatically
 * paginate across A4 pages.
 */
export async function downloadQuotationPdf(
  data: QuotationDocumentData,
  filename?: string,
  options: BuildQuotationOptions = {},
): Promise<void> {
  const safeFilename =
    (filename ?? `quotation-${data.code}.pdf`)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.pdf$/i, '') + '.pdf';

  // Try to load optional deps. If missing, fall back to print.
  let jsPDF: typeof import('jspdf').jsPDF;
  let html2canvas: typeof import('html2canvas').default;
  try {
    jsPDF = (await import('jspdf')).jsPDF;
    html2canvas = (await import('html2canvas')).default;
  } catch (importErr) {
    console.warn(
      '[downloadQuotationPdf] jspdf/html2canvas not installed — falling back to print.',
      importErr,
    );
    const { printQuotation } = await import('./printQuotation');
    await printQuotation(data, options);
    return;
  }

  // Render off-screen. Note: logo is embedded as base64 in the HTML,
  // so no CORS work is needed at render time.
  const logoB64 = await imageToBase64(LOGO_URL).catch(() => '');
  const html = buildQuotationHtml(data, logoB64, {
    ...options,
    autoPrint: false,
  });

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position:fixed;top:0;left:-10000px;width:${IFRAME_WIDTH_PX}px;height:1200px;border:none;`;
  iframe.srcdoc = html;
  document.body.appendChild(iframe);

  try {
    // Wait for iframe load + a beat for fonts/CSS
    await new Promise<void>((resolve, reject) => {
      iframe.addEventListener('load', () => resolve(), { once: true });
      setTimeout(() => reject(new Error('iframe load timeout')), 5000);
    });
    await new Promise((r) => setTimeout(r, 250));

    const doc = iframe.contentDocument;
    const page = doc?.querySelector('.page') as HTMLElement | null;
    if (!page) {
      throw new Error('Quotation .page element not found in iframe');
    }

    // Get the exact rendered dimensions from the iframe, so the canvas
    // is always wide enough even if `210mm` computes differently per
    // device pixel ratio.
    const renderedWidth = page.offsetWidth;
    const renderedHeight = page.scrollHeight;

    if (renderedWidth === 0 || renderedHeight === 0) {
      throw new Error(
        `Quotation element has zero size (${renderedWidth}x${renderedHeight})`,
      );
    }

    // useCORS removed — all images are inline base64, CORS is not needed
    // and can cause html2canvas to fail on some versions.
    const canvas = await html2canvas(page, {
      scale: 1.5,
      backgroundColor: '#ffffff',
      width: renderedWidth,
      height: renderedHeight,
      windowWidth: renderedWidth,
      windowHeight: renderedHeight,
      logging: false,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error(
        `html2canvas returned empty canvas (${canvas.width}x${canvas.height})`,
      );
    }

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    });

    // Slice the rendered canvas into A4-sized chunks.
    const pageHeightPx =
      (canvas.width * A4_HEIGHT_MM) / A4_WIDTH_MM;
    const totalPages = Math.max(
      1,
      Math.ceil(canvas.height / pageHeightPx),
    );

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      const sourceY = i * pageHeightPx;
      const sliceHeightPx = Math.min(
        pageHeightPx,
        canvas.height - sourceY,
      );

      if (sliceHeightPx <= 0) continue;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.ceil(sliceHeightPx);

      const ctx = sliceCanvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2d context unavailable');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        Math.ceil(sliceHeightPx),
      );

      const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
      const sliceHeightMm = Math.min(
        A4_HEIGHT_MM,
        (Math.ceil(sliceHeightPx) * A4_WIDTH_MM) / canvas.width,
      );

      pdf.addImage(
        sliceData,
        'JPEG',
        0,
        0,
        A4_WIDTH_MM,
        sliceHeightMm,
        undefined,
        'FAST',
      );
    }

    pdf.save(safeFilename);
  } catch (err) {
    console.error('[downloadQuotationPdf] failed:', err);
    // Fall back to print so the user isn't blocked.
    const { printQuotation } = await import('./printQuotation');
    await printQuotation(data, options);
    throw err;
  } finally {
    // Guard against the iframe having already been detached.
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}