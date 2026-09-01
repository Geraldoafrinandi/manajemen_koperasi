import React, { useMemo } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import PermataLogo from './PermataLogo';
import { formatRupiah, formatTanggal, formatTanggalShort } from '../../utils/formatters';
import { flattenTransactionsToItems, aggregateMonthlyDailySales } from '../../utils/exportPdf';

const paginateReportData = (rows, isDaily) => {
  if (!rows || rows.length === 0) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        rows: [],
        isFirstPage: true,
        isLastPage: true,
        startIndex: 0,
      },
    ];
  }

  const singlePageMax = isDaily ? 25 : 18;
  if (rows.length <= singlePageMax) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        rows: rows,
        isFirstPage: true,
        isLastPage: true,
        startIndex: 0,
      },
    ];
  }

  const firstPageCapacity = isDaily ? 28 : 22;
  const middlePageCapacity = isDaily ? 34 : 28;
  const lastPageCapacityWithSignatures = isDaily ? 25 : 18;

  const pages = [];
  let currentIndex = 0;
  let pageNum = 1;

  while (currentIndex < rows.length) {
    const isFirst = pageNum === 1;
    const remaining = rows.length - currentIndex;

    let capacity = isFirst ? firstPageCapacity : middlePageCapacity;

    if (!isFirst && remaining <= lastPageCapacityWithSignatures) {
      capacity = remaining;
    } else if (remaining > capacity && remaining - capacity < 5) {
      capacity = Math.max(10, capacity - 4);
    }

    const chunk = rows.slice(currentIndex, currentIndex + capacity);
    const isLast = currentIndex + chunk.length >= rows.length;

    pages.push({
      pageNumber: pageNum,
      rows: chunk,
      isFirstPage: isFirst,
      isLastPage: isLast,
      startIndex: currentIndex,
    });

    currentIndex += chunk.length;
    pageNum++;
  }

  const totalPages = pages.length;
  pages.forEach((p) => (p.totalPages = totalPages));
  return pages;
};

