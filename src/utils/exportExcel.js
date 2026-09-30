import * as XLSX from 'xlsx';
import {
  flattenTransactionsToItems,
  aggregateMonthlyDailySales,
} from './exportPdf';
import {
  formatTanggal,
  formatTanggalShort,
} from './formatters';

/**
 * Helper untuk memberikan style / alignment pada cell tertentu di worksheet
 */
const setCellStyle = (ws, r, c, style = {}) => {
  const cellRef = XLSX.utils.encode_cell({ r, c });
  if (!ws[cellRef]) {
    ws[cellRef] = { t: 's', v: '' };
  }
  ws[cellRef].s = {
    ...(ws[cellRef].s || {}),
    ...style,
  };
};

/**
 * Terapkan styling rata tengah pada Header Judul & Header Tabel serta data dan total
 */
const formatWorksheetStyles = (
  ws,
  totalCols = 10,
  dataStartRow = 5,
  totalRowIdx = 0,
  sigStartRow = 0
) => {
  // 1. Header Judul (Baris 0, 1, 2) - RATA TENGAH
  for (let c = 0; c < totalCols; c++) {
    setCellStyle(ws, 0, c, {
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      font: { bold: true, sz: 13, name: 'Calibri' },
    });
    setCellStyle(ws, 1, c, {
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      font: { bold: true, sz: 11, name: 'Calibri' },
    });
    setCellStyle(ws, 2, c, {
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      font: { italic: true, sz: 9, name: 'Calibri' },
    });
  }

  // 2. Header Kolom Tabel (Baris 4) - RATA TENGAH & TEBAL
  for (let c = 0; c < totalCols; c++) {
    setCellStyle(ws, 4, c, {
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      font: { bold: true, sz: 10, name: 'Calibri' },
      fill: { fgColor: { rgb: 'E2E8F0' } },
    });
  }

  // 3. Data Baris Tabel
  for (let r = dataStartRow; r < totalRowIdx; r++) {
    for (let c = 0; c < totalCols; c++) {
      let hAlign = 'center';
      if (totalCols === 10) {
        if (c === 3 || c === 9) hAlign = 'left';
        else if (c === 6 || c === 7) hAlign = 'right';
      } else if (totalCols === 7) {
        if (c === 5) hAlign = 'left';
        else if (c === 6) hAlign = 'right';
      }

      setCellStyle(ws, r, c, {
        alignment: { horizontal: hAlign, vertical: 'center' },
        font: { sz: 10, name: 'Calibri' },
      });
    }
  }

  // 4. Baris TOTAL & Rincian Pembayaran (Tunai, QRIS, Transfer)
  if (totalRowIdx > 0) {
    // Baris Total Utama
    for (let c = 0; c < totalCols; c++) {
      let hAlign = 'center';
      if (totalCols === 10) {
        if (c <= 3) hAlign = 'right';
        else if (c === 7) hAlign = 'right';
      } else if (totalCols === 7) {
        if (c <= 1) hAlign = 'right';
        else if (c === 6) hAlign = 'right';
      }

      setCellStyle(ws, totalRowIdx, c, {
        alignment: { horizontal: hAlign, vertical: 'center' },
        font: { bold: true, sz: 10, name: 'Calibri' },
        fill: { fgColor: { rgb: 'F1F5F9' } },
      });
    }

    // Baris Rincian Pembayaran (Tunai, QRIS, Transfer)
    for (let r = totalRowIdx + 1; r <= totalRowIdx + 3; r++) {
      for (let c = 0; c < totalCols; c++) {
        let hAlign = 'center';
        const isLabel = (totalCols === 10 && c <= 6) || (totalCols === 7 && c <= 5);
        const isValue = (totalCols === 10 && c === 7) || (totalCols === 7 && c === 6);

        if (isLabel) hAlign = 'right';
        else if (isValue) hAlign = 'right';

        setCellStyle(ws, r, c, {
          alignment: { horizontal: hAlign, vertical: 'center' },
          font: { bold: isValue, sz: 9.5, name: 'Calibri' },
        });
      }
    }
  }

  // 5. Blok Tanda Tangan - RATA TENGAH di kolom masing-masing
  if (sigStartRow > 0) {
    for (let r = sigStartRow; r < sigStartRow + 18; r++) {
      for (let c = 0; c < totalCols; c++) {
        setCellStyle(ws, r, c, {
          alignment: { horizontal: 'center', vertical: 'center' },
          font: { sz: 10, name: 'Calibri' },
        });
      }
    }
  }
};

