import { formatRupiah } from './formatters';

const formatReceiptDate = (dateVal) => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const printThermalReceipt = (transaction, coopProfile = {}, paperWidthMm = 58) => {
  if (!transaction) return;

  const headerTitle = coopProfile.receiptHeaderTitle || coopProfile.name || 'KOPERASI PERMATA KITA';
  const headerSubtitle = coopProfile.receiptHeaderSubtitle || coopProfile.institution || 'Full Day School • Koperasi';
  const headerAddress = coopProfile.receiptHeaderAddress || coopProfile.address || 'Jl. SMP 21 Padang';
  const headerPhone = coopProfile.receiptHeaderPhone || coopProfile.phone || '';
  const footerMessage = coopProfile.receiptFooter || '*** TERIMA KASIH ***';
  const footerPolicy = coopProfile.receiptPolicy || '';

  const items = transaction.items || [];

  let itemsHtml = '';
  items.forEach((item) => {
    itemsHtml += `
      <div class="item-block">
        <div class="item-name">${item.name}</div>
        <div class="item-calc">
          <span>${item.quantity} x ${formatRupiah(item.sellPrice)}</span>
          <span class="bold">${formatRupiah(item.subtotal)}</span>
        </div>
      </div>
    `;
  });

  const grandTotal = Number(transaction.grandTotal || transaction.total || 0);
  const rawSubtotal = Number(
    transaction.subtotal ||
      items.reduce(
        (sum, i) =>
          sum +
          (Number(i.sellPrice || i.price) || 0) * (Number(i.quantity || i.qty) || 1),
        0
      ) ||
      grandTotal
  );
  let discountTotal = Number(transaction.discount || transaction.discountTotal || 0);
  if (discountTotal <= 0 && rawSubtotal > grandTotal) {
    discountTotal = rawSubtotal - grandTotal;
  }
  const subtotal = rawSubtotal > grandTotal ? rawSubtotal : grandTotal + discountTotal;
  const cashPaid = Number(transaction.cashPaid || transaction.paid || grandTotal);
  const change = Number(transaction.change || (cashPaid > grandTotal ? cashPaid - grandTotal : 0));

  const receiptHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Struk_${transaction.invoiceNumber}</title>
      <style>
        @page {
          size: auto;
          margin: 0mm !important;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body {
          width: ${paperWidthMm === 58 ? '48mm' : '72mm'};
          max-width: 100%;
          margin: 0 auto;
          padding: 3mm 1mm 3mm 1mm;
          font-family: 'Consolas', 'Lucida Console', 'Courier New', monospace;
          background: #ffffff !important;
          color: #000000 !important;
          font-size: 10.5px;
          line-height: 1.3;
          font-weight: 700;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          @page {
            margin: 0mm !important;
          }
          html, body {
            width: ${paperWidthMm === 58 ? '48mm' : '72mm'} !important;
            margin: 0 auto !important;
            padding: 2mm 1mm 2mm 1mm !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .receipt-wrap {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
        .receipt-wrap {
          width: 100%;
        }
        .center {
          text-align: center;
        }
        .bold {
          font-weight: 900 !important;
        }
        .header {
          text-align: center;
          margin-bottom: 4px;
        }
        .header .h-title {
          font-size: 12.5px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          line-height: 1.25;
          margin-bottom: 1.5px;
        }
        .header .h-sub {
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 1px;
        }
        .header .h-info {
          font-size: 9px;
          font-weight: 600;
          line-height: 1.2;
          color: #333333;
        }
        .hr-solid {
          border-top: 1px solid #000000;
          margin: 3.5px 0;
        }
        .hr-dash {
          border-top: 1px dashed #000000;
          margin: 3px 0;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          line-height: 1.25;
          margin-bottom: 1px;
        }
        .meta-row .meta-label {
          font-weight: 600;
        }
        .meta-row .meta-val {
          font-weight: 800;
        }
        .items-list {
          margin: 3px 0;
        }
        .item-block {
          margin-bottom: 3.5px;
          line-height: 1.2;
        }
        .item-name {
          font-size: 10px;
          font-weight: 800;
          word-break: break-word;
        }
        .item-calc {
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          font-weight: 700;
          padding-left: 4px;
        }
        .summary-area {
          margin: 3px 0;
        }
        .sum-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          line-height: 1.3;
          margin-bottom: 1px;
        }
        .total-box {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          font-weight: 900;
          padding: 3.5px 0;
          border-top: 1.5px dashed #000000;
          border-bottom: 1.5px dashed #000000;
          margin: 3.5px 0;
        }
        .footer {
          text-align: center;
          margin-top: 6px;
          padding-top: 2px;
        }
        .footer .f-main {
          font-size: 11.5px;
          font-weight: 900;
          letter-spacing: 0.5px;
          margin-bottom: 1.5px;
        }
        .footer .f-policy {
          font-size: 9px;
          font-weight: 600;
          line-height: 1.25;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-wrap">
        <!-- Header Dinamis dari Pengaturan Admin -->
        <div class="header">
          <div class="h-title">${headerTitle}</div>
          <div class="h-sub">${headerSubtitle}</div>
          <div class="h-info">${headerAddress}</div>
          ${headerPhone ? `<div class="h-info">Telp: ${headerPhone}</div>` : ''}
        </div>

        <div class="hr-solid"></div>

        <!-- Meta Transaksi -->
        <div class="meta-row">
          <span class="meta-label">No. Faktur :</span>
          <span class="meta-val">${transaction.invoiceNumber}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Tanggal    :</span>
          <span class="meta-val">${formatReceiptDate(transaction.createdAt)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Kasir      :</span>
          <span class="meta-val">${transaction.cashierName || 'Kasir'}</span>
        </div>

        <div class="hr-dash"></div>

        <!-- Rincian Barang -->
        <div class="items-list">
          ${itemsHtml}
        </div>

        <div class="hr-dash"></div>

        <div class="summary-area">
          <div class="sum-row">
            <span>Subtotal</span>
            <span>${formatRupiah(subtotal)}</span>
          </div>
          ${
            discountTotal > 0
              ? `
            <div class="sum-row">
              <span>Diskon</span>
              <span>-${formatRupiah(discountTotal)}</span>
            </div>
          `
              : ''
          }
          <div class="total-box">
            <span>TOTAL</span>
            <span>${formatRupiah(grandTotal)}</span>
          </div>
          <div class="sum-row" style="margin-top: 2.5px;">
            <span>Bayar (${transaction.paymentMethod})</span>
            <span>${formatRupiah(cashPaid)}</span>
          </div>
          <div class="sum-row">
            <span>Kembalian</span>
            <span class="bold">${formatRupiah(change)}</span>
          </div>
        </div>

        <div class="hr-solid"></div>

        <div class="footer">
          <div class="f-main">${footerMessage}</div>
          ${footerPolicy ? `<div class="f-policy">${footerPolicy}</div>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  let printIframe = document.getElementById('thermal-receipt-print-iframe');
  if (printIframe) {
    document.body.removeChild(printIframe);
  }

  printIframe = document.createElement('iframe');
  printIframe.id = 'thermal-receipt-print-iframe';
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  printIframe.style.visibility = 'hidden';

  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow.document;
  doc.open();
  doc.write(receiptHtml);
  doc.close();

  // Trigger print after iframe renders
  printIframe.contentWindow.focus();
  setTimeout(() => {
    try {
      printIframe.contentWindow.print();
    } catch (err) {
      console.error('Error invoking print dialog:', err);
    }
  }, 250);
};

export default printThermalReceipt;