export const PdfPreviewModal = ({
  isOpen,
  onClose,
  reportData,
  coopProfile = {},
  periodLabel = '',
  reportType = 'MONTHLY',
  onDownload,
  onPrint,
}) => {
  if (!isOpen || !reportData) return null;

  const isDaily = reportType === 'DAILY';
  const transactions = reportData.transactions || [];

  const itemRows = useMemo(() => flattenTransactionsToItems(transactions), [transactions]);
  const dailyRecapRows = useMemo(() => aggregateMonthlyDailySales(transactions), [transactions]);

  const totalOmset =
    reportData.summary?.totalRevenue ||
    (isDaily
      ? itemRows.reduce((sum, r) => sum + (r.subtotal || 0), 0)
      : dailyRecapRows.reduce((sum, r) => sum + r.totalRevenue, 0));

  const summary = reportData.summary || {};
  const totalCost = Number(summary.totalCost || 0);
  const netProfit = Number(summary.netProfit || totalOmset - totalCost);
  const margin =
    summary.profitMargin ||
    (totalOmset > 0 ? ((netProfit / totalOmset) * 100).toFixed(1) : '0.0');

  const pages = useMemo(() => {
    const rawRows = isDaily ? itemRows : dailyRecapRows;
    return paginateReportData(rawRows, isDaily);
  }, [itemRows, dailyRecapRows, isDaily]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 no-print">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Preview {isDaily ? 'Laporan Penjualan Harian' : 'Laporan Rekap Bulanan'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Format Resmi Kop Surat A4 • Periode: <strong className="text-emerald-800">{periodLabel}</strong> • Total{' '}
                <strong className="text-slate-800">{pages.length} Halaman</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="Tutup Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-3 sm:p-6 bg-slate-200/80 overflow-y-auto max-h-[74vh] flex flex-col items-center space-y-6">
          {pages.map((page, pIdx) => (
            <div
              key={pIdx}
              className="w-full max-w-[780px] bg-white text-black px-8 sm:px-10 py-7 sm:py-8 shadow-xl rounded-xs border border-slate-300 flex flex-col justify-between min-h-[960px] text-xs font-serif relative"
              style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
            >
              <div className="space-y-3.5">
                {page.isFirstPage ? (
                  <>
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
                          {coopProfile.name && coopProfile.name !== 'null'
                            ? coopProfile.name
                            : 'KOPERASI UNIT SEKOLAH "PERMATA KITA"'}
                        </h1>
                        <p className="text-[9.5px] text-zinc-800 pt-0.5 leading-tight">
                          {coopProfile.address && coopProfile.address !== 'null'
                            ? coopProfile.address
                            : 'Jl. SMP 21 Padang, Kota Padang'}
                          {coopProfile.city &&
                          coopProfile.city !== 'null' &&
                          !String(coopProfile.address || '').includes(coopProfile.city)
                            ? `, ${coopProfile.city}`
                            : ''}
                        </p>
                        {coopProfile.phone &&
                          coopProfile.phone !== '-' &&
                          coopProfile.phone !== 'null' && (
                            <p className="text-[9px] text-zinc-700 leading-tight">
                              Telepon / Faks. {coopProfile.phone}
                            </p>
                          )}
                        <div className="text-[9px] text-zinc-700 pt-0.5 flex items-center justify-center space-x-4 leading-tight">
                          {coopProfile.website &&
                            coopProfile.website !== '-' &&
                            coopProfile.website !== 'null' && (
                              <span>Laman: {coopProfile.website}</span>
                            )}
                          {coopProfile.email &&
                            coopProfile.email !== '-' &&
                            coopProfile.email !== 'null' && (
                              <span>Surel: {coopProfile.email}</span>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="border-b-[2.5px] border-black mt-1"></div>
                    <div className="border-b-[0.8px] border-black mt-[1.5px] mb-3"></div>

                    <div className="text-center mb-2.5">
                      <h3 className="text-[13px] font-extrabold uppercase underline tracking-wide text-slate-900">
                        {isDaily
                          ? 'LAPORAN PENJUALAN & TRANSAKSI HARIAN'
                          : 'LAPORAN REKAPITULASI PENJUALAN & KEUANGAN BULANAN'}
                      </h3>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {isDaily ? 'Hari / Tanggal' : 'Bulan / Periode'}:{' '}
                        <strong className="text-black">{periodLabel}</strong> | Dicetak:{' '}
                        {formatTanggal(new Date(), true)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="pb-2 mb-2 border-b border-slate-300 flex items-center justify-between text-[10px] text-zinc-600 font-sans">
                    <div>
                      <span className="font-bold text-black">
                        {coopProfile.name || 'Koperasi SD IT Permata Kita'}
                      </span>{' '}
                      • Lanjutan {isDaily ? 'Laporan Harian' : 'Laporan Bulanan'} ({periodLabel})
                    </div>
                    <div className="font-semibold">
                      Halaman {page.pageNumber} dari {page.totalPages}
                    </div>
                  </div>
                )}

                {isDaily ? (
                  <table className="w-full text-left text-[9.5px] border-collapse border border-black bg-white">
                    <thead className="bg-white font-bold border-b border-black text-black">
                      <tr>
                        <th className="py-1 px-1 border border-black text-center w-[30px]">NO</th>
                        <th className="py-1 px-2 border border-black text-left w-[110px]">No. Faktur</th>
                        <th className="py-1 px-2 border border-black text-center w-[80px]">Waktu</th>
                        <th className="py-1 px-2 border border-black text-left">Rincian Barang</th>
                        <th className="py-1 px-1 border border-black text-center w-[45px]">QTY</th>
                        <th className="py-1 px-1 border border-black text-center w-[50px]">Metode</th>
                        <th className="py-1 px-2 border border-black text-left w-[70px]">Kasir</th>
                        <th className="py-1 px-2 border border-black text-right w-[85px]">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {page.rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
                            className="py-4 text-center border border-black text-slate-500 italic"
                          >
                            Belum ada data barang terjual pada periode {periodLabel}.
                          </td>
                        </tr>
                      ) : (
                        page.rows.map((r, idx) => (
                          <tr key={idx} className="bg-white text-black">
                            <td className="py-1 px-1 border border-black text-center text-zinc-800">
                              {page.startIndex + idx + 1}
                            </td>
                            <td className="py-1 px-2 border border-black font-mono font-bold whitespace-nowrap text-black">
                              {r.invoiceNumber}
                            </td>
                            <td className="py-1 px-2 border border-black text-center whitespace-nowrap text-zinc-700">
                              {formatTanggalShort(r.createdAt, true)}
                            </td>
                            <td className="py-1 px-2 border border-black text-black font-medium">
                              {r.productName}
                            </td>
                            <td className="py-1 px-1 border border-black text-center font-mono">
                              {r.quantity} {r.unit || 'pcs'}
                            </td>
                            <td className="py-1 px-1 border border-black text-center uppercase font-bold text-zinc-800 text-[8px] whitespace-nowrap">
                              {r.paymentMethod || 'CASH'}
                            </td>
                            <td className="py-1 px-2 border border-black truncate text-zinc-800 text-[8.5px]">
                              {r.cashierName || 'Kasir'}
                            </td>
                            <td className="py-1 px-2 border border-black text-right font-mono font-bold text-black whitespace-nowrap">
                              {formatRupiah(r.subtotal)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {page.isLastPage && (
                      <tfoot className="bg-white font-bold border-t border-black text-black">
                        <tr>
                          <td
                            colSpan="7"
                            className="py-1.5 px-2 text-right border border-black font-bold text-[9.5px]"
                          >
                            TOTAL:
                          </td>
                          <td className="py-1.5 px-2 text-right border border-black font-mono font-bold text-[9.5px]">
                            {formatRupiah(totalOmset)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                ) : (
                  <div className="space-y-4">
                    <table className="w-full text-left text-[9.5px] border-collapse border border-black bg-white">
                      <thead className="bg-white font-bold border-b border-black text-black">
                        <tr>
                          <th className="py-1 px-1 border border-black text-center w-[30px]">NO</th>
                          <th className="py-1 px-2.5 border border-black text-left w-[140px]">
                            Tanggal Penjualan
                          </th>
                          <th className="py-1 px-2 border border-black text-center w-[95px]">
                            Jml Transaksi
                          </th>
                          <th className="py-1 px-2 border border-black text-center w-[90px]">
                            Total Barang
                          </th>
                          <th className="py-1 px-2 border border-black text-center w-[70px]">
                            Metode
                          </th>
                          <th className="py-1 px-2.5 border border-black text-left">Petugas Kasir</th>
                          <th className="py-1 px-2.5 border border-black text-right w-[115px]">
                            Total Omset (Rp)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {page.rows.length === 0 ? (
                          <tr>
                            <td
                              colSpan="7"
                              className="py-4 text-center border border-black text-slate-500 italic"
                            >
                              Belum ada transaksi penjualan pada bulan {periodLabel}.
                            </td>
                          </tr>
                        ) : (
                          page.rows.map((r, idx) => (
                            <tr key={idx} className="bg-white text-black">
                              <td className="py-1 px-1 border border-black text-center text-zinc-800">
                                {page.startIndex + idx + 1}
                              </td>
                              <td className="py-1 px-2.5 border border-black font-bold whitespace-nowrap text-black">
                                {formatTanggal(r.date)}
                              </td>
                              <td className="py-1 px-2 border border-black text-center whitespace-nowrap text-zinc-800">
                                {r.transactionCount} Transaksi
                              </td>
                              <td className="py-1 px-2 border border-black text-center font-mono text-zinc-800">
                                {r.totalQty} pcs
                              </td>
                              <td className="py-1 px-2 border border-black text-center uppercase font-bold text-zinc-800 text-[8.5px] whitespace-nowrap">
                                {r.topPaymentMethod}
                              </td>
                              <td className="py-1 px-2 border border-black truncate text-zinc-800">
                                {r.cashiers}
                              </td>
                              <td className="py-1 px-2.5 border border-black text-right font-mono font-bold text-black whitespace-nowrap">
                                {formatRupiah(r.totalRevenue)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {page.isLastPage && (
                        <tfoot className="bg-white font-bold border-t border-black text-black">
                          <tr>
                            <td
                              colSpan="6"
                              className="py-1.5 px-2.5 text-right border border-black font-bold text-[9.5px]"
                            >
                              TOTAL:
                            </td>
                            <td className="py-1.5 px-2.5 text-right border border-black font-mono font-bold text-[9.5px]">
                              {formatRupiah(totalOmset)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>

                    {page.isLastPage && (
                      <table className="w-full text-left text-[9.5px] border-collapse border border-black bg-white">
                        <thead className="bg-white font-bold border-b border-black text-black">
                          <tr>
                            <th
                              colSpan="4"
                              className="py-1.5 px-2.5 border border-black text-center uppercase tracking-wider font-extrabold"
                            >
                              RINGKASAN PENDAPATAN & KEUNTUNGAN KOPERASI
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white font-serif">
                          <tr>
                            <td className="py-1.5 px-2.5 border border-black font-bold w-1/4">
                              Total Pendapatan (Penjualan)
                            </td>
                            <td className="py-1.5 px-2.5 border border-black font-mono font-extrabold text-right w-1/4">
                              {formatRupiah(totalOmset)}
                            </td>
                            <td className="py-1.5 px-2.5 border border-black font-bold w-1/4">
                              Total Modal Barang (Harga Beli)
                            </td>
                            <td className="py-1.5 px-2.5 border border-black font-mono font-bold text-right w-1/4">
                              {formatRupiah(totalCost)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-2.5 border border-black font-bold">
                              Total Keuntungan Bersih
                            </td>
                            <td className="py-1.5 px-2.5 border border-black font-mono font-extrabold text-right text-black">
                              {formatRupiah(netProfit)}
                            </td>
                            <td className="py-1.5 px-2.5 border border-black font-bold">
                              Persentase Keuntungan
                            </td>
                            <td className="py-1.5 px-2.5 border border-black font-mono font-bold text-right">
                              {margin}%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 space-y-3">
                {page.isLastPage && (
                  <div className="space-y-3.5 text-[10px]">
                    <div className="grid grid-cols-2 gap-10">
                      <div className="text-center">
                        <p className="text-zinc-800">Mengetahui / Menyetujui,</p>
                        <p className="font-bold text-black">
                          {coopProfile.treasurerTitle && coopProfile.treasurerTitle !== 'null'
                            ? coopProfile.treasurerTitle
                            : 'Bendahara Koperasi'}
                        </p>
                        <div className="h-11"></div>
                        <p className="font-bold underline text-black">
                          ({' '}
                          {coopProfile.treasurerName &&
                          coopProfile.treasurerName !== 'null' &&
                          coopProfile.treasurerName !== '-'
                            ? coopProfile.treasurerName
                            : 'Tidak Diketahui'}{' '}
                          )
                        </p>
                        <p className="text-[9px] text-zinc-600 font-mono mt-0.5">
                          NIP:{' '}
                          {coopProfile.treasurerNip &&
                          coopProfile.treasurerNip !== 'null' &&
                          coopProfile.treasurerNip !== '-'
                            ? coopProfile.treasurerNip
                            : '-'}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-zinc-800">
                          {coopProfile.city && coopProfile.city !== 'null'
                            ? coopProfile.city
                            : 'Kota Padang'}
                          , {formatTanggal(new Date())}
                        </p>
                        <p className="font-bold text-black">
                          {coopProfile.headTitle && coopProfile.headTitle !== 'null'
                            ? coopProfile.headTitle
                            : 'Kepala Pengelola Koperasi'}
                        </p>
                        <div className="h-11"></div>
                        <p className="font-bold underline text-black">
                          ({' '}
                          {coopProfile.headName &&
                          coopProfile.headName !== 'null' &&
                          coopProfile.headName !== '-'
                            ? coopProfile.headName
                            : 'Tidak Diketahui'}{' '}
                          )
                        </p>
                        <p className="text-[9px] text-zinc-600 font-mono mt-0.5">
                          NIP:{' '}
                          {coopProfile.headNip &&
                          coopProfile.headNip !== 'null' &&
                          coopProfile.headNip !== '-'
                            ? coopProfile.headNip
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center pt-0.5">
                      <div className="text-center w-80">
                        <p className="text-zinc-800">Mengetahui / Penanggung Jawab Lembaga,</p>
                        <p className="font-bold text-black">
                          {coopProfile.principalTitle && coopProfile.principalTitle !== 'null'
                            ? coopProfile.principalTitle
                            : 'Kepala Sekolah SD IT Permata'}
                        </p>
                        <div className="h-11"></div>
                        <p className="font-bold underline text-black">
                          ({' '}
                          {coopProfile.principalName &&
                          coopProfile.principalName !== 'null' &&
                          coopProfile.principalName !== '-'
                            ? coopProfile.principalName
                            : 'Tidak Diketahui'}{' '}
                          )
                        </p>
                        <p className="text-[9px] text-zinc-600 font-mono mt-0.5">
                          NIP:{' '}
                          {coopProfile.principalNip &&
                          coopProfile.principalNip !== 'null' &&
                          coopProfile.principalNip !== '-'
                            ? coopProfile.principalNip
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-zinc-500 font-sans">
                  <span>Dokumen Resmi Koperasi SD IT Permata Kita</span>
                  <span>
                    Halaman {page.pageNumber} dari {page.totalPages}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 shrink-0">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Dokumen siap dicetak ke printer resmi ({pages.length} Halaman A4) atau diunduh PDF
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