/**
 * Helper untuk membuat blok tanda tangan di bagian bawah tabel
 */
const createSignatureBlock = (
  startRow,
  coopProfile = {}
) => {
  const tTitle = coopProfile.treasurerTitle || 'Bendahara Koperasi';
  const tName = coopProfile.treasurerName || 'Tidak Diketahui';
  const tNip = coopProfile.treasurerNip || '-';

  const hTitle = coopProfile.headTitle || 'Kepala Pengelola Koperasi';
  const hName = coopProfile.headName || 'Tidak Diketahui';
  const hNip = coopProfile.headNip || '-';

  const pTitle = coopProfile.principalTitle || 'Kepala Sekolah SD IT Permata';
  const pName = coopProfile.principalName || 'Tidak Diketahui';
  const pNip = coopProfile.principalNip || '-';

  const cityDate = `${coopProfile.city || 'Kota Padang'}, ${formatTanggal(new Date())}`;

  const rows = [
    [],
    [],
    ['Mengetahui / Menyetujui,', '', '', '', '', '', cityDate, '', '', ''],
    [tTitle, '', '', '', '', '', hTitle, '', '', ''],
    [],
    [],
    [],
    [`( ${tName} )`, '', '', '', '', '', `( ${hName} )`, '', '', ''],
    [`NIP: ${tNip}`, '', '', '', '', '', `NIP: ${hNip}`, '', '', ''],
    [],
    ['', '', '', 'Mengetahui / Penanggung Jawab Lembaga,', '', '', '', '', '', ''],
    ['', '', '', pTitle, '', '', '', '', '', ''],
    [],
    [],
    [],
    ['', '', '', `( ${pName} )`, '', '', '', '', '', ''],
    ['', '', '', `NIP: ${pNip}`, '', '', '', '', '', ''],
  ];

  const merges = [
    // Mengetahui / Menyetujui (Bendahara)
    { s: { r: startRow + 2, c: 0 }, e: { r: startRow + 2, c: 2 } },
    { s: { r: startRow + 3, c: 0 }, e: { r: startRow + 3, c: 2 } },
    { s: { r: startRow + 7, c: 0 }, e: { r: startRow + 7, c: 2 } },
    { s: { r: startRow + 8, c: 0 }, e: { r: startRow + 8, c: 2 } },

    // Kepala Pengelola (Kanan)
    { s: { r: startRow + 2, c: 6 }, e: { r: startRow + 2, c: 9 } },
    { s: { r: startRow + 3, c: 6 }, e: { r: startRow + 3, c: 9 } },
    { s: { r: startRow + 7, c: 6 }, e: { r: startRow + 7, c: 9 } },
    { s: { r: startRow + 8, c: 6 }, e: { r: startRow + 8, c: 9 } },

    // Kepala Sekolah (Tengah Bawah)
    { s: { r: startRow + 10, c: 3 }, e: { r: startRow + 10, c: 6 } },
    { s: { r: startRow + 11, c: 3 }, e: { r: startRow + 11, c: 6 } },
    { s: { r: startRow + 15, c: 3 }, e: { r: startRow + 15, c: 6 } },
    { s: { r: startRow + 16, c: 3 }, e: { r: startRow + 16, c: 6 } },
  ];

  return { rows, merges };
};

/**
 * Export data laporan penjualan barang ke file Excel (.xlsx) dengan rincian pembayaran
 * @param {Object} reportData Data laporan dari reportService
 * @param {Object} coopProfile Profil koperasi
 * @param {string} periodLabel Label periode tanggal
 * @param {string} reportType 'DAILY' atau 'MONTHLY'
 */
