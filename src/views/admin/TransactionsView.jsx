import { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { formatRupiah, formatTanggal } from '../../utils/formatters';
import ReceiptModal from '../../components/pos/ReceiptModal';
import TransactionDetailModal from '../../components/transactions/TransactionDetailModal';
import {
  Receipt,
  Search,
  Printer,
  RefreshCw,
  ShoppingBag,
  Calendar,
  Eye,
  CreditCard,
  Banknote,
} from 'lucide-react';

export const TransactionsView = () => {
  const { transactions, refreshProducts, loading } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    if (refreshProducts) {
      refreshProducts();
    }
  }, []);

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((trx) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        trx.invoiceNumber.toLowerCase().includes(q) ||
        (trx.cashierName && trx.cashierName.toLowerCase().includes(q));

      let matchDate = true;
      if (dateFilter) {
        matchDate = trx.createdAt && trx.createdAt.startsWith(dateFilter);
      }

      return matchQuery && matchDate;
    });
  }, [transactions, searchQuery, dateFilter]);

  const totalVolume = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
  }, [filteredTransactions]);

  const handleOpenDetail = (trx) => {
    setSelectedTransaction(trx);
    setIsDetailModalOpen(true);
  };

  const handleOpenReceipt = (trx) => {
    setSelectedTransaction(trx);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>Riwayat & Audit Transaksi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Daftar Seluruh Penjualan Kasir
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Klik baris transaksi untuk melihat rincian barang per item atau cetak ulang struk
          </p>
        </div>

        <button
          type="button"
          onClick={() => refreshProducts && refreshProducts()}
          disabled={loading}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
          <span>{loading ? 'Memuat...' : 'Segarkan Data'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Nilai Penjualan</span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              {formatRupiah(totalVolume)}
            </h3>
            <p className="text-[11px] text-slate-400">Dari hasil filter saat ini</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-xs tracking-tight">
            Rp
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Banyak Transaksi</span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              {filteredTransactions.length} Struk Faktur
            </h3>
            <p className="text-[11px] text-slate-400">Tercatat di sistem</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Rata-rata Nilai</span>
            <h3 className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-0.5">
              {formatRupiah(filteredTransactions.length ? totalVolume / filteredTransactions.length : 0)}
            </h3>
            <p className="text-[11px] text-slate-400">Per faktur transaksi</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-xs">
            AVG
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan no faktur / nama kasir..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="w-full sm:w-60 relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            >
              Reset Tanggal
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">No. Faktur</th>
                <th className="py-3.5 px-4">Waktu Transaksi</th>
                <th className="py-3.5 px-4">Petugas Kasir</th>
                <th className="py-3.5 px-4">Metode</th>
                <th className="py-3.5 px-4 text-center">Item</th>
                <th className="py-3.5 px-4 text-right">Total Bayar</th>
                <th className="py-3.5 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Tidak ada data transaksi yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const totalQty = (trx.items || []).reduce(
                    (acc, i) => acc + (Number(i.quantity || i.qty) || 1),
                    0
                  );
                  const productCount = trx.items?.length || 0;
                  const isQris = String(trx.paymentMethod || '').toLowerCase().includes('qris');
                  const isTransfer = String(trx.paymentMethod || '').toLowerCase().includes('transfer');

                  return (
                    <tr
                      key={trx.id}
                      onClick={() => handleOpenDetail(trx)}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                      title="Klik untuk melihat rincian barang transaksi ini"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        <div className="flex items-center space-x-1.5">
                          <Receipt className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span>{trx.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {formatTanggal(trx.createdAt, true)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{trx.cashierName}</td>
                      <td className="py-3.5 px-4">
                        {isQris ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold inline-flex items-center space-x-1">
                            <CreditCard className="w-3 h-3 text-blue-600" />
                            <span>QRIS</span>
                          </span>
                        ) : isTransfer ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold inline-flex items-center space-x-1">
                            <CreditCard className="w-3 h-3 text-purple-600" />
                            <span>Transfer</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center space-x-1">
                            <Banknote className="w-3 h-3 text-emerald-600" />
                            <span>Tunai</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 group-hover:bg-white text-slate-700 border border-slate-200 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors">
                          <ShoppingBag className="w-3 h-3 text-emerald-600" />
                          <span>{productCount} Produk </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono text-xs sm:text-sm">
                        {formatRupiah(trx.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(trx);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center space-x-1 transition-colors cursor-pointer"
                            title="Lihat Rincian Item Transaksi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Rincian</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReceipt(trx);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold inline-flex items-center space-x-1 transition-colors cursor-pointer"
                            title="Cetak Struk Thermal"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span>Struk</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        transaction={selectedTransaction}
        onPrintReceipt={handleOpenReceipt}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default TransactionsView;
