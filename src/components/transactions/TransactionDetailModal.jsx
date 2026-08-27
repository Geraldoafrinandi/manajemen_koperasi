import { useState } from 'react';
import Modal from '../common/Modal';
import { formatRupiah, formatTanggal } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  Receipt,
  Calendar,
  User,
  CreditCard,
  Printer,
  Package,
  CheckCircle2,
  Banknote,
  Barcode,
  Copy,
  Check,
  QrCode,
  ArrowRightLeft,
  ShoppingBag,
  Percent,
} from 'lucide-react';

export const TransactionDetailModal = ({
  isOpen,
  onClose,
  transaction,
  onPrintReceipt,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const items = transaction.items || [];
  const totalItemQty = items.reduce(
    (sum, item) => sum + (Number(item.quantity || item.qty) || 0),
    0
  );

  const handleCopyInvoice = () => {
    if (transaction.invoiceNumber) {
      navigator.clipboard.writeText(transaction.invoiceNumber);
      setCopied(true);
      toast.success(`No. Faktur ${transaction.invoiceNumber} disalin!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPaymentBadge = (method) => {
    const m = String(method || '').toLowerCase();
    if (m === 'qris') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
          <QrCode className="w-3.5 h-3.5 text-blue-600" />
          <span>QRIS</span>
        </span>
      );
    }
    if (m === 'transfer') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
          <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
          <span>Transfer</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
        <span>Tunai</span>
      </span>
    );
  };

  const grandTotal = Number(transaction.grandTotal || transaction.total || 0);
  const rawSubtotal = Number(
    transaction.subtotal ||
      (transaction.items || []).reduce(
        (sum, i) =>
          sum +
          (Number(i.sellPrice || i.price || i.selling_price) || 0) *
            (Number(i.quantity || i.qty) || 1),
        0
      ) ||
      grandTotal
  );

  let discountTotal = Number(transaction.discountTotal || transaction.discount || 0);
  if (discountTotal <= 0 && rawSubtotal > grandTotal) {
    discountTotal = rawSubtotal - grandTotal;
  }

  const subtotal = rawSubtotal > grandTotal ? rawSubtotal : grandTotal + discountTotal;

  const paidAmount = Number(
    transaction.cashGiven || transaction.paidAmount || transaction.paid || grandTotal
  );
  const changeAmount = Number(
    transaction.change || (paidAmount > grandTotal ? paidAmount - grandTotal : 0)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Transaksi Penjualan"
      subtitle="Dokumen bukti transaksi resmi Koperasi SD IT Permata"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-left -mt-1">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              <span>Nomor Faktur Penjualan</span>
            </span>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-mono font-extrabold text-slate-900 tracking-tight">
                {transaction.invoiceNumber}
              </h3>
              <button
                type="button"
                onClick={handleCopyInvoice}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-xs font-semibold flex items-center space-x-1"
                title="Salin No. Faktur"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className="text-[11px]">{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lunas / Berhasil</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Waktu</span>
            </span>
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {formatTanggal(transaction.createdAt, true)}
            </p>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>Petugas Kasir</span>
            </span>
            <p className="text-xs font-bold text-slate-800 truncate" title={transaction.cashierName}>
              {transaction.cashierName || 'Kasir'}
            </p>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <CreditCard className="w-3 h-3 text-slate-400" />
              <span>Metode</span>
            </span>
            <div className="pt-0.5">{getPaymentBadge(transaction.paymentMethod)}</div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <ShoppingBag className="w-3 h-3 text-slate-400" />
              <span>Kuantitas</span>
            </span>
            <p className="text-xs font-bold text-slate-800">
              {items.length} Jenis ({totalItemQty} Pcs)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Package className="w-4 h-4 text-slate-600" />
              <span>Daftar Barang Belanja</span>
            </h4>
            <span className="text-xs font-semibold text-slate-500">
              {items.length} item • {totalItemQty} unit
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10.5px] sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3.5 w-10 text-center">No</th>
                    <th className="py-2.5 px-3.5">Nama Barang</th>
                    <th className="py-2.5 px-3.5 text-right">Harga Satuan</th>
                    <th className="py-2.5 px-3.5 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3.5 text-center">Diskon</th>
                    <th className="py-2.5 px-3.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        <ShoppingBag className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <span>Tidak ada rincian item barang.</span>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const qty = Number(item.quantity || item.qty) || 1;
                      const price = Number(item.price || item.sellPrice || item.selling_price) || 0;
                      const discount = Number(item.discount || item.itemDiscount) || 0;
                      const itemSubtotal = Number(item.subtotal || item.total) || (price - discount) * qty;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3.5">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">
                              {item.name || item.productName || item.product_name || 'Barang'}
                            </p>
                            {item.barcode && (
                              <p className="text-[10px] font-mono text-slate-400 flex items-center space-x-1 mt-0.5">
                                <Barcode className="w-3 h-3 text-slate-400" />
                                <span>{item.barcode}</span>
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono text-slate-700">
                            {formatRupiah(price)}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold font-mono text-xs">
                              {qty}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center font-mono">
                            {discount > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                                -{formatRupiah(discount * qty)}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-extrabold text-slate-900 text-xs sm:text-sm">
                            {formatRupiah(itemSubtotal)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
            <span>Total Belanja (Subtotal):</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {formatRupiah(subtotal)}
            </span>
          </div>

          {discountTotal > 0 && (
            <div className="flex justify-between items-center text-xs text-rose-600 font-semibold">
              <span className="flex items-center space-x-1">
                <Percent className="w-3.5 h-3.5 text-rose-500" />
                <span>Potongan Diskon:</span>
              </span>
              <span className="font-mono font-bold text-rose-600">
                -{formatRupiah(discountTotal)}
              </span>
            </div>
          )}

          <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Total Tagihan (Grand Total)
              </span>
              <span className="text-[10px] text-slate-400">Sudah termasuk potongan diskon</span>
            </div>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-700">
              {formatRupiah(grandTotal)}
            </span>
          </div>

          <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Uang Diterima:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatRupiah(paidAmount)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Kembalian:</span>
              <span className="font-mono font-bold text-emerald-700">
                {formatRupiah(changeAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            Koperasi SD IT Permata • Bukti Pembayaran Resmi
          </p>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {onPrintReceipt && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPrintReceipt(transaction);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk Thermal (58/80mm)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TransactionDetailModal;