export const exportReportToExcel = (
  reportData,
  coopProfile = {},
  periodLabel = '',
  reportType = 'MONTHLY'
) => {
  if (!reportData) {
    throw new Error('Data laporan tidak tersedia untuk diekspor ke Excel');
  }

  const isDaily = reportType === 'DAILY';
  const wb = XLSX.utils.book_new();

  const summary = reportData.summary || {};
  const transactions = reportData.transactions || [];
  const itemRows = flattenTransactionsToItems(transactions);
  const dailyRecapRows = aggregateMonthlyDailySales(transactions);

  const totalQty = itemRows.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalDailyTrx = dailyRecapRows.reduce((sum, r) => sum + (r.transactionCount || 0), 0);
  const totalDailyQty = dailyRecapRows.reduce((sum, r) => sum + (r.totalQty || 0), 0);

  const totalRevenue =
    summary.totalRevenue ||
    (isDaily
      ? itemRows.reduce((sum, r) => sum + (r.subtotal || 0), 0)
      : dailyRecapRows.reduce((sum, r) => sum + (r.totalRevenue || 0), 0));

  // Hitung rincian pembayaran Cash, QRIS, Transfer
  let cashTotal = Number(
    reportData.paymentMethods?.Cash?.total ??
    reportData.paymentMethods?.CASH?.total ??
    0
  );
  let qrisTotal = Number(
    reportData.paymentMethods?.QRIS?.total ??
    0
  );
  let transferTotal = Number(
    reportData.paymentMethods?.Transfer?.total ??
    reportData.paymentMethods?.TRANSFER?.total ??
    0
  );

  // Jika dari object paymentMethods kosong, hitung manual dari daftar transaksi
  if (cashTotal === 0 && qrisTotal === 0 && transferTotal === 0 && transactions.length > 0) {
    transactions.forEach((t) => {
      const pm = String(t.paymentMethod || 'CASH').toUpperCase();
      const amount = Number(t.grandTotal || t.total || 0);
      if (pm === 'CASH' || pm === 'TUNAI') {
        cashTotal += amount;
      } else if (pm === 'QRIS') {
        qrisTotal += amount;
      } else if (pm === 'TRANSFER') {
        transferTotal += amount;
      } else {
        cashTotal += amount;
      }
    });
  }

  const coopName = coopProfile.name || 'KOPERASI UNIT SEKOLAH SD IT PERMATA KITA';

  // =========================================================================
  // 1. DATA BARANG TERJUAL (UTAMA)
  // =========================================================================
  const mainTitle = isDaily
    ? `REKAP LAPORAN HARIAN TGL ${periodLabel.toUpperCase()}`
    : `REKAP LAPORAN BULANAN PERIODE ${periodLabel.toUpperCase()}`;

  const wsData = [
    [mainTitle],
    [coopName],
    [`Dicetak: ${formatTanggal(new Date(), true)}`],
    [], // Baris kosong sebelum tabel
    [
      'NO',
      'NO. FAKTUR',
      isDaily ? 'WAKTU' : 'TANGGAL & WAKTU',
      'NAMA BARANG',
      'QTY',
      'SATUAN',
      'HARGA SATUAN (RP)',
      'SUBTOTAL (RP)',
      'METODE PEMBAYARAN',
      'KASIR',
    ],
  ];

  if (itemRows.length === 0) {
    wsData.push(['-', '-', '-', `Tidak ada transaksi data barang pada periode ${periodLabel}`, 0, '-', 0, 0, '-', '-']);
  } else {
    itemRows.forEach((r, idx) => {
      wsData.push([
        idx + 1,
        r.invoiceNumber || '-',
        formatTanggalShort(r.createdAt, true),
        r.productName || 'Barang',
        Number(r.quantity || 0),
        r.unit || 'pcs',
        Number(r.price || 0),
        Number(r.subtotal || 0),
        (r.paymentMethod || 'CASH').toUpperCase(),
        r.cashierName || 'Kasir',
      ]);
    });
  }

  // Baris Total Utama
  const totalRowIndex = wsData.length;
  wsData.push([
    'TOTAL PENJUALAN (OMSET)',
    '',
    '',
    '',
    Number(totalQty),
    '',
    '',
    Number(totalRevenue),
    '',
    '',
  ]);

  // Rincian Pembayaran Tunai, QRIS, Transfer
  wsData.push([
    '  • Total Pembayaran Tunai (Cash)',
    '',
    '',
    '',
    '',
    '',
    '',
    Number(cashTotal),
    'TUNAI',
    '',
  ]);
  wsData.push([
    '  • Total Pembayaran QRIS',
    '',
    '',
    '',
    '',
    '',
    '',
    Number(qrisTotal),
    'QRIS',
    '',
  ]);
  wsData.push([
    '  • Total Pembayaran Transfer Bank',
    '',
    '',
    '',
    '',
    '',
    '',
    Number(transferTotal),
    'TRANSFER',
    '',
  ]);

  // Blok Tanda Tangan
  const sigStartRow = wsData.length;
  const sigBlock = createSignatureBlock(sigStartRow, coopProfile);
  sigBlock.rows.forEach((row) => wsData.push(row));

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Lebar Kolom
  ws['!cols'] = [
    { wch: 6 },  // A: NO
    { wch: 22 }, // B: NO. FAKTUR
    { wch: 20 }, // C: WAKTU / TANGGAL
    { wch: 38 }, // D: NAMA BARANG
    { wch: 10 }, // E: QTY
    { wch: 10 }, // F: SATUAN
    { wch: 18 }, // G: HARGA SATUAN (RP)
    { wch: 20 }, // H: SUBTOTAL (RP)
    { wch: 18 }, // I: METODE PEMBAYARAN
    { wch: 20 }, // J: KASIR
  ];

  // Tinggi Baris (Row Heights)
  ws['!rows'] = [
    { hpt: 24 }, // Judul Utama
    { hpt: 18 }, // Nama Koperasi
    { hpt: 15 }, // Tanggal Cetak
    { hpt: 10 }, // Baris Kosong
    { hpt: 24 }, // Header Kolom Tabel
  ];

  // Merge Cells untuk Header, Total, Rincian Pembayaran, & Pengesahan
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Header Judul Rata Tengah
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // Subheader Nama Koperasi Rata Tengah
    { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }, // Info Tanggal Cetak Rata Tengah
    { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 3 } }, // Label TOTAL (Kolom A-D)
    { s: { r: totalRowIndex + 1, c: 0 }, e: { r: totalRowIndex + 1, c: 6 } }, // Tunai (Kolom A-G)
    { s: { r: totalRowIndex + 2, c: 0 }, e: { r: totalRowIndex + 2, c: 6 } }, // QRIS (Kolom A-G)
    { s: { r: totalRowIndex + 3, c: 0 }, e: { r: totalRowIndex + 3, c: 6 } }, // Transfer (Kolom A-G)
    ...sigBlock.merges,
  ];

  ws['!merges'] = merges;

  // Format Styling Cell (Alignment Center pada Header & Judul, Format Angka)
  formatWorksheetStyles(ws, 10, 5, totalRowIndex, sigStartRow);

  const sheetName = isDaily ? 'Data Barang Harian' : 'Data Barang Bulanan';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // =========================================================================
  // 2. JIKA BULANAN: TAMBAHKAN SHEET REKAPITULASI HARIAN
  // =========================================================================
  if (!isDaily) {
    const recapTitle = `REKAPITULASI PENJUALAN HARIAN BULAN ${periodLabel.toUpperCase()}`;
    const ws2Data = [
      [recapTitle],
      [coopName],
      [`Dicetak: ${formatTanggal(new Date(), true)}`],
      [],
      [
        'NO',
        'TANGGAL PENJUALAN',
        'JML TRANSAKSI',
        'TOTAL BARANG (PCS)',
        'METODE TERBANYAK',
        'PETUGAS KASIR',
        'TOTAL OMSET (RP)',
      ],
    ];

    if (dailyRecapRows.length === 0) {
      ws2Data.push(['-', `Belum ada transaksi pada periode ${periodLabel}`, 0, 0, '-', '-', 0]);
    } else {
      dailyRecapRows.forEach((r, idx) => {
        ws2Data.push([
          idx + 1,
          formatTanggal(r.date),
          Number(r.transactionCount || 0),
          Number(r.totalQty || 0),
          (r.topPaymentMethod || 'CASH').toUpperCase(),
          r.cashiers || 'Kasir',
          Number(r.totalRevenue || 0),
        ]);
      });
    }

    const ws2TotalRowIndex = ws2Data.length;
    ws2Data.push([
      'TOTAL PENJUALAN (OMSET)',
      '',
      Number(totalDailyTrx),
      Number(totalDailyQty),
      '',
      '',
      Number(totalRevenue),
    ]);

    // Rincian Pembayaran pada Sheet Rekap Bulanan
    ws2Data.push([
      '  • Total Pembayaran Tunai (Cash)',
      '',
      '',
      '',
      '',
      '',
      Number(cashTotal),
    ]);
    ws2Data.push([
      '  • Total Pembayaran QRIS',
      '',
      '',
      '',
      '',
      '',
      Number(qrisTotal),
    ]);
    ws2Data.push([
      '  • Total Pembayaran Transfer Bank',
      '',
      '',
      '',
      '',
      '',
      Number(transferTotal),
    ]);

    // Tanda Tangan untuk Sheet Rekap
    const sigStartRow2 = ws2Data.length;
    const sigBlock2 = createSignatureBlock(sigStartRow2, coopProfile);
    sigBlock2.rows.forEach((row) => ws2Data.push(row));

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2['!cols'] = [
      { wch: 6 },  // NO
      { wch: 22 }, // TANGGAL
      { wch: 18 }, // JML TRANSAKSI
      { wch: 20 }, // TOTAL BARANG (PCS)
      { wch: 18 }, // METODE TERBANYAK
      { wch: 26 }, // PETUGAS KASIR
      { wch: 22 }, // TOTAL OMSET (RP)
    ];

    ws2['!rows'] = [
      { hpt: 24 }, // Judul
      { hpt: 18 }, // Nama Koperasi
      { hpt: 15 }, // Tanggal Cetak
      { hpt: 10 }, // Kosong
      { hpt: 24 }, // Header Kolom
    ];

    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Header Judul
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Subheader
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Tanggal Cetak
      { s: { r: ws2TotalRowIndex, c: 0 }, e: { r: ws2TotalRowIndex, c: 1 } },
      { s: { r: ws2TotalRowIndex + 1, c: 0 }, e: { r: ws2TotalRowIndex + 1, c: 5 } },
      { s: { r: ws2TotalRowIndex + 2, c: 0 }, e: { r: ws2TotalRowIndex + 2, c: 5 } },
      { s: { r: ws2TotalRowIndex + 3, c: 0 }, e: { r: ws2TotalRowIndex + 3, c: 5 } },
      ...sigBlock2.merges.map((m) => ({
        s: { r: m.s.r, c: Math.min(m.s.c, 6) },
        e: { r: m.e.r, c: Math.min(m.e.c, 6) },
      })),
    ];

    formatWorksheetStyles(ws2, 7, 5, ws2TotalRowIndex, sigStartRow2);

    XLSX.utils.book_append_sheet(wb, ws2, 'Rekap Per Tanggal');
  }

  // Nama File
  const prefix = isDaily ? 'Rekap_Laporan_Harian' : 'Rekap_Laporan_Bulanan';
  const cleanLabel = String(periodLabel || 'Periode').replace(/[\s,/\\:]+/g, '_');
  const filename = `${prefix}_${cleanLabel}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
};

export const exportMonthlyReportToExcel = (reportData, coopProfile, periodLabel) => {
  return exportReportToExcel(reportData, coopProfile, periodLabel, 'MONTHLY');
};

export const exportDailyReportToExcel = (reportData, coopProfile, periodLabel) => {
  return exportReportToExcel(reportData, coopProfile, periodLabel, 'DAILY');
};

export default exportReportToExcel;
