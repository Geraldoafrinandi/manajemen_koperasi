// Export Excel Spreadsheet (.xlsx) menggunakan SheetJS
import * as XLSX from 'xlsx';
import { formatTanggal } from './formatters';

/**
 * Export Laporan Bulanan ke format Excel .xlsx
 */
export const exportMonthlyReportToExcel = (reportData, coopProfile, periodLabel) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Rincian Transaksi
  const transactionRows = (reportData.transactions || []).map((t, idx) => ({
    'No': idx + 1,
    'No. Faktur': t.invoiceNumber,
    'Waktu Transaksi': formatTanggal(t.createdAt, true),
    'Kasir': t.cashierName || '-',
    'Metode Bayar': t.paymentMethod || 'Cash',
    'Jumlah Item': t.totalItems || 0,
    'Modal Pokok (HPP)': t.totalCost || 0,
    'Diskon': t.discount || 0,
    'Total Omset': t.grandTotal || 0,
    'Laba Bersih': t.profit || 0,
  }));

  const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Rekap Transaksi');

  // Sheet 2: Ringkasan & Laba Rugi
  const summaryRows = [
    { 'Indikator Keuangan': 'Nama Koperasi', 'Nilai': coopProfile.name || 'Koperasi SD IT Permata Kita' },
    { 'Indikator Keuangan': 'Periode Laporan', 'Nilai': periodLabel },
    { 'Indikator Keuangan': 'Tanggal Export', 'Nilai': formatTanggal(new Date(), true) },
    { 'Indikator Keuangan': '', 'Nilai': '' },
    { 'Indikator Keuangan': 'Total Pendapatan (Omset)', 'Nilai': reportData.summary.totalRevenue },
    { 'Indikator Keuangan': 'Total Modal Pokok (HPP)', 'Nilai': reportData.summary.totalCost },
    { 'Indikator Keuangan': 'Total Laba Bersih', 'Nilai': reportData.summary.netProfit },
    { 'Indikator Keuangan': 'Margin Keuntungan', 'Nilai': `${reportData.summary.profitMargin}%` },
    { 'Indikator Keuangan': 'Total Transaksi', 'Nilai': reportData.summary.totalTransactions },
    { 'Indikator Keuangan': 'Total Item Terjual', 'Nilai': reportData.summary.totalItemsSold },
    { 'Indikator Keuangan': 'Rata-rata Nilai Transaksi', 'Nilai': reportData.summary.avgTransactionValue },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Laba & Rugi');

  // Sheet 3: Produk Terlaris
  const topProductRows = (reportData.topProducts || []).map((p, idx) => ({
    'Peringkat': idx + 1,
    'Kode SKU': p.sku,
    'Nama Barang': p.name,
    'Kategori': p.category,
    'Jumlah Terjual': p.quantitySold,
    'Total Omset': p.totalRevenue,
    'Total Laba': p.totalProfit,
  }));

  const wsTopProducts = XLSX.utils.json_to_sheet(topProductRows);
  XLSX.utils.book_append_sheet(wb, wsTopProducts, 'Produk Terlaris');

  // Download Excel File
  const filename = `Laporan_Koperasi_Permata_${periodLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Export Master Data Barang ke Excel .xlsx
 */
export const exportProductsToExcel = (products) => {
  const wb = XLSX.utils.book_new();

  const productRows = (products || []).map((p, idx) => ({
    'No': idx + 1,
    'Barcode': p.barcode,
    'SKU': p.sku,
    'Nama Barang': p.name,
    'Kategori': p.category,
    'Satuan': p.unit,
    'Harga Beli (Modal)': p.costPrice,
    'Harga Jual': p.sellPrice,
    'Stok Saat Ini': p.stock,
    'Stok Minimum': p.minStock,
    'Status Stok': p.stock <= 0 ? 'Habis' : p.stock <= p.minStock ? 'Menipis' : 'Aman',
    'Deskripsi': p.description || '',
  }));

  const ws = XLSX.utils.json_to_sheet(productRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Master Data Barang');

  const filename = `Data_Barang_Koperasi_Permata_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Export Laporan Stok & Mutasi ke Excel .xlsx
 */
export const exportStockReportToExcel = (products, mutations) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Posisi Stok Barang
  const stockRows = (products || []).map((p, idx) => ({
    'No': idx + 1,
    'Barcode': p.barcode,
    'SKU': p.sku,
    'Nama Barang': p.name,
    'Kategori': p.category,
    'Satuan': p.unit,
    'Stok Fisik': p.stock,
    'Batas Min': p.minStock,
    'Status': p.stock <= 0 ? 'Habis' : p.stock <= p.minStock ? 'Menipis' : 'Aman',
    'Total Aset (HPP)': (p.stock || 0) * (p.costPrice || 0),
    'Nilai Retail': (p.stock || 0) * (p.sellPrice || 0),
  }));
  const wsStock = XLSX.utils.json_to_sheet(stockRows);
  XLSX.utils.book_append_sheet(wb, wsStock, 'Posisi Stok');

  // Sheet 2: Log Mutasi
  const mutationRows = (mutations || []).map((m, idx) => {
    const noteText = String(m.reason || '').toLowerCase();
    const refNo = String(m.referenceNo || '');
    const isCashierSale =
      m.type === 'SALE' ||
      refNo.toUpperCase().startsWith('TRX') ||
      refNo.toUpperCase().startsWith('INV') ||
      noteText.includes('penjualan') ||
      noteText.includes('kasir') ||
      noteText.includes('terjual');

    const isBarangMasuk = !isCashierSale;
    const calcQty = m.quantity > 0 ? m.quantity : (Math.abs((m.newStock || 0) - (m.previousStock || 0)) || 1);
    return {
      'No': idx + 1,
      'Waktu': formatTanggal(m.date, true),
      'Nama Barang': m.productName,
      'SKU': m.sku,
      'Tipe Mutasi': isBarangMasuk ? 'Barang Masuk' : 'Terjual di Kasir',
      'Perubahan': isBarangMasuk ? `+${calcQty}` : `-${calcQty}`,
      'Stok Sebelum': m.previousStock,
      'Stok Sesudah': m.newStock,
      'Keterangan / Alasan': m.reason || '-',
      'Petugas': (() => {
        const raw = m.responsiblePerson || m.author || 'Admin Koperasi';
        const s = String(raw).trim();
        if (
          s.toLowerCase() === 'admin' ||
          s.toLowerCase() === 'administrator' ||
          s.toLowerCase().includes('administrator')
        ) {
          return 'Admin Koperasi';
        }
        return s;
      })(),
    };
  });
  const wsMutations = XLSX.utils.json_to_sheet(mutationRows);
  XLSX.utils.book_append_sheet(wb, wsMutations, 'Riwayat Mutasi');

  const filename = `Laporan_Stok_Mutasi_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Export Riwayat Transaksi Penjualan ke Excel .xlsx
 */
export const exportTransactionsToExcel = (transactions) => {
  const wb = XLSX.utils.book_new();

  const trxRows = (transactions || []).map((t, idx) => ({
    'No': idx + 1,
    'No. Faktur': t.invoiceNumber,
    'Tanggal & Waktu': formatTanggal(t.createdAt, true),
    'Kasir': t.cashierName || '-',
    'Metode Pembayaran': t.paymentMethod || 'Cash',
    'Total Item': t.totalItems || 0,
    'Subtotal': t.subtotal || 0,
    'Diskon': t.discount || 0,
    'Grand Total': t.grandTotal || 0,
    'Total HPP': t.totalCost || 0,
    'Laba / Margin': t.profit || 0,
    'Status': t.status || 'Completed',
  }));

  const ws = XLSX.utils.json_to_sheet(trxRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Penjualan');

  const filename = `Riwayat_Transaksi_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
};
