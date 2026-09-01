import { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah, formatTanggal } from '../../utils/formatters';
import ReceiptModal from '../../components/pos/ReceiptModal';
import TransactionDetailModal from '../../components/transactions/TransactionDetailModal';
import {
  Clock,
  Printer,
  Search,
  RefreshCw,
  Receipt,
  UserCheck,
  Eye,
  Calendar,
  X,
  TrendingUp,
  Banknote,
  QrCode,
  CreditCard,
} from 'lucide-react';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ShiftHistoryView = () => {
  const { transactions, refreshProducts, loading } = useProducts();
  const { user } = useAuth();

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('today');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [paymentFilter, setPaymentFilter] = useState('all');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    if (refreshProducts) {
      refreshProducts();
    }
  }, []);

  const applyPreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      const today = getLocalDateString(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now.getTime() - 86400000);
      const yStr = getLocalDateString(yesterday);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 6 * 86400000);
      setStartDate(getLocalDateString(sevenDaysAgo));
      setEndDate(getLocalDateString(now));
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(getLocalDateString(firstDay));
      setEndDate(getLocalDateString(now));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleManualDateChange = (start, end) => {
    setDatePreset('custom');
    if (start !== undefined) setStartDate(start);
    if (end !== undefined) setEndDate(end);
  };

  const handleResetFilter = () => {
    applyPreset('today');
    setSearchQuery('');
    setPaymentFilter('all');
  };

  const myCashierTransactions = useMemo(() => {
    if (!user) return [];
    const list = transactions || [];

    const uId = String(user.id || '').trim();
    const uName = (user.name || '').toLowerCase().trim();
    const uUsername = (user.username || '').toLowerCase().trim();

    return list.filter((t) => {
      const tCashierId = String(t.cashierId || t.userId || t.user_id || '').trim();
      const tCashierName = (t.cashierName || '').toLowerCase().trim();

      if (uId && tCashierId && (tCashierId === uId || tCashierId === String(user.user_id))) {
        return true;
      }
      if (uName && tCashierName && (tCashierName.includes(uName) || uName.includes(tCashierName))) {
        return true;
      }
      if (uUsername && tCashierName && (tCashierName.includes(uUsername) || uUsername.includes(tCashierName))) {
        return true;
      }
      if (!tCashierId && (!tCashierName || tCashierName === 'petugas kasir' || tCashierName === 'kasir' || tCashierName === 'kasir koperasi')) {
        return true;
      }
      return false;
    });
  }, [transactions, user]);

  const scopedTransactions = useMemo(() => {
    return myCashierTransactions.filter((t) => {
      if (startDate || endDate) {
        if (!t.createdAt) return false;
        const d = new Date(t.createdAt);
        if (isNaN(d.getTime())) return false;
        const itemDateStr = getLocalDateString(d);

        if (startDate && endDate) {
          if (itemDateStr < startDate || itemDateStr > endDate) return false;
        } else if (startDate) {
          if (itemDateStr < startDate) return false;
        } else if (endDate) {
          if (itemDateStr > endDate) return false;
        }
      }

      if (paymentFilter !== 'all') {
        const method = (t.paymentMethod || '').toLowerCase();
        if (paymentFilter === 'cash' && !method.includes('cash') && !method.includes('tunai')) return false;
        if (paymentFilter === 'qris' && !method.includes('qris')) return false;
        if (paymentFilter === 'transfer' && !method.includes('transfer')) return false;
      }

      return true;
    });
  }, [myCashierTransactions, startDate, endDate, paymentFilter]);

  const shiftStats = useMemo(() => {
    const totalRevenue = scopedTransactions.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
    const totalItems = scopedTransactions.reduce(
      (sum, t) => sum + (t.items?.reduce((acc, i) => acc + (i.quantity || 0), 0) || 0),
      0
    );

    const cashRevenue = scopedTransactions
      .filter((t) => (t.paymentMethod || '').toLowerCase().includes('cash') || (t.paymentMethod || '').toLowerCase().includes('tunai'))
      .reduce((sum, t) => sum + (t.grandTotal || 0), 0);

    const nonCashRevenue = totalRevenue - cashRevenue;

    return {
      totalRevenue,
      totalTransactions: scopedTransactions.length,
      totalItems,
      cashRevenue,
      nonCashRevenue,
    };
  }, [scopedTransactions]);

  const filteredTransactions = useMemo(() => {
    return scopedTransactions.filter((trx) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        trx.invoiceNumber?.toLowerCase().includes(q) ||
        trx.items?.some((i) => i.name?.toLowerCase().includes(q))
      );
    });
  }, [scopedTransactions, searchQuery]);

  const handleOpenReceipt = (trx) => {
    setSelectedTransaction(trx);
    setIsReceiptModalOpen(true);
  };

  const activeDateLabel = useMemo(() => {
    if (datePreset === 'today') return 'Hari Ini (' + formatTanggal(new Date()) + ')';
    if (datePreset === 'yesterday') return 'Kemarin';
    if (datePreset === '7days') return '7 Hari Terakhir';
    if (datePreset === 'this_month') return 'Bulan Ini';
    if (datePreset === 'all' || (!startDate && !endDate)) return 'Semua Waktu';
    if (startDate && endDate) {
      if (startDate === endDate) return formatTanggal(new Date(startDate));
      return `${formatTanggal(new Date(startDate))} s/d ${formatTanggal(new Date(endDate))}`;
    }
    if (startDate) return `Mulai ${formatTanggal(new Date(startDate))}`;
    if (endDate) return `Sampai ${formatTanggal(new Date(endDate))}`;
    return 'Kustom Tanggal';
  }, [datePreset, startDate, endDate]);

  const isFilterActive = datePreset !== 'today' || searchQuery.trim() !== '' || paymentFilter !== 'all';

  const renderPaymentBadge = (method) => {
    const m = String(method || '').toLowerCase();
    if (m.includes('qris')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold shadow-2xs">
          <QrCode className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>QRIS</span>
        </span>
      );
    }
    if (m.includes('transfer')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold shadow-2xs">
          <CreditCard className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>Transfer</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
        <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Tunai</span>
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Aktivitas Shift & Laporan Penjualan
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {user?.name || 'Petugas Kasir'}
            </span>
            <span>•</span>
            <span className="inline-flex items-center font-medium text-slate-600">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Filter: <strong className="ml-1 text-slate-800 font-semibold">{activeDateLabel}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => refreshProducts && refreshProducts()}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-2xs cursor-pointer"
            title="Segarkan data transaksi terbaru dari server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{loading ? 'Memuat...' : 'Segarkan Data'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between relative overflow-hidden">
          <div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Total Omset Kasir ({activeDateLabel})
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 font-mono tracking-tight">
              {formatRupiah(shiftStats.totalRevenue)}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
              <span className="text-emerald-700 font-semibold">Tunai: {formatRupiah(shiftStats.cashRevenue)}</span>
              <span>•</span>
              <span className="text-sky-700 font-semibold">Non-Tunai: {formatRupiah(shiftStats.nonCashRevenue)}</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              Total Transaksi
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 font-mono tracking-tight">
              {shiftStats.totalTransactions} <span className="text-sm font-normal text-slate-500">Struk</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Rata-rata: {formatRupiah(shiftStats.totalTransactions > 0 ? Math.round(shiftStats.totalRevenue / shiftStats.totalTransactions) : 0)} / transaksi
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              Total Produk Terjual
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 font-mono tracking-tight">
              {shiftStats.totalItems} <span className="text-sm font-normal text-slate-500">Pcs</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Kuantitas seluruh barang laku
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: 'yesterday', label: 'Kemarin' },
              { id: '7days', label: '7 Hari' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'all', label: 'Semua' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  datePreset === p.id
                    ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer self-end sm:self-auto"
              title="Reset semua filter ke pengaturan default"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no faktur / nama item..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
            />
          </div>

          <div className="sm:col-span-5 flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleManualDateChange(e.target.value, undefined)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                title="Mulai Tanggal"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold shrink-0">s/d</span>
            <div className="relative flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleManualDateChange(undefined, e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                title="Sampai Tanggal"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium cursor-pointer"
            >
              <option value="all">Semua Metode Bayar</option>
              <option value="cash">Tunai (Cash)</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer Bank</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Faktur</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 text-center">Jumlah Barang</th>
                <th className="py-3 px-4 text-right">Total Transaksi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 space-y-2">
                    <p className="text-xs font-medium text-slate-600">
                      Tidak ada transaksi penjualan untuk kasir <strong className="text-slate-800">{user?.name || 'Kasir'}</strong> pada periode <strong className="text-emerald-700">{activeDateLabel}</strong>.
                    </p>
                    {isFilterActive && (
                      <button
                        type="button"
                        onClick={handleResetFilter}
                        className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer inline-block mt-1"
                      >
                        Reset filter untuk melihat seluruh transaksi
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const itemsCount = (trx.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);

                  return (
                    <tr
                      key={trx.id}
                      onClick={() => {
                        setSelectedTransaction(trx);
                        setIsDetailModalOpen(true);
                      }}
                      className="hover:bg-emerald-50/50 transition-colors cursor-pointer group"
                      title="Klik untuk melihat rincian barang per item"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        <div className="flex items-center space-x-1">
                          <Receipt className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span>{trx.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {formatTanggal(trx.createdAt, true)}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderPaymentBadge(trx.paymentMethod)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600">
                        {itemsCount} Pcs
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 font-mono">
                        {formatRupiah(trx.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransaction(trx);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                            title="Lihat Rincian Item"
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
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                            title="Cetak Ulang Struk"
                          >
                            <Printer className="w-3.5 h-3.5" />
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
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onPrintReceipt={handleOpenReceipt}
      />

      {selectedTransaction && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
};

export default ShiftHistoryView;
