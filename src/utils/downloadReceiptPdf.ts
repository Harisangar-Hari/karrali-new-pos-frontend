import type { ReceiptData } from '@/types/receipt';
import {
  buildReceiptHtml,
  imageToBase64,
  printReceipt,
  type BuildOptions,
} from './printReceipt';

const LOGO_URL = '/logo.jpeg';

/**
 * Download the receipt as a PDF file. Uses jsPDF + html2canvas to render the
 * same HTML as `printReceipt` into a pixel-perfect PDF at 72mm width.
 *
 * If the optional deps aren't installed, falls back to opening the print
 * dialog — the user can pick "Save as PDF" as the destination.
 */
export async function downloadReceiptPdf(
  data: ReceiptData,
  filename?: string,
  options: BuildOptions = {},
): Promise<void> {
  const safeFilename = (filename ?? `invoice-${data.invoiceNumber}.pdf`)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.pdf$/i, '') + '.pdf';

  // Try to load the optional deps. If they're missing, fall back.
  let jsPDF: typeof import('jspdf').jsPDF;
  let html2canvas: typeof import('html2canvas').default;
  try {
    jsPDF = (await import('jspdf')).jsPDF;
    html2canvas = (await import('html2canvas')).default;
  } catch {
    console.warn(
      '[downloadReceiptPdf] jspdf/html2canvas not installed — falling back to print dialog. Run `npm install jspdf html2canvas` for one-click downloads.',
    );
    await printReceipt(data, options);
    return;
  }

  const logoB64 = await imageToBase64(LOGO_URL).catch(() => '');
  const html = buildReceiptHtml(data, logoB64, {
    ...options,
    autoPrint: false,
  });

   const IFRAME_WIDTH_PX = 303;
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position:fixed;top:-10000px;left:-10000px;width:${IFRAME_WIDTH_PX}px;height:2000px;border:none;`;
  iframe.srcdoc = html;
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.addEventListener('load', () => resolve(), { once: true });
      // Defensive: if load never fires, reject after 5s
      setTimeout(() => reject(new Error('iframe load timeout')), 5000);
    });

    // Small delay to let fonts and layout settle
    await new Promise((r) => setTimeout(r, 120));

    const doc = iframe.contentDocument;
    const page = doc?.querySelector('.page') as HTMLElement | null;
    if (!page) throw new Error('Receipt page element not found');

    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: IFRAME_WIDTH_PX,
      height: page.scrollHeight,
      windowWidth: IFRAME_WIDTH_PX,
      windowHeight: page.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');

    // Convert canvas dimensions to millimetres using 72mm width.
    const imgWidthMm = 80;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

    const pdf = new jsPDF({
      unit: 'mm',
      format: [imgWidthMm, imgHeightMm],
      orientation: 'portrait',
    });

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
    pdf.save(safeFilename);
  } catch (err) {
    console.error('[downloadReceiptPdf] failed:', err);
    // Fallback: open print dialog
    await printReceipt(data, options);
    throw err;
  } finally {
    document.body.removeChild(iframe);
  }
}