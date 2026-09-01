import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah, formatTanggal, formatTanggalShort } from './formatters';

let cachedLogoDataUrl = null;

if (typeof window !== 'undefined') {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      cachedLogoDataUrl = canvas.toDataURL('image/png');
    } catch {
      cachedLogoDataUrl = img;
    }
  };
  img.src = '/logo.png';
}

export const loadLogoImage = async () => {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        cachedLogoDataUrl = canvas.toDataURL('image/png');
        resolve(cachedLogoDataUrl);
      } catch {
        cachedLogoDataUrl = img;
        resolve(img);
      }
    };
    img.onerror = () => resolve(null);
    img.src = '/logo.png';
  });
};

export const flattenTransactionsToItems = (transactions = []) => {
  const rows = [];
  (transactions || []).forEach((t) => {
    const items = t.items || [];
    if (items.length === 0) {
      rows.push({
        invoiceNumber: t.invoiceNumber,
        createdAt: t.createdAt,
        productName: '-',
        quantity: 1,
        unit: 'pcs',
        price: Number(t.grandTotal || 0),
        subtotal: Number(t.grandTotal || 0),
        paymentMethod: t.paymentMethod || 'CASH',
        cashierName: t.cashierName || 'Kasir',
      });
    } else {
      items.forEach((it) => {
        const qty = Number(it.quantity || 1);
        const price = Number(it.sellPrice ?? it.price ?? 0);
        const subtotal = Number(it.subtotal ?? qty * price);
        rows.push({
          invoiceNumber: t.invoiceNumber,
          createdAt: t.createdAt,
          productName: it.name || it.productName || 'Barang',
          quantity: qty,
          unit: it.unit || 'pcs',
          price,
          subtotal,
          paymentMethod: t.paymentMethod || 'CASH',
          cashierName: t.cashierName || 'Kasir',
        });
      });
    }
  });
  return rows;
};

export const aggregateMonthlyDailySales = (transactions = []) => {
  const dateMap = {};

  (transactions || []).forEach((t) => {
    const dateKey = t.createdAt ? t.createdAt.slice(0, 10) : 'Lainnya';
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = {
        dateKey,
        date: t.createdAt,
        transactionCount: 0,
        totalQty: 0,
        totalRevenue: 0,
        paymentMethods: {},
        cashiers: new Set(),
      };
    }

    dateMap[dateKey].transactionCount += 1;
    dateMap[dateKey].totalRevenue += Number(t.grandTotal || 0);

    const pm = t.paymentMethod || 'CASH';
    dateMap[dateKey].paymentMethods[pm] =
      (dateMap[dateKey].paymentMethods[pm] || 0) + 1;

    if (t.cashierName) {
      dateMap[dateKey].cashiers.add(t.cashierName);
    }

    const items = t.items || [];
    if (items.length === 0) {
      dateMap[dateKey].totalQty += 1;
    } else {
      items.forEach((it) => {
        dateMap[dateKey].totalQty += Number(it.quantity || 1);
      });
    }
  });

  const sortedDates = Object.keys(dateMap).sort();

  return sortedDates.map((k) => {
    const entry = dateMap[k];
    let topPm = 'CASH';
    let maxCount = 0;
    Object.entries(entry.paymentMethods).forEach(([m, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topPm = m;
      }
    });

    return {
      dateKey: entry.dateKey,
      date: entry.date,
      transactionCount: entry.transactionCount,
      totalQty: entry.totalQty,
      topPaymentMethod: topPm,
      cashiers: Array.from(entry.cashiers).join(', ') || 'Kasir',
      totalRevenue: entry.totalRevenue,
    };
  });
};

