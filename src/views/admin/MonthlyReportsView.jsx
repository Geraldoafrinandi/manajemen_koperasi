import { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../../context/ToastContext';
import reportService from '../../services/reportService';
import { exportMonthlyReportToPdf } from '../../utils/exportPdf';
import { formatRupiah, formatTanggal, formatTanggalShort } from '../../utils/formatters';
import PermataLogo from '../../components/common/PermataLogo';
import PdfPreviewModal from '../../components/common/PdfPreviewModal';
import {
  FileText,
  Printer,
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

export const MonthlyReportsView = () => {
  const { coopProfile, products } = useProducts();
  const toast = useToast();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const availableYears = useMemo(() => {
    const nowYear = new Date().getFullYear();
    const startYear = 2024;

    const years = [];
    for (let y = nowYear; y >= Math.min(startYear, nowYear); y--) {
      years.push(y);
    }
    return years;
  }, []);

  const [filterMode, setFilterMode] = useState('MONTH');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [startDate, setStartDate] = useState(
    new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const defaultReportData = {
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

  const [reportData, setReportData] = useState(defaultReportData);
  const [loading, setLoading] = useState(false);

  // Fetch Report Data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params =
      filterMode === 'MONTH'
        ? { year: selectedYear, month: selectedMonth }
        : { startDate, endDate };

    reportService
      .generateMonthlyReport(params)
      .then((data) => {
        if (isMounted && data) {
          setReportData(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load report from backend:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filterMode, selectedYear, selectedMonth, startDate, endDate]);

  const periodLabel = useMemo(() => {
    if (filterMode === 'MONTH') {
      return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    }
    return `${formatTanggal(startDate)} s/d ${formatTanggal(endDate)}`;
  }, [filterMode, selectedMonth, selectedYear, startDate, endDate]);

  const handlePrintOfficial = () => {
    window.print();
  };

  const handleOpenPdfPreview = () => {
    setIsPreviewModalOpen(true);
  };

  const handleExportPdf = () => {
    try {
      exportMonthlyReportToPdf(reportData, coopProfile, periodLabel);
      toast.success(`Laporan PDF periode ${periodLabel} berhasil didownload.`);
    } catch (e) {
      toast.error('Gagal membuat file PDF laporan.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Laporan Rekap Bulanan </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Rekap Keuangan & Laporan Koperasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Periode Laporan: <strong className="text-slate-800">{periodLabel}</strong>
          </p>
        </div>

        {/* Export & Print Actions (Unified) */}
        <div className="flex items-center">
          <button
            onClick={handleOpenPdfPreview}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shadow-xs"
            title="Buka dokumen resmi untuk dicetak atau diunduh sebagai PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak & Download Laporan</span>
          </button>
        </div>
      </div>

      {/* Period Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase text-slate-500">Filter Periode:</span>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setFilterMode('MONTH')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${filterMode === 'MONTH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Bulan & Tahun
              </button>
              <button
                onClick={() => setFilterMode('CUSTOM')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${filterMode === 'CUSTOM' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Rentang Tanggal
              </button>
            </div>
          </div>

          {filterMode === 'MONTH' ? (
            <div className="flex items-center space-x-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          ) : (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-400 font-bold">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4 Financial Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500">Total Omset Penjualan</span>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-slate-900">
              {formatRupiah(reportData.summary.totalRevenue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Dari {reportData.summary.totalTransactions} transaksi ({reportData.summary.totalItemsSold} item)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500">Total Modal Pokok (HPP)</span>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-slate-900">
              {formatRupiah(reportData.summary.totalCost)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Harga beli barang yang terjual
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500">Laba Bersih Koperasi</span>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-slate-900">
              {formatRupiah(reportData.summary.netProfit)}
            </h3>
            <p className="text-[11px] text-slate-500 font-bold mt-1">
              Margin Laba: {reportData.summary.profitMargin}%
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500">Rata-rata Transaksi</span>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-slate-900">
              {formatRupiah(reportData.summary.avgTransactionValue)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Nilai keranjang rata-rata
            </p>
          </div>
        </div>
      </div>

      {/* Main Container: Rincian Transaksi Penjualan Bulanan */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 no-print">
        {/* Sales Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Total Omset Penjualan</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                {formatRupiah(reportData.summary.totalRevenue)}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              {reportData.summary.totalTransactions} Transaksi
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Total Barang Terjual</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                {reportData.summary.totalItemsSold} Pcs
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              Periode {periodLabel}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-800 uppercase">Rata-rata Nilai Transaksi</p>
              <p className="text-base font-extrabold text-emerald-900 mt-0.5">
                {formatRupiah(reportData.summary.totalTransactions > 0 ? Math.round(reportData.summary.totalRevenue / reportData.summary.totalTransactions) : 0)}
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
              Rata-rata / Trx
            </span>
          </div>
        </div>

        {/* Transactions Table with Item Details */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-y border-slate-200">
              <tr>
                <th className="py-3 px-3">No. Faktur</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Rincian Barang</th>
                <th className="py-3 px-3">Metode</th>
                <th className="py-3 px-3">Kasir</th>
                <th className="py-3 px-3 text-right">Total Penjualan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    Tidak ada transaksi pada periode {periodLabel}.
                  </td>
                </tr>
              ) : (
                reportData.transactions.map((trx) => {
                  const itemsList = trx.items || [];
                  const itemSummary =
                    itemsList.length === 0
                      ? '-'
                      : itemsList.length <= 2
                      ? itemsList.map((it) => `${it.name} (${it.quantity})`).join(', ')
                      : `${itemsList.slice(0, 2).map((it) => `${it.name} (${it.quantity})`).join(', ')} +${itemsList.length - 2} lainnya`;

                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {trx.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatTanggal(trx.createdAt, true)}
                      </td>
                      <td className="py-3 px-3 text-slate-700 text-xs max-w-[260px] truncate" title={itemsList.map(i => `${i.name} x${i.quantity}`).join(', ')}>
                        {itemSummary}
                      </td>
                      <td className="py-3 px-3 uppercase text-slate-600 font-semibold text-xs whitespace-nowrap">
                        {trx.paymentMethod || 'CASH'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[120px]">{trx.cashierName || 'Kasir'}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(trx.grandTotal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINT-ONLY OFFICIAL REPORT VIEW WITH KOP SURAT PERMATA KITA */}
      <div
        className="hidden print:block print-container report-print-area bg-white text-black p-4 font-serif"
        style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
      >
        {/* KOP SURAT RESMI */}
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
            {(coopProfile.phone && coopProfile.phone !== '-' && coopProfile.phone !== 'null') && (
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
        <div className="border-b-[0.8px] border-black mt-[1.5px] mb-3.5"></div>

        {/* JUDUL DOKUMEN */}
        <div className="text-center mb-3">
          <h3 className="text-[13px] font-extrabold uppercase tracking-wide underline text-slate-900">
            LAPORAN REKAP KEUANGAN & PENJUALAN BULANAN
          </h3>
          <p className="text-[10px] text-zinc-700 mt-0.5">
            Periode: <strong className="text-black">{periodLabel}</strong> | Dicetak: {formatTanggal(new Date(), true)}
          </p>
        </div>

        {/* TABEL TRANSAKSI RESMI DENGAN DETAIL BARANG */}
        <table className="w-full text-left text-[9px] border-collapse border border-black mb-3.5 bg-white">
          <thead className="bg-zinc-100 font-bold border-b-2 border-black text-black">
            <tr>
              <th className="py-1 px-1 border border-black text-center w-[30px]">No</th>
              <th className="py-1 px-1.5 border border-black text-left w-[130px]">No. Faktur</th>
              <th className="py-1 px-1.5 border border-black text-center w-[95px]">Waktu</th>
              <th className="py-1 px-1.5 border border-black text-left">Rincian Barang</th>
              <th className="py-1 px-1 border border-black text-center w-[55px]">Metode</th>
              <th className="py-1 px-1.5 border border-black text-left w-[85px]">Kasir</th>
              <th className="py-1 px-1.5 border border-black text-right w-[105px]">Total Penjualan</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {reportData.transactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-4 text-center border border-black text-slate-500 italic">
                  Belum ada data transaksi penjualan pada periode {periodLabel}.
                </td>
              </tr>
            ) : (
              reportData.transactions.map((t, idx) => {
                const itemsList = t.items || [];
                const itemSummary =
                  itemsList.length === 0
                    ? '-'
                    : itemsList.length <= 2
                    ? itemsList.map((it) => `${it.name} (${it.quantity})`).join(', ')
                    : `${itemsList.slice(0, 2).map((it) => `${it.name} (${it.quantity})`).join(', ')} +${itemsList.length - 2}`;

                return (
                  <tr key={t.id || idx} className="bg-white text-black">
                    <td className="py-0.8 px-1 border border-black text-center text-zinc-800">{idx + 1}</td>
                    <td className="py-0.8 px-1.5 border border-black font-mono font-bold whitespace-nowrap text-black">{t.invoiceNumber}</td>
                    <td className="py-0.8 px-1.5 border border-black text-center whitespace-nowrap text-zinc-700">{formatTanggalShort(t.createdAt, true)}</td>
                    <td className="py-0.8 px-1.5 border border-black text-zinc-800 text-[8.5px] leading-tight truncate max-w-[200px]">{itemSummary}</td>
                    <td className="py-0.8 px-1 border border-black text-center uppercase font-bold text-zinc-800 text-[8.5px]">{t.paymentMethod || 'CASH'}</td>
                    <td className="py-0.8 px-1.5 border border-black truncate text-zinc-800 text-[8.5px]">{t.cashierName || 'Kasir'}</td>
                    <td className="py-0.8 px-1.5 border border-black text-right font-mono font-bold text-black">{formatRupiah(t.grandTotal)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-zinc-100 font-bold border-t-2 border-black text-black">
            <tr>
              <td colSpan="6" className="py-1.5 px-2 text-right border border-black font-bold text-[9px]">
                TOTAL ({reportData.summary.totalTransactions} Transaksi):
              </td>
              <td className="py-1.5 px-2 text-right border border-black font-mono font-bold text-[9px]">
                {formatRupiah(reportData.summary.totalRevenue)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* REKAPITULASI RINGKASAN KEUANGAN */}
        <div className="grid grid-cols-3 border border-black bg-zinc-50/50 mb-6 divide-x divide-black text-center break-inside-avoid print:break-inside-avoid">
          <div className="p-2">
            <span className="text-[9px] uppercase font-bold text-zinc-600 block">Total Omset Penjualan</span>
            <p className="font-extrabold text-black font-mono text-[12px] mt-0.5">{formatRupiah(reportData.summary.totalRevenue)}</p>
          </div>
          <div className="p-2">
            <span className="text-[9px] uppercase font-bold text-zinc-600 block">Total Transaksi</span>
            <p className="font-extrabold text-black font-mono text-[12px] mt-0.5">{reportData.summary.totalTransactions} Transaksi</p>
          </div>
          <div className="p-2">
            <span className="text-[9px] uppercase font-bold text-zinc-600 block">Rata-rata Transaksi</span>
            <p className="font-extrabold text-black font-mono text-[12px] mt-0.5">
              {formatRupiah(reportData.summary.totalTransactions > 0 ? Math.round(reportData.summary.totalRevenue / reportData.summary.totalTransactions) : 0)}
            </p>
          </div>
        </div>

        {/* KOLOM TANDA TANGAN RESMI */}
        <div className="space-y-6 mt-6 px-4 text-[10.5px] break-inside-avoid print:break-inside-avoid">
          <div className="flex justify-between items-start">
            <div className="text-center min-w-[210px]">
              <p className="text-zinc-800">Mengetahui / Menyetujui,</p>
              <p className="font-bold text-black">{coopProfile.treasurerTitle && coopProfile.treasurerTitle !== 'null' ? coopProfile.treasurerTitle : 'Bendahara Koperasi'}</p>
              <div className="h-12"></div>
              <p className="font-bold underline text-black">
                ( {coopProfile.treasurerName && coopProfile.treasurerName !== 'null' && coopProfile.treasurerName !== '-' ? coopProfile.treasurerName : 'Ustadz Ahmad Fauzi, S.E'} )
              </p>
              <p className="text-[9.5px] text-zinc-600 font-mono mt-0.5">
                NIP: {coopProfile.treasurerNip && coopProfile.treasurerNip !== 'null' && coopProfile.treasurerNip !== '-' ? coopProfile.treasurerNip : '-'}
              </p>
            </div>

            <div className="text-center min-w-[210px]">
              <p className="text-zinc-800">{coopProfile.city && coopProfile.city !== 'null' ? coopProfile.city : 'Kota Padang'}, {formatTanggal(new Date())}</p>
              <p className="font-bold text-black">{coopProfile.headTitle && coopProfile.headTitle !== 'null' ? coopProfile.headTitle : 'Kepala Pengelola Koperasi'}</p>
              <div className="h-12"></div>
              <p className="font-bold underline text-black">
                ( {coopProfile.headName && coopProfile.headName !== 'null' && coopProfile.headName !== '-' ? coopProfile.headName : 'Ustadzah Fatimah, S.Pd'} )
              </p>
              <p className="text-[9.5px] text-zinc-600 font-mono mt-0.5">
                NIP: {coopProfile.headNip && coopProfile.headNip !== 'null' && coopProfile.headNip !== '-' ? coopProfile.headNip : '-'}
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="text-center min-w-[250px]">
              <p className="text-zinc-800">Mengetahui / Penanggung Jawab Lembaga,</p>
              <p className="font-bold text-black">{coopProfile.principalTitle && coopProfile.principalTitle !== 'null' ? coopProfile.principalTitle : 'Kepala Sekolah SD IT Permata'}</p>
              <div className="h-12"></div>
              <p className="font-bold underline text-black">
                ( {coopProfile.principalName && coopProfile.principalName !== 'null' && coopProfile.principalName !== '-' ? coopProfile.principalName : 'Ustadz Muhammad Irfan, M.Pd'} )
              </p>
              <p className="text-[9.5px] text-zinc-600 font-mono mt-0.5">
                NIP: {coopProfile.principalNip && coopProfile.principalNip !== 'null' && coopProfile.principalNip !== '-' ? coopProfile.principalNip : '19790105 200501 1 003'}
              </p>
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
        onDownload={handleExportPdf}
        onPrint={handlePrintOfficial}
      />
    </div>
  );
};

export default MonthlyReportsView;
