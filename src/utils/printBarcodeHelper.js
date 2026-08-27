import { getBarcodeSvgString } from './barcodeGenerator';
import { formatRupiah } from './formatters';

/**
 * Print barcode sticker labels directly in an isolated print document.
 * This guarantees the background web dashboard never leaks into the print preview.
 */
export const printBarcodeLabels = ({
  productName = 'Produk Koperasi',
  barcode = '899123456789',
  price = 0,
  institutionName = 'KOPERASI SD IT PERMATA',
  copies = 4,
}) => {
  const barcodeSvgHtml = getBarcodeSvgString(barcode, 1.6, 38, true);
  const formattedPrice = formatRupiah(price);

  let cardsHtml = '';
  for (let i = 0; i < copies; i++) {
    cardsHtml += `
      <div class="sticker-card">
        <div class="sticker-header">
          <div class="institution">${institutionName}</div>
          <div class="product-title" title="${productName}">${productName}</div>
        </div>
        <div class="barcode-wrapper">
          ${barcodeSvgHtml}
        </div>
        <div class="sticker-footer">
          <div class="price-tag">${formattedPrice}</div>
        </div>
      </div>
    `;
  }

  const printDocumentHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Cetak Label Stiker Barcode - ${productName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #000000;
          padding: 10px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .sticker-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          justify-content: center;
        }
        .sticker-card {
          border: 1.5px dashed #475569;
          border-radius: 8px;
          padding: 8px 6px;
          text-align: center;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          page-break-inside: avoid;
          break-inside: avoid;
          min-height: 110px;
        }
        .sticker-header {
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 3px;
          width: 100%;
        }
        .institution {
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #334155;
        }
        .product-title {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .barcode-wrapper {
          padding: 4px 0;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        .barcode-wrapper svg {
          max-width: 100%;
          height: auto;
          display: block;
        }
        .sticker-footer {
          border-top: 1px solid #cbd5e1;
          padding-top: 3px;
          width: 100%;
        }
        .price-tag {
          font-size: 12px;
          font-weight: 900;
          color: #065f46;
        }
        @media print {
          body {
            padding: 0;
          }
          .sticker-card {
            border: 1px solid #000000;
            border-radius: 4px;
          }
          .price-tag {
            color: #000000;
          }
        }
      </style>
    </head>
    <body>
      <div class="sticker-grid">
        ${cardsHtml}
      </div>
    </body>
    </html>
  `;

  // Create an invisible iframe for completely isolated printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(printDocumentHtml);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch (err) {
      console.error('Print failed:', err);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 250);
};

export default printBarcodeLabels;
