import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../../context/ToastContext';
import transactionService from '../../services/transactionService';
import { formatRupiah, formatThousand, parseThousand } from '../../utils/formatters';
import {
  Banknote,
  QrCode,
  CreditCard,
  Tag,
  Check,
  Percent,
} from 'lucide-react';

export const PaymentModal = ({ isOpen, onClose, onTransactionComplete }) => {
  const {
    items,
    subtotal,
    discount,
    setDiscount,
    grandTotal,
    totalItems,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const { refreshProducts } = useProducts();
  const toast = useToast();

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashPaid, setCashPaid] = useState('');
  const [showDiscountField, setShowDiscountField] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const quickCashPresets = [
    { label: 'Uang Pas', value: grandTotal },
    { label: '10.000', value: 10000 },
    { label: '20.000', value: 20000 },
    { label: '50.000', value: 50000 },
    { label: '100.000', value: 100000 },
  ];

  useEffect(() => {
    if (isOpen) {
      setCashPaid('');
      setPaymentMethod('Cash');
      setShowDiscountField(Boolean(discount > 0));
    }
  }, [isOpen]);

  const cashPaidNum = parseThousand(cashPaid);
  const change = Math.max(0, cashPaidNum - grandTotal);
  const isCashInsufficient = paymentMethod === 'Cash' && cashPaidNum < grandTotal;

  const handleDiscountChange = (val) => {
    const num = Math.min(subtotal, Math.max(0, parseThousand(val)));
    setDiscount(num);
  };

  const handleProcessCheckout = async () => {
    if (items.length === 0) return;

    if (paymentMethod === 'Cash' && cashPaidNum < grandTotal) {
      toast.error('Nominal uang tunai yang dimasukkan masih kurang.');
      return;
    }

    setIsProcessing(true);
    try {
      const transaction = await transactionService.createTransaction({
        items,
        discount: Number(discount) || 0,
        paymentMethod,
        cashPaid: paymentMethod === 'Cash' ? cashPaidNum : grandTotal,
        grandTotal,
        cashier: user,
      });

      toast.success('Pembayaran berhasil diselesaikan.');
      clearCart();
      if (refreshProducts) {
        await refreshProducts();
      }
      onClose();
      if (onTransactionComplete) {
        onTransactionComplete(transaction);
      }
    } catch (error) {
      toast.error(error.message || 'Gagal memproses transaksi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pembayaran Kasir"
      subtitle="Pilih metode dan selesaikan transaksi"
      maxWidth="max-w-md"
    >
      <div className="space-y-3.5 pt-1">
        <div className="text-center py-3.5 px-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80">
          <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800">
            Total Pembayaran
          </span>
          <div className="text-3xl font-black text-emerald-700 font-mono tracking-tight mt-0.5">
            {formatRupiah(grandTotal)}
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">
            {items.length} Produk • {totalItems} Pcs
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-500">
              Metode Pembayaran
            </label>
            {!showDiscountField && (
              <button
                type="button"
                onClick={() => setShowDiscountField(true)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
              >
                <Percent className="w-3 h-3" />
                <span>+ Tambah Diskon</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            {[
              { id: 'Cash', label: 'Tunai', icon: Banknote },
              { id: 'QRIS', label: 'QRIS', icon: QrCode },
              { id: 'Transfer', label: 'Transfer', icon: CreditCard },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {showDiscountField && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Potongan Diskon (Rp)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  handleDiscountChange(0);
                  setShowDiscountField(false);
                }}
                className="text-[10.5px] text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Tutup Diskon
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={discount ? formatThousand(discount) : ''}
                onChange={(e) => handleDiscountChange(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        )}

        {paymentMethod === 'Cash' ? (
          <div className="space-y-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Uang Tunai Diterima
                </label>
                {cashPaid && (
                  <button
                    type="button"
                    onClick={() => setCashPaid('')}
                    className="text-[10.5px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickCashPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashPaid(formatThousand(preset.value))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                      cashPaidNum === preset.value
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={cashPaid}
                  onChange={(e) => setCashPaid(formatThousand(parseThousand(e.target.value)))}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500">
                Uang Kembalian
              </span>
              <span
                className={`text-base font-black font-mono tracking-tight ${
                  isCashInsufficient
                    ? 'text-rose-600'
                    : cashPaidNum >= grandTotal
                    ? 'text-emerald-700'
                    : 'text-slate-400'
                }`}
              >
                {isCashInsufficient
                  ? `Kurang ${formatRupiah(grandTotal - cashPaidNum)}`
                  : formatRupiah(change)}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 text-center">
            <p className="text-xs text-emerald-900 font-medium">
              Pastikan pembayaran via <strong className="text-emerald-950 font-bold">{paymentMethod}</strong> sebesar{' '}
              <strong className="text-emerald-800 font-black font-mono">{formatRupiah(grandTotal)}</strong> telah berhasil diterima.
            </p>
          </div>
        )}

        <div className="pt-1.5 space-y-1.5">
          <button
            type="button"
            onClick={handleProcessCheckout}
            disabled={isProcessing || isCashInsufficient}
            className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-98 ${
              isCashInsufficient
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isProcessing ? 'Memproses Transaksi...' : 'Selesaikan Transaksi'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full py-1 text-center text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
