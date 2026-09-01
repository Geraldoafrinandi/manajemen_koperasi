import { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../../context/ToastContext';
import reportService from '../../services/reportService';
import {
  exportReportToPdf,
  flattenTransactionsToItems,
  aggregateMonthlyDailySales,
} from '../../utils/exportPdf';
import { formatRupiah, formatTanggal, formatTanggalShort } from '../../utils/formatters';
import PermataLogo from '../../components/common/PermataLogo';
import PdfPreviewModal from '../../components/common/PdfPreviewModal';
import {
  FileText,
  Printer,
  Calendar,
  CalendarDays,
  Clock,
  Banknote,
  Smartphone,
  ShoppingBag,
  Receipt,
  TrendingUp,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DEFAULT_REPORT_DATA = {
  summary: {
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    profitMargin: '0.0',
    totalTransactions: 0,
    totalItemsSold: 0,
    avgTransactionValue: 0,
  },
  transactions: [],
  paymentMethods: {
    Cash: { count: 0, total: 0 },
    QRIS: { count: 0, total: 0 },
    Transfer: { count: 0, total: 0 },
  },
  topProducts: [],
  cashierPerformance: [],
  inventory: {
    totalProducts: 0,
    totalAssetValue: 0,
    totalRetailValue: 0,
  },
};

export const MonthlyReportsView = () => {
  const { coopProfile } = useProducts();
  const toast = useToast();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const availableYears = useMemo(() => {
    const nowYear = new Date().getFullYear();
    const startYear = 2024;
    const years = [];
    for (let y = nowYear; y >= Math.min(startYear, nowYear); y--) {
      years.push(y);
    }
    return years;
  }, []);

  const [filterMode, setFilterMode] = useState('DAILY');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [startDate, setStartDate] = useState(
    new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(todayStr);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [reportData, setReportData] = useState(DEFAULT_REPORT_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    let params = {};
    if (filterMode === 'DAILY') {
      params = { startDate: selectedDate, endDate: selectedDate };
    } else if (filterMode === 'MONTH') {
      params = { year: selectedYear, month: selectedMonth };
    } else {
      params = { startDate, endDate };
    }

    reportService
      .generateMonthlyReport(params)
      .then((data) => {
        if (isMounted && data) {
          setReportData(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load report:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filterMode, selectedDate, selectedYear, selectedMonth, startDate, endDate]);

  const periodLabel = useMemo(() => {
    if (filterMode === 'DAILY') {
      return formatTanggal(selectedDate);
    }
    if (filterMode === 'MONTH') {
      return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    }
    return `${formatTanggal(startDate)} s/d ${formatTanggal(endDate)}`;
  }, [filterMode, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  const isDaily = filterMode === 'DAILY';

  const itemRows = useMemo(
    () => flattenTransactionsToItems(reportData.transactions || []),
    [reportData.transactions]
  );

  const dailyRecapRows = useMemo(
    () => aggregateMonthlyDailySales(reportData.transactions || []),
    [reportData.transactions]
  );

  const totalDailyTransactions = useMemo(
    () => dailyRecapRows.reduce((sum, r) => sum + r.transactionCount, 0),
    [dailyRecapRows]
  );

  const totalDailyQty = useMemo(
    () => dailyRecapRows.reduce((sum, r) => sum + r.totalQty, 0),
    [dailyRecapRows]
  );

  const totalQty = useMemo(
    () => itemRows.reduce((sum, r) => sum + (r.quantity || 0), 0),
    [itemRows]
  );

  const totalOmset = useMemo(() => {
    return (
      reportData.summary?.totalRevenue ||
      (isDaily
        ? itemRows.reduce((sum, r) => sum + (r.subtotal || 0), 0)
        : dailyRecapRows.reduce((sum, r) => sum + r.totalRevenue, 0))
    );
  }, [reportData.summary, isDaily, itemRows, dailyRecapRows]);

  const summary = reportData.summary || {};
  const totalCost = Number(summary.totalCost || 0);
  const netProfit = Number(summary.netProfit || totalOmset - totalCost);
  const margin =
    summary.profitMargin ||
    (totalOmset > 0 ? ((netProfit / totalOmset) * 100).toFixed(1) : '0.0');

  const handlePrintOfficial = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      await exportReportToPdf(
        reportData,
        coopProfile,
        periodLabel,
        isDaily ? 'DAILY' : 'MONTHLY'
      );
      toast.success(`Laporan PDF periode ${periodLabel} berhasil didownload.`);
    } catch (e) {
      toast.error('Gagal membuat file PDF laporan.');
    }
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const setToday = () => {
    setSelectedDate(todayStr);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>{isDaily ? 'Laporan Transaksi Harian' : 'Laporan Rekapitulasi Bulanan'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {isDaily
              ? 'Laporan Penjualan & Kasir Harian'
              : 'Rekapitulasi Penjualan & Keuangan Bulanan'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isDaily ? 'Hari / Tanggal' : 'Bulan / Periode'}:{' '}
            <strong className="text-slate-800">{periodLabel}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak & Download PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <span className="text-xs font-bold uppercase text-slate-500">Tipe Laporan:</span>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setFilterMode('DAILY')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterMode === 'DAILY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Laporan Harian (Per Hari)</span>
              </button>
              <button
                onClick={() => setFilterMode('MONTH')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterMode === 'MONTH'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Rekap Bulanan</span>
              </button>
              <button
                onClick={() => setFilterMode('CUSTOM')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterMode === 'CUSTOM'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Rentang Tanggal</span>
              </button>
            </div>
          </div>

          {filterMode === 'DAILY' && (
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <button
                onClick={setToday}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  selectedDate === todayStr
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={setYesterday}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Kemarin
              </button>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-400 font-medium">Pilih:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {filterMode === 'MONTH' && (
            <div className="flex items-center space-x-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'CUSTOM' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs text-slate-400 font-bold">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {isDaily ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Omset Harian</span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                {formatRupiah(totalOmset)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Dari {reportData.summary.totalTransactions} transaksi ({itemRows.length} baris item)
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Barang Terjual</span>
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                {totalQty} Pcs
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Total kuantitas barang hari ini
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Rata-rata Nilai Belanja</span>
              <Receipt className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                {formatRupiah(reportData.summary.avgTransactionValue)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Nilai rata-rata per transaksi
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Metode Pembayaran</span>
              <Smartphone className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-1 space-y-0.5 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Tunai:</span>
                <span className="font-bold">{formatRupiah(reportData.paymentMethods?.Cash?.total || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>QRIS:</span>
                <span className="font-bold">{formatRupiah(reportData.paymentMethods?.QRIS?.total || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Transfer:</span>
                <span className="font-bold">{formatRupiah(reportData.paymentMethods?.Transfer?.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Omset Penjualan</span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                {formatRupiah(totalOmset)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {dailyRecapRows.length} hari penjualan aktif ({totalDailyTransactions} trx)
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Modal Barang</span>
              <Receipt className="w-4 h-4 text-slate-500" />
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                {formatRupiah(totalCost)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Total modal beli barang yang laku
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Laba Bersih Koperasi</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-emerald-700">
                {formatRupiah(netProfit)}
              </h3>
              <p className="text-[11px] text-slate-500 font-bold mt-1">
                Margin Keuntungan: {margin}%
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Barang Terjual</span>
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                {totalDailyQty} Pcs
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Akumulasi produk dalam 1 bulan
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isDaily
                ? 'Daftar Rincian Barang Terjual Harian'
                : 'Rekapitulasi Penjualan Harian per Tanggal'}
            </h3>
            <p className="text-xs text-slate-500">
              {isDaily
                ? 'Format: NO, No Faktur, Waktu, Rincian Barang, QTY, Metode, Kasir, Subtotal'
                : 'Format: NO, Tanggal Penjualan, Jml Transaksi, Total Barang, Metode, Petugas Kasir, Total Omset'}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            {isDaily
              ? `Total: ${itemRows.length} Barang`
              : `Total: ${dailyRecapRows.length} Hari Aktif (${totalDailyTransactions} Transaksi)`}
          </span>
        </div>

        <div className="overflow-x-auto">
          {isDaily ? (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">NO</th>
                  <th className="py-3 px-3">No. Faktur</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3 min-w-[220px]">Rincian Barang</th>
                  <th className="py-3 px-3 text-center">QTY</th>
                  <th className="py-3 px-3 text-center">Metode</th>
                  <th className="py-3 px-3">Kasir</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemRows.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-slate-400">
                      Tidak ada barang terjual pada periode {periodLabel}.
                    </td>
                  </tr>
                ) : (
                  itemRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {r.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatTanggal(r.createdAt, true)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {r.productName}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {r.quantity} {r.unit || 'pcs'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-slate-800">
                        {r.paymentMethod || 'CASH'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[120px]">
                        {r.cashierName || 'Kasir'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(r.subtotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {itemRows.length > 0 && (
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900 text-xs sm:text-sm">
                  <tr>
                    <td colSpan="7" className="py-3 px-3 text-right font-extrabold">
                      TOTAL:
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold font-mono text-emerald-700 text-base">
                      {formatRupiah(totalOmset)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            <div className="space-y-6">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">NO</th>
                    <th className="py-3 px-3">Tanggal Penjualan</th>
                    <th className="py-3 px-3 text-center">Jml Transaksi</th>
                    <th className="py-3 px-3 text-center">Total Barang</th>
                    <th className="py-3 px-3 text-center">Metode</th>
                    <th className="py-3 px-3">Petugas Kasir</th>
                    <th className="py-3 px-3 text-right">Total Omset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyRecapRows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-400">
                        Tidak ada transaksi penjualan pada bulan {periodLabel}.
                      </td>
                    </tr>
                  ) : (
                    dailyRecapRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {formatTanggal(r.date)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap text-slate-700">
                          {r.transactionCount} Transaksi
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-700 whitespace-nowrap">
                          {r.totalQty} pcs
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-slate-800">
                          {r.topPaymentMethod}
                        </td>
                        <td className="py-3 px-3 text-slate-600 truncate max-w-[160px]">
                          {r.cashiers}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatRupiah(r.totalRevenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {dailyRecapRows.length > 0 && (
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900 text-xs sm:text-sm">
                    <tr>
                      <td colSpan="6" className="py-3 px-3 text-right font-extrabold">
                        TOTAL:
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold font-mono text-emerald-700 text-base">
                        {formatRupiah(totalOmset)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Ringkasan Pendapatan & Keuntungan Koperasi ({periodLabel})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-center p-3 bg-white">
                  <div className="p-2">
                    <span className="text-[11px] text-slate-500 font-bold uppercase block">Total Pendapatan</span>
                    <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{formatRupiah(totalOmset)}</p>
                  </div>
                  <div className="p-2">
                    <span className="text-[11px] text-slate-500 font-bold uppercase block">Total Modal Barang</span>
                    <p className="text-base font-extrabold text-slate-700 font-mono mt-0.5">{formatRupiah(totalCost)}</p>
                  </div>
                  <div className="p-2">
                    <span className="text-[11px] text-emerald-700 font-bold uppercase block">Keuntungan Bersih</span>
                    <p className="text-base font-extrabold text-emerald-700 font-mono mt-0.5">{formatRupiah(netProfit)}</p>
                  </div>
                  <div className="p-2">
                    <span className="text-[11px] text-slate-500 font-bold uppercase block">Persentase Laba</span>
                    <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{margin}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="hidden print:block print-container report-print-area bg-white text-black font-serif"
        style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
      >
        <div className="report-print-container">
          <div className="report-print-top space-y-4">
            <div className="flex items-center pb-2">
              <div className="w-20 shrink-0 flex items-center justify-center pr-3">
                <PermataLogo variant="icon" size="kop" />
              </div>

              <div className="flex-1 text-center text-black space-y-0.5">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-900 leading-tight">
                  SEKOLAH DASAR ISLAM TERPADU (SD IT) PERMATA KITA
                </h2>
                <p className="text-[9px] font-semibold tracking-wide text-zinc-600 uppercase leading-tight">
                  FULL DAY SCHOOL - CENTRE OF ISLAMIC EDUCATION SERVICE
                </p>
                <h1 className="text-[15px] font-black uppercase tracking-wider text-black pt-0.5 leading-tight">
                  {coopProfile.name && coopProfile.name !== 'null' ? coopProfile.name : 'KOPERASI UNIT SEKOLAH "PERMATA KITA"'}
                </h1>
                <p className="text-[9.5px] text-zinc-800 pt-0.5 leading-tight">
                  {coopProfile.address && coopProfile.address !== 'null' ? coopProfile.address : 'Jl. SMP 21 Padang, Kota Padang'}
                  {coopProfile.city && coopProfile.city !== 'null' && !String(coopProfile.address || '').includes(coopProfile.city) ? `, ${coopProfile.city}` : ''}
                </p>
                {coopProfile.phone && coopProfile.phone !== '-' && coopProfile.phone !== 'null' && (
                  <p className="text-[9px] text-zinc-700 leading-tight">
                    Telepon / Faks. {coopProfile.phone}
                  </p>
                )}
                <div className="text-[9px] text-zinc-700 pt-0.5 flex items-center justify-center space-x-4 leading-tight">
                  {coopProfile.website && coopProfile.website !== '-' && coopProfile.website !== 'null' && (
                    <span>Laman: {coopProfile.website}</span>
                  )}
                  {coopProfile.email && coopProfile.email !== '-' && coopProfile.email !== 'null' && (
                    <span>Surel: {coopProfile.email}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-b-[2.5px] border-black mt-1.5"></div>
            <div className="border-b-[0.8px] border-black mt-[1.5px] mb-3"></div>

            <div className="text-center mb-3">
              <h3 className="text-[13px] font-extrabold uppercase tracking-wide underline text-slate-900">
                {isDaily
                  ? 'LAPORAN PENJUALAN & TRANSAKSI HARIAN'
                  : 'LAPORAN REKAPITULASI PENJUALAN & KEUANGAN BULANAN'}
              </h3>
              <p className="text-[10px] text-zinc-700 mt-0.5">
                {isDaily ? 'Hari / Tanggal' : 'Bulan / Periode'}:{' '}
                <strong className="text-black">{periodLabel}</strong> | Dicetak:{' '}
                {formatTanggal(new Date(), true)}
              </p>
            </div>

            {isDaily ? (
              <table className="w-full text-left text-[9.5px] border-collapse border border-black bg-white">
                <thead className="bg-white font-bold border-b border-black text-black">
                  <tr>
                    <th className="py-1.5 px-1 border border-black text-center w-[30px]">NO</th>
                    <th className="py-1.5 px-2 border border-black text-left w-[110px]">No. Faktur</th>
                    <th className="py-1.5 px-2 border border-black text-center w-[80px]">Waktu</th>
                    <th className="py-1.5 px-2 border border-black text-left">Rincian Barang</th>
                    <th className="py-1.5 px-1 border border-black text-center w-[45px]">QTY</th>
                    <th className="py-1.5 px-1 border border-black text-center w-[50px]">Metode</th>
                    <th className="py-1.5 px-2 border border-black text-left w-[70px]">Kasir</th>
                    <th className="py-1.5 px-2 border border-black text-right w-[85px]">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {itemRows.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-4 text-center border border-black text-slate-500 italic">
                        Belum ada data barang terjual pada periode {periodLabel}.
                      </td>
                    </tr>
                  ) : (
                    itemRows.map((r, idx) => (
                      <tr key={idx} className="bg-white text-black">
                        <td className="py-1 px-1 border border-black text-center text-zinc-800">{idx + 1}</td>
                        <td className="py-1 px-2 border border-black font-mono font-bold whitespace-nowrap text-black">{r.invoiceNumber}</td>
                        <td className="py-1 px-2 border border-black text-center whitespace-nowrap text-zinc-700">{formatTanggalShort(r.createdAt, true)}</td>
                        <td className="py-1 px-2 border border-black text-black font-medium">{r.productName}</td>
                        <td className="py-1 px-1 border border-black text-center font-mono">{r.quantity} {r.unit || 'pcs'}</td>
                        <td className="py-1 px-1 border border-black text-center uppercase font-bold text-zinc-800 text-[8px] whitespace-nowrap">{r.paymentMethod || 'CASH'}</td>
                        <td className="py-1 px-2 border border-black truncate text-zinc-800 text-[8.5px]">{r.cashierName || 'Kasir'}</td>
                        <td className="py-1 px-2 border border-black text-right font-mono font-bold text-black whitespace-nowrap">{formatRupiah(r.subtotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-white font-bold border-t border-black text-black">
                  <tr>
                    <td colSpan="7" className="py-1.5 px-2 text-right border border-black font-bold text-[9.5px]">
                      TOTAL:
                    </td>
                    <td className="py-1.5 px-2 text-right border border-black font-mono font-bold text-[9.5px]">
                      {formatRupiah(totalOmset)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="space-y-5">
                <table className="w-full text-left text-[9.5px] border-collapse border border-black bg-white">
                  <thead className="bg-white font-bold border-b border-black text-black">
                    <tr>
                      <th className="py-1.5 px-1 border border-black text-center w-[30px]">NO</th>
                      <th className="py-1.5 px-2.5 border border-black text-left w-[140px]">Tanggal Penjualan</th>
                      <th className="py-1.5 px-2 border border-black text-center w-[95px]">Jml Transaksi</th>
                      <th className="py-1.5 px-2 border border-black text-center w-[90px]">Total Barang</th>
                      <th className="py-1.5 px-2 border border-black text-center w-[70px]">Metode</th>
                      <th className="py-1.5 px-2.5 border border-black text-left">Petugas Kasir</th>
                      <th className="py-1.5 px-2.5 border border-black text-right w-[115px]">Total Omset (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {dailyRecapRows.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-4 text-center border border-black text-slate-500 italic">
                          Belum ada transaksi penjualan pada bulan {periodLabel}.
                        </td>
                      </tr>
                    ) : (
                      dailyRecapRows.map((r, idx) => (
                        <tr key={idx} className="bg-white text-black">
                          <td className="py-1 px-1 border border-black text-center text-zinc-800">{idx + 1}</td>
                          <td className="py-1 px-2.5 border border-black font-bold whitespace-nowrap text-black">{formatTanggal(r.date)}</td>
                          <td className="py-1 px-2 border border-black text-center whitespace-nowrap text-zinc-800">{r.transactionCount} Transaksi</td>
                          <td className="py-1 px-2 border border-black text-center font-mono text-zinc-800">{r.totalQty} pcs</td>
                          <td className="py-1 px-2 border border-black text-center uppercase font-bold text-zinc-800 text-[8.5px] whitespace-nowrap">{r.topPaymentMethod}</td>
                          <td className="py-1 px-2.5 border border-black truncate text-zinc-800">{r.cashiers}</td>
                          <td className="py-1 px-2.5 border border-black text-right font-mono font-bold text-black whitespace-nowrap">{formatRupiah(r.totalRevenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-white font-bold border-t border-black text-black">
                    <tr>
                      <td colSpan="6" className="py-1.5 px-2.5 text-right border border-black font-bold text-[9.5px]">
                        TOTAL:
                      </td>
                      <td className="py-1.5 px-2.5 text-right border border-black font-mono font-bold text-[9.5px]">
                        {formatRupiah(totalOmset)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <table className="w-full text-left text-[9.5px] border-collapse border border-black bg-white break-inside-avoid print:break-inside-avoid">
                  <thead className="bg-white font-bold border-b border-black text-black">
                    <tr>
                      <th colSpan="4" className="py-1.5 px-2.5 border border-black text-center uppercase tracking-wider font-extrabold">
                        RINGKASAN PENDAPATAN & KEUNTUNGAN KOPERASI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white font-serif">
                    <tr>
                      <td className="py-1.5 px-2.5 border border-black font-bold w-1/4">Total Pendapatan (Penjualan)</td>
                      <td className="py-1.5 px-2.5 border border-black font-mono font-extrabold text-right w-1/4">{formatRupiah(totalOmset)}</td>
                      <td className="py-1.5 px-2.5 border border-black font-bold w-1/4">Total Modal Barang (Harga Beli)</td>
                      <td className="py-1.5 px-2.5 border border-black font-mono font-bold text-right w-1/4">{formatRupiah(totalCost)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2.5 border border-black font-bold">Total Keuntungan Bersih</td>
                      <td className="py-1.5 px-2.5 border border-black font-mono font-extrabold text-right text-black">{formatRupiah(netProfit)}</td>
                      <td className="py-1.5 px-2.5 border border-black font-bold">Persentase Keuntungan</td>
                      <td className="py-1.5 px-2.5 border border-black font-mono font-bold text-right">{margin}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="report-print-signatures pt-8 mt-6 space-y-6 text-[10px] break-inside-avoid print:break-inside-avoid">
            <div className="grid grid-cols-2 gap-10">
              <div className="text-center">
                <p className="text-zinc-800">Mengetahui / Menyetujui,</p>
                <p className="font-bold text-black">{coopProfile.treasurerTitle && coopProfile.treasurerTitle !== 'null' ? coopProfile.treasurerTitle : 'Bendahara Koperasi'}</p>
                <div className="h-14"></div>
                <p className="font-bold underline text-black">
                  ( {coopProfile.treasurerName && coopProfile.treasurerName !== 'null' && coopProfile.treasurerName !== '-' ? coopProfile.treasurerName : 'Tidak Diketahui'} )
                </p>
                <p className="text-[9px] text-zinc-600 font-mono mt-0.5">
                  NIP: {coopProfile.treasurerNip && coopProfile.treasurerNip !== 'null' && coopProfile.treasurerNip !== '-' ? coopProfile.treasurerNip : '-'}
                </p>
              </div>

              <div className="text-center">
                <p className="text-zinc-800">{coopProfile.city && coopProfile.city !== 'null' ? coopProfile.city : 'Kota Padang'}, {formatTanggal(new Date())}</p>
                <p className="font-bold text-black">{coopProfile.headTitle && coopProfile.headTitle !== 'null' ? coopProfile.headTitle : 'Kepala Pengelola Koperasi'}</p>
                <div className="h-14"></div>
                <p className="font-bold underline text-black">
                  ( {coopProfile.headName && coopProfile.headName !== 'null' && coopProfile.headName !== '-' ? coopProfile.headName : 'Tidak Diketahui'} )
                </p>
                <p className="text-[9px] text-zinc-600 font-mono mt-0.5">
                  NIP: {coopProfile.headNip && coopProfile.headNip !== 'null' && coopProfile.headNip !== '-' ? coopProfile.headNip : '-'}
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-1">
              <div className="text-center w-80">
                <p className="text-zinc-800">Mengetahui / Penanggung Jawab Lembaga,</p>
                <p className="font-bold text-black">{coopProfile.principalTitle && coopProfile.principalTitle !== 'null' ? coopProfile.principalTitle : 'Kepala Sekolah SD IT Permata'}</p>
                <div className="h-14"></div>
                <p className="font-bold underline text-black">
                  ( {coopProfile.principalName && coopProfile.principalName !== 'null' && coopProfile.principalName !== '-' ? coopProfile.principalName : 'Tidak Diketahui'} )
                </p>
                <p className="text-[9px] text-zinc-600 font-mono mt-0.5">
                  NIP: {coopProfile.principalNip && coopProfile.principalNip !== 'null' && coopProfile.principalNip !== '-' ? coopProfile.principalNip : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PdfPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        reportData={reportData}
        coopProfile={coopProfile}
        periodLabel={periodLabel}
        reportType={isDaily ? 'DAILY' : 'MONTHLY'}
        onDownload={handleExportPdf}
        onPrint={handlePrintOfficial}
      />
    </div>
  );
};

export default MonthlyReportsView;
