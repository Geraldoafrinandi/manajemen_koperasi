import React from 'react';
import { X, Download, Printer, FileText, CheckCircle2 } from 'lucide-react';
import PermataLogo from './PermataLogo';
import { formatRupiah, formatTanggal, formatTanggalShort } from '../../utils/formatters';

export const PdfPreviewModal = ({
  isOpen,
  onClose,
  reportData,
  coopProfile = {},
  periodLabel = '',
  onDownload,
  onPrint,
}) => {
  if (!isOpen || !reportData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 no-print">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Preview Dokumen Laporan Resmi
              </h2>
              <p className="text-[11px] text-slate-500">
                Format Resmi Kop Surat A4 • Periode: <strong className="text-emerald-800">{periodLabel}</strong>
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

        <div className="flex-1 p-3 sm:p-6 bg-slate-200/70 overflow-y-auto max-h-[74vh] flex justify-center">
          <div
            className="w-full max-w-[780px] bg-white text-black p-6 sm:p-8 shadow-xl rounded-xs border border-slate-300/80 flex flex-col justify-between min-h-[980px] text-xs font-serif"
            style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
          >
            <div>
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

              <div className="text-center mb-3">
                <h3 className="text-[13px] font-extrabold uppercase underline tracking-wide text-slate-900">
                  LAPORAN REKAP KEUANGAN & PENJUALAN BULANAN
                </h3>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  Periode: <strong className="text-black">{periodLabel}</strong> | Dicetak: {formatTanggal(new Date(), true)}
                </p>
              </div>

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

              <div className="grid grid-cols-3 border border-black bg-zinc-50/50 mb-6 divide-x divide-black text-center">
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
            </div>

            <div className="pt-4 px-4 space-y-6 text-[10.5px]">
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
        </div>

        {/* Modal Footer: Action Buttons (Cetak, Download, Tutup) */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Format tabel, kop surat, dan tanda tangan siap dicetak atau diunduh</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              Tutup
            </button>

            <button
              onClick={onPrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all shadow-xs"
              title="Cetak Dokumen Resmi ke Printer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Cetak</span>
            </button>

            <button
              onClick={onDownload}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all shadow-xs"
              title="Download File PDF ke Komputer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