export const generateReportPdfDoc = (
  reportData,
  coopProfile = {},
  periodLabel = '',
  reportType = 'MONTHLY',
  logoImage = null
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const isDaily = reportType === 'DAILY';

  const marginLeft = 15;
  const marginRight = 15;
  const marginTop = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const logoX = marginLeft;
  const logoY = marginTop;
  const logoSize = 22;
  const logoToUse = logoImage || cachedLogoDataUrl || '/logo.png';

  try {
    doc.addImage(
      logoToUse,
      'PNG',
      logoX,
      logoY,
      logoSize,
      logoSize,
      undefined,
      'FAST'
    );
  } catch (err) {
    console.warn('Failed to render logo to PDF:', err);
  }

  const textCenterX = (logoX + logoSize + (pageWidth - marginRight)) / 2;

  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    'SEKOLAH DASAR ISLAM TERPADU (SD IT) PERMATA KITA',
    textCenterX,
    marginTop + 1.0,
    { align: 'center' }
  );

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'FULL DAY SCHOOL - CENTRE OF ISLAMIC EDUCATION SERVICE',
    textCenterX,
    marginTop + 5.2,
    { align: 'center' }
  );

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(
    coopProfile.name || 'KOPERASI UNIT SEKOLAH "PERMATA KITA"',
    textCenterX,
    marginTop + 10.5,
    { align: 'center' }
  );

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `${coopProfile.address || 'Jl SMP 21 Padang'}, ${coopProfile.city || 'Kota Padang'}`,
    textCenterX,
    marginTop + 15.0,
    { align: 'center' }
  );

  const phoneText =
    coopProfile.phone && coopProfile.phone !== '-' && coopProfile.phone !== 'null'
      ? `Telepon / Faks. ${coopProfile.phone}`
      : '';
  const webText =
    coopProfile.website && coopProfile.website !== '-' && coopProfile.website !== 'null'
      ? `Laman: ${coopProfile.website}`
      : '';
  const emailText =
    coopProfile.email && coopProfile.email !== '-' && coopProfile.email !== 'null'
      ? `Surel: ${coopProfile.email}`
      : '';

  const contactParts = [phoneText, webText, emailText].filter(Boolean);
  if (contactParts.length > 0) {
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(contactParts.join(' | '), textCenterX, marginTop + 19.2, {
      align: 'center',
    });
  }

  const lineY = marginTop + 22.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);
  doc.line(marginLeft, lineY, pageWidth - marginRight, lineY);
  doc.setLineWidth(0.2);
  doc.line(marginLeft, lineY + 0.8, pageWidth - marginRight, lineY + 0.8);

  const titleY = lineY + 7.5;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isDaily
      ? 'LAPORAN PENJUALAN & TRANSAKSI HARIAN'
      : 'LAPORAN REKAPITULASI PENJUALAN & KEUANGAN BULANAN',
    pageWidth / 2,
    titleY,
    { align: 'center' }
  );

  const titleWidth = isDaily ? 100 : 135;
  doc.setLineWidth(0.2);
  doc.line((pageWidth - titleWidth) / 2, titleY + 1.2, (pageWidth + titleWidth) / 2, titleY + 1.2);

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${isDaily ? 'Hari / Tanggal' : 'Bulan / Periode'}: ${periodLabel}   |   Dicetak: ${formatTanggal(new Date(), true)}`,
    pageWidth / 2,
    titleY + 5.5,
    { align: 'center' }
  );

  let currentY = titleY + 9.5;

  if (isDaily) {
    const itemRows = flattenTransactionsToItems(reportData.transactions || []);
    const totalRevenue =
      reportData.summary?.totalRevenue ||
      itemRows.reduce((sum, r) => sum + (r.subtotal || 0), 0);

    const tableBody = itemRows.map((r, idx) => [
      idx + 1,
      r.invoiceNumber,
      formatTanggalShort(r.createdAt, true),
      r.productName,
      `${r.quantity} ${r.unit || 'pcs'}`,
      (r.paymentMethod || 'CASH').toUpperCase(),
      r.cashierName || 'Kasir',
      formatRupiah(r.subtotal),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginLeft, right: marginRight },
      head: [
        [
          'NO',
          'No. Faktur',
          'Waktu',
          'Rincian Barang',
          'QTY',
          'Metode',
          'Kasir',
          'Subtotal',
        ],
      ],
      body:
        tableBody.length > 0
          ? tableBody
          : [
              [
                {
                  content: `Belum ada data barang terjual pada periode ${periodLabel}.`,
                  colSpan: 8,
                  styles: {
                    halign: 'center',
                    fontStyle: 'italic',
                    textColor: [100, 100, 100],
                    cellPadding: 6,
                  },
                },
              ],
            ],
      showHead: 'everyPage',
      showFoot: 'lastPage',
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8.5,
        cellPadding: 2.2,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        textColor: [0, 0, 0],
        valign: 'middle',
        fillColor: false,
      },
      headStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', fontStyle: 'bold', cellWidth: 32 },
        2: { halign: 'center', cellWidth: 26 },
        3: { halign: 'left', fontStyle: 'bold' },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'left', cellWidth: 20 },
        7: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
      },
      foot: [
        [
          {
            content: 'TOTAL:',
            colSpan: 7,
            styles: { halign: 'right', fontStyle: 'bold' },
          },
          {
            content: formatRupiah(totalRevenue),
            styles: { halign: 'right', fontStyle: 'bold' },
          },
        ],
      ],
      footStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
      },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  } else {
    const dailyRecapRows = aggregateMonthlyDailySales(reportData.transactions || []);
    const totalRevenue =
      reportData.summary?.totalRevenue ||
      dailyRecapRows.reduce((sum, r) => sum + r.totalRevenue, 0);

    const tableBody = dailyRecapRows.map((r, idx) => [
      idx + 1,
      formatTanggal(r.date),
      `${r.transactionCount} Transaksi`,
      `${r.totalQty} pcs`,
      r.topPaymentMethod.toUpperCase(),
      r.cashiers,
      formatRupiah(r.totalRevenue),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginLeft, right: marginRight },
      head: [
        [
          'NO',
          'Tanggal Penjualan',
          'Jml Transaksi',
          'Total Barang',
          'Metode',
          'Petugas Kasir',
          'Total Omset (Rp)',
        ],
      ],
      body:
        tableBody.length > 0
          ? tableBody
          : [
              [
                {
                  content: `Belum ada transaksi penjualan pada bulan ${periodLabel}.`,
                  colSpan: 7,
                  styles: {
                    halign: 'center',
                    fontStyle: 'italic',
                    textColor: [100, 100, 100],
                    cellPadding: 6,
                  },
                },
              ],
            ],
      showHead: 'everyPage',
      showFoot: 'lastPage',
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8.5,
        cellPadding: 2.2,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        textColor: [0, 0, 0],
        valign: 'middle',
        fillColor: false,
      },
      headStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', fontStyle: 'bold', cellWidth: 42 },
        2: { halign: 'center', cellWidth: 26 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'left' },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 32 },
      },
      foot: [
        [
          {
            content: 'TOTAL:',
            colSpan: 6,
            styles: { halign: 'right', fontStyle: 'bold' },
          },
          {
            content: formatRupiah(totalRevenue),
            styles: { halign: 'right', fontStyle: 'bold' },
          },
        ],
      ],
      footStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
      },
    });

    currentY = doc.lastAutoTable.finalY + 6;

    if (currentY > 218) {
      doc.addPage();
      currentY = marginTop;
    }

    const summary = reportData.summary || {};
    const totalCost = Number(summary.totalCost || 0);
    const netProfit = Number(summary.netProfit || totalRevenue - totalCost);
    const margin =
      summary.profitMargin ||
      (totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0');

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginLeft, right: marginRight },
      head: [
        [
          {
            content: 'RINGKASAN PENDAPATAN & KEUNTUNGAN KOPERASI',
            colSpan: 4,
            styles: { halign: 'center', fontStyle: 'bold' },
          },
        ],
      ],
      body: [
        [
          'Total Pendapatan (Penjualan)',
          formatRupiah(totalRevenue),
          'Total Modal Barang (Harga Beli)',
          formatRupiah(totalCost),
        ],
        [
          'Total Keuntungan Bersih',
          formatRupiah(netProfit),
          'Persentase Keuntungan',
          `${margin}%`,
        ],
      ],
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8.5,
        cellPadding: 2.2,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        textColor: [0, 0, 0],
        valign: 'middle',
        fillColor: false,
      },
      headStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 48 },
        1: { halign: 'right', fontStyle: 'bold', cellWidth: 42 },
        2: { fontStyle: 'bold', cellWidth: 48 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 42 },
      },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  let signatureY = currentY + 6;
  const numPagesBeforeSig = doc.internal.getNumberOfPages();

  if (currentY > 216) {
    doc.addPage();
    signatureY = marginTop + 14;
  } else if (numPagesBeforeSig === 1 && signatureY < 206) {
    signatureY = 206;
  }

  const tTitle =
    coopProfile.treasurerTitle && coopProfile.treasurerTitle !== 'null'
      ? coopProfile.treasurerTitle
      : 'Bendahara Koperasi';
  const tName =
    coopProfile.treasurerName &&
    coopProfile.treasurerName !== 'null' &&
    coopProfile.treasurerName !== '-'
      ? coopProfile.treasurerName
      : 'Tidak Diketahui';
  const tNip =
    coopProfile.treasurerNip &&
    coopProfile.treasurerNip !== 'null' &&
    coopProfile.treasurerNip !== '-'
      ? coopProfile.treasurerNip
      : '-';

  const hTitle =
    coopProfile.headTitle && coopProfile.headTitle !== 'null'
      ? coopProfile.headTitle
      : 'Kepala Pengelola Koperasi';
  const hName =
    coopProfile.headName &&
    coopProfile.headName !== 'null' &&
    coopProfile.headName !== '-'
      ? coopProfile.headName
      : 'Tidak Diketahui';
  const hNip =
    coopProfile.headNip &&
    coopProfile.headNip !== 'null' &&
    coopProfile.headNip !== '-'
      ? coopProfile.headNip
      : '-';

  const pTitle =
    coopProfile.principalTitle && coopProfile.principalTitle !== 'null'
      ? coopProfile.principalTitle
      : 'Kepala Sekolah SD IT Permata';
  const pName =
    coopProfile.principalName &&
    coopProfile.principalName !== 'null' &&
    coopProfile.principalName !== '-'
      ? coopProfile.principalName
      : 'Tidak Diketahui';
  const pNip =
    coopProfile.principalNip &&
    coopProfile.principalNip !== 'null' &&
    coopProfile.principalNip !== '-'
      ? coopProfile.principalNip
      : '-';

  const leftColCenter = marginLeft + (contentWidth * 0.25);
  const rightColCenter = marginLeft + (contentWidth * 0.75);
  const centerCol = pageWidth / 2;

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Mengetahui / Menyetujui,', leftColCenter, signatureY, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text(tTitle, leftColCenter, signatureY + 4.5, { align: 'center' });
  doc.text(`( ${tName} )`, leftColCenter, signatureY + 23, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP: ${tNip}`, leftColCenter, signatureY + 27, { align: 'center' });

  doc.setFontSize(9);
  doc.text(
    `${coopProfile.city && coopProfile.city !== 'null' ? coopProfile.city : 'Kota Padang'}, ${formatTanggal(new Date())}`,
    rightColCenter,
    signatureY,
    { align: 'center' }
  );
  doc.setFont('times', 'bold');
  doc.text(hTitle, rightColCenter, signatureY + 4.5, { align: 'center' });
  doc.text(`( ${hName} )`, rightColCenter, signatureY + 23, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP: ${hNip}`, rightColCenter, signatureY + 27, { align: 'center' });

  const principalY = signatureY + 34;
  doc.setFontSize(9);
  doc.text('Mengetahui / Penanggung Jawab Lembaga,', centerCol, principalY, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text(pTitle, centerCol, principalY + 4.5, { align: 'center' });
  doc.text(`( ${pName} )`, centerCol, principalY + 23, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP: ${pNip}`, centerCol, principalY + 27, { align: 'center' });

  const totalDocPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalDocPages; i++) {
    doc.setPage(i);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Halaman ${i} dari ${totalDocPages}`,
      pageWidth - marginRight,
      297 - 8,
      { align: 'right' }
    );
    doc.text(
      `Koperasi Unit SD IT Permata Kita • Dokumen Resmi`,
      marginLeft,
      297 - 8,
      { align: 'left' }
    );
  }

  return doc;
};

export const generateMonthlyReportPdfDoc = (reportData, coopProfile, periodLabel, logoImage = null) => {
  return generateReportPdfDoc(reportData, coopProfile, periodLabel, 'MONTHLY', logoImage);
};

export const getReportPdfBlobUrl = async (reportData, coopProfile, periodLabel, reportType = 'MONTHLY') => {
  const logoImage = await loadLogoImage();
  const doc = generateReportPdfDoc(reportData, coopProfile, periodLabel, reportType, logoImage);
  return URL.createObjectURL(doc.output('blob'));
};

export const getMonthlyReportPdfBlobUrl = (reportData, coopProfile, periodLabel) => {
  return getReportPdfBlobUrl(reportData, coopProfile, periodLabel, 'MONTHLY');
};

export const exportReportToPdf = async (reportData, coopProfile, periodLabel, reportType = 'MONTHLY') => {
  const logoImage = await loadLogoImage();
  const doc = generateReportPdfDoc(reportData, coopProfile, periodLabel, reportType, logoImage);
  const prefix = reportType === 'DAILY' ? 'Laporan_Harian' : 'Laporan_Bulanan';
  const filename = `${prefix}_Koperasi_Permata_${periodLabel.replace(/[\s,/]+/g, '_')}.pdf`;
  doc.save(filename);
};

export const exportMonthlyReportToPdf = (reportData, coopProfile, periodLabel) => {
  return exportReportToPdf(reportData, coopProfile, periodLabel, 'MONTHLY');
};

export const exportDailyReportToPdf = (reportData, coopProfile, periodLabel) => {
  return exportReportToPdf(reportData, coopProfile, periodLabel, 'DAILY');
};
