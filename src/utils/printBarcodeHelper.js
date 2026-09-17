import { getBarcodeSvgString } from './barcodeGenerator';

/**
 * Print barcode cards sized for Card Wallet / Laminating Pouch (90mm x 58mm).
 * Layout: Max 4 cards per 1 HVS / A4 paper (2 columns x 2 rows).
 * Content: Minimal & clean — only product name and barcode.
 */
export const printBarcodeLabels = ({
  productName = 'Produk Koperasi',
  barcode = '899123456789',
  copies = 4, // Max 4 per HVS sheet
}) => {
  // Clamp copies to 1..4 (1 HVS sheet max)
  const validCopies = Math.max(1, Math.min(4, copies));

  // Sized larger for card wallet / laminating pouch (90mm x 58mm)
  const barcodeSvgHtml = getBarcodeSvgString(barcode, 2.05, 52, true, 13);

  let cardsHtml = '';
  for (let i = 0; i < validCopies; i++) {
    cardsHtml += `
      <div class="atm-card">
        <div class="product-title" title="${productName}">${productName}</div>
        <div class="barcode-wrapper">
          ${barcodeSvgHtml}
        </div>
      </div>
    `;
  }

  const printDocumentHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Cetak Barcode Dompet Kartu - ${productName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 18mm 10mm;
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
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* 1 HVS / A4 Sheet: 2 Columns x 2 Rows (Max 4 Cards per HVS) */
        .hvs-sheet {
          display: grid;
          grid-template-columns: repeat(2, 90mm);
          grid-template-rows: repeat(2, 58mm);
          gap: 24mm 8mm;
          justify-content: center;
          align-content: center;
          min-height: 250mm;
          box-sizing: border-box;
        }

        /* Card Wallet / Laminating Dimensions (90mm x 58mm) */
        .atm-card {
          width: 90mm;
          height: 58mm;
          max-width: 90mm;
          max-height: 58mm;
          border: 1.5px dashed #000000;
          border-radius: 4px;
          padding: 4.5mm 5mm;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
          page-break-inside: avoid;
          break-inside: avoid;
          position: relative;
          overflow: hidden;
        }

        .product-title {
          font-size: 11.5pt;
          font-weight: 800;
          color: #000000;
          line-height: 1.3;
          margin-bottom: 2.5mm;
          max-width: 96%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .barcode-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .barcode-wrapper svg {
          max-width: 98%;
          height: auto;
          display: block;
        }

        @media print {
          body {
            padding: 0;
          }
          .atm-card {
            border: 1.5px dashed #000000;
          }
          .product-title {
            color: #000000;
          }
        }
      </style>
    </head>
    <body>
      <div class="hvs-sheet">
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
