import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah, formatTanggal, formatTanggalShort } from './formatters';
import { drawOfficialPermataLogo } from '../assets/logoPermata';

export const generateMonthlyReportPdfDoc = (reportData, coopProfile, periodLabel) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoX = 14;
  const logoY = 13.0;
  const logoSize = 23;

  drawOfficialPermataLogo(doc, logoX, logoY, logoSize);

  const textCenterX = (logoX + logoSize + pageWidth - 14) / 2;

  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    'SEKOLAH DASAR ISLAM TERPADU (SD IT) PERMATA KITA',
    textCenterX,
    13.5,
    { align: 'center' }
  );

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'FULL DAY SCHOOL - CENTRE OF ISLAMIC EDUCATION SERVICE',
    textCenterX,
    17.8,
    { align: 'center' }
  );

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(
    coopProfile.name || 'KOPERASI UNIT SEKOLAH "PERMATA KITA"',
    textCenterX,
    23.0,
    { align: 'center' }
  );

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `${coopProfile.address || 'Jl. Permata Madani No. 45, Kompleks Islamic Centre'}, ${coopProfile.city || 'Bandar Lampung'}`,
    textCenterX,
    27.5,
    { align: 'center' }
  );

  doc.text(
    `Telepon / Faks. ${coopProfile.phone || '(0721) 789123 / 0812-3456-7890'}`,
    textCenterX,
    31.5,
    { align: 'center' }
  );

  doc.setFontSize(8);
  doc.text(
    `Laman : ${coopProfile.website || 'https://www.permatakita.sch.id'}     Surel : ${coopProfile.email || 'koperasi@permatakita.sch.id'}`,
    textCenterX,
    35.5,
    { align: 'center' }
  );

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(14, 38.5, pageWidth - 14, 38.5);
  doc.setLineWidth(0.2);
  doc.line(14, 39.7, pageWidth - 14, 39.7);

  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(0, 0, 0);
  doc.text('LAPORAN KEUANGAN & REKAP PENJUALAN BULANAN', pageWidth / 2, 46.5, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(`Periode: ${periodLabel}  |  Dicetak: ${formatTanggal(new Date(), true)}`, pageWidth / 2, 51.0, {
    align: 'center',
  });

  const tableBody = (reportData.transactions || []).map((t, idx) => {
    const itemsList = t.items || [];
    const itemSummary =
      itemsList.length === 0
        ? '-'
        : itemsList.length <= 2
        ? itemsList.map((it) => `${it.name} (${it.quantity})`).join(', ')
        : `${itemsList.slice(0, 2).map((it) => `${it.name} (${it.quantity})`).join(', ')} +${itemsList.length - 2}`;

    return [
      idx + 1,
      t.invoiceNumber,
      formatTanggalShort(t.createdAt, true),
      itemSummary,
      t.paymentMethod || 'CASH',
      t.cashierName || '-',
      formatRupiah(t.grandTotal),
    ];
  });

  const totalTrxLabel = `TOTAL (${reportData.summary.totalTransactions} Transaksi):`;

  autoTable(doc, {
    startY: 55.0,
    margin: { left: 14, right: 14 },
    head: [['No', 'No. Faktur', 'Waktu', 'Rincian Barang', 'Metode', 'Kasir', 'Total Penjualan']],
    body:
      tableBody.length > 0
        ? tableBody
        : [
            [
              {
                content: `Belum ada data transaksi penjualan pada periode ${periodLabel}.`,
                colSpan: 7,
                styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 100, 100], cellPadding: 4 },
              },
            ],
          ],
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 8,
      cellPadding: 2.0,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fillColor: false,
      fontStyle: 'normal',
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: false,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 26 },
      3: { cellWidth: 54 },
      4: { halign: 'center', cellWidth: 16 },
      5: { cellWidth: 22 },
      6: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
    },
    foot: [
      [
        {
          content: totalTrxLabel,
          colSpan: 6,
          styles: { halign: 'right', fontStyle: 'bold' },
        },
        formatRupiah(reportData.summary.totalRevenue),
      ],
    ],
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'right',
    },
  });

  let signatureY = 230;

  if (doc.lastAutoTable.finalY > 215) {
    doc.addPage();
    signatureY = 30;
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const tTitle = coopProfile.treasurerTitle && coopProfile.treasurerTitle !== 'null' ? coopProfile.treasurerTitle : 'Bendahara Koperasi';
  const tName = coopProfile.treasurerName && coopProfile.treasurerName !== 'null' && coopProfile.treasurerName !== '-' ? coopProfile.treasurerName : 'Ustadz Ahmad Fauzi, S.E';
  const tNip = coopProfile.treasurerNip && coopProfile.treasurerNip !== 'null' && coopProfile.treasurerNip !== '-' ? coopProfile.treasurerNip : '-';

  const hTitle = coopProfile.headTitle && coopProfile.headTitle !== 'null' ? coopProfile.headTitle : 'Kepala Pengelola Koperasi';
  const hName = coopProfile.headName && coopProfile.headName !== 'null' && coopProfile.headName !== '-' ? coopProfile.headName : 'Ustadzah Fatimah, S.Pd';
  const hNip = coopProfile.headNip && coopProfile.headNip !== 'null' && coopProfile.headNip !== '-' ? coopProfile.headNip : '-';

  const pTitle = coopProfile.principalTitle && coopProfile.principalTitle !== 'null' ? coopProfile.principalTitle : 'Kepala Sekolah SD IT Permata';
  const pName = coopProfile.principalName && coopProfile.principalName !== 'null' && coopProfile.principalName !== '-' ? coopProfile.principalName : 'Ustadz Muhammad Irfan, M.Pd';
  const pNip = coopProfile.principalNip && coopProfile.principalNip !== 'null' && coopProfile.principalNip !== '-' ? coopProfile.principalNip : '19790105 200501 1 003';

  doc.text('Mengetahui / Menyetujui,', 25, signatureY);
  doc.text(tTitle, 25, signatureY + 4.5);
  doc.setFont('times', 'bold');
  doc.text('( ' + tName + ' )', 25, signatureY + 22);
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP: ${tNip}`, 25, signatureY + 26);

  doc.setFontSize(9);
  doc.text(`${coopProfile.city && coopProfile.city !== 'null' ? coopProfile.city : 'Kota Padang'}, ${formatTanggal(new Date())}`, pageWidth - 75, signatureY);
  doc.text(hTitle, pageWidth - 75, signatureY + 4.5);
  doc.setFont('times', 'bold');
  doc.text('( ' + hName + ' )', pageWidth - 75, signatureY + 22);
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP: ${hNip}`, pageWidth - 75, signatureY + 26);

  const centerX = pageWidth / 2;
  const principalY = signatureY + 32;

  doc.setFontSize(9);
  doc.text('Mengetahui / Penanggung Jawab Lembaga,', centerX, principalY, { align: 'center' });
  doc.text(pTitle, centerX, principalY + 4.5, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text('( ' + pName + ' )', centerX, principalY + 22, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP: ${pNip}`, centerX, principalY + 26, { align: 'center' });

  return doc;
};

export const getMonthlyReportPdfBlobUrl = (reportData, coopProfile, periodLabel) => {
  const doc = generateMonthlyReportPdfDoc(reportData, coopProfile, periodLabel);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};

export const exportMonthlyReportToPdf = (reportData, coopProfile, periodLabel) => {
  const doc = generateMonthlyReportPdfDoc(reportData, coopProfile, periodLabel);
  const filename = `Laporan_Bulanan_Koperasi_Permata_${periodLabel.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};
