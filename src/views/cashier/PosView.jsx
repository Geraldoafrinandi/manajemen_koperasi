import { useState, useEffect } from 'react';
import ProductGrid from '../../components/pos/ProductGrid';
import CartDrawer from '../../components/pos/CartDrawer';
import BarcodeCameraScanner from '../../components/pos/BarcodeCameraScanner';
import BarcodeHardwareListener from '../../components/pos/BarcodeHardwareListener';
import PaymentModal from '../../components/pos/PaymentModal';
import ReceiptModal from '../../components/pos/ReceiptModal';
import ProductFormModal from '../../components/products/ProductFormModal';
import Modal from '../../components/common/Modal';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../utils/formatters';
import {
  ShoppingBag,
  ShoppingCart,
  QrCode,
  Sparkles,
  User,
  Clock,
  CheckCircle2,
  Bell,
  Barcode,
  ScanLine,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export const PosView = ({ onNavigate }) => {
  const {
    items,
    addItem,
    addItemByBarcode,
    totalItems,
    grandTotal,
    unregisteredBarcode,
    setUnregisteredBarcode,
  } = useCart();
  const { user } = useAuth();
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeFormatted = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' WIB';

  const handleScanSuccess = (barcodeText) => {
    addItemByBarcode(barcodeText);
  };

  const handleTransactionFinished = (transaction) => {
    setCompletedTransaction(transaction);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-3 sm:p-4 max-w-7xl mx-auto overflow-hidden space-y-3 relative">
      <BarcodeHardwareListener />

      <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                Point of Sales (Kasir Koperasi)
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                Shift Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Petugas: <strong className="text-slate-800 font-semibold">{user?.name || 'Kasir Koperasi'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('price-checker')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Buka Menu Cek Harga Barang (Scanner Kios)"
            >
              <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Cek Harga Barang</span>
            </button>
          )}

          <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-100/80 border border-slate-200 rounded-xl font-mono font-bold text-slate-700 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeFormatted}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden relative">
        <div className="flex-1 h-full min-w-0 pb-16 lg:pb-0">
          <ProductGrid
            onOpenScanner={() => setIsCameraScannerOpen(true)}
            onAddNewProduct={() => setIsManualAddOpen(true)}
          />
        </div>

        <div className="hidden lg:block lg:w-96 h-full shrink-0">
          <CartDrawer onProceedToPayment={() => setIsPaymentModalOpen(true)} />
        </div>
      </div>

      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 animate-in slide-in-from-bottom duration-300">
          <div className="bg-emerald-950/95 backdrop-blur-md text-white p-3 rounded-2xl border border-emerald-800/80 shadow-2xl flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center space-x-3 text-left flex-1 min-w-0 cursor-pointer group"
            >
              <div className="relative w-10 h-10 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 transition-colors shadow-xs">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-white text-emerald-900 font-extrabold text-[10px] rounded-full shadow-xs">
                  {totalItems}
                </span>
              </div>
              <div className="truncate">
                <p className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">
                  Total Tagihan ({totalItems} item)
                </p>
                <p className="text-sm font-extrabold text-white font-mono tracking-tight">
                  {formatRupiah(grandTotal)}
                </p>
              </div>
            </button>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(true)}
                className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-emerald-100 rounded-xl text-xs font-semibold transition-all border border-emerald-700/60 cursor-pointer"
                title="Lihat Rincian Keranjang"
              >
                Rincian
              </button>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <span>Bayar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isMobileCartOpen && (
        <Modal
          isOpen={isMobileCartOpen}
          onClose={() => setIsMobileCartOpen(false)}
          title="Rincian Keranjang Kasir"
          subtitle={`${totalItems} barang dipilih • Total ${formatRupiah(grandTotal)}`}
          maxWidth="max-w-lg"
        >
          <div className="h-[65vh] flex flex-col -mx-2">
            <CartDrawer
              onProceedToPayment={() => {
                setIsMobileCartOpen(false);
                setIsPaymentModalOpen(true);
              }}
            />
          </div>
        </Modal>
      )}

      <BarcodeCameraScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      <Modal
        isOpen={Boolean(unregisteredBarcode)}
        onClose={() => setUnregisteredBarcode(null)}
        title="Barcode Belum Terdaftar"
        subtitle="Permintaan pendaftaran barang telah diteruskan ke Admin Koperasi"
        size="md"
      >
        <div className="space-y-4 text-center p-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
            <Bell className="w-7 h-7 animate-bounce" />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">
              Barcode fisik yang Anda scan belum tercatat di database:
            </p>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl">
              <Barcode className="w-4 h-4 text-slate-500" />
              <span className="font-mono font-extrabold text-sm text-slate-900 tracking-wider">
                {unregisteredBarcode}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-left text-xs text-emerald-900 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Notifikasi Terkirim ke Lonceng Admin</span>
            </div>
            <p className="text-emerald-700 text-[11px] leading-relaxed">
              Admin koperasi telah menerima pemberitahuan pada ikon lonceng untuk menambahkan nama barang, harga modal, dan harga jual barang ini.
            </p>
          </div>

          <p className="text-[11px] text-slate-400">
            Silakan hubungi Admin atau pisahkan barang ini terlebih dahulu dari transaksi saat ini.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setUnregisteredBarcode(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              OK, Mengerti & Lanjutkan
            </button>
          </div>
        </div>
      </Modal>

      {isManualAddOpen && (
        <ProductFormModal
          isOpen={isManualAddOpen}
          initialBarcode=""
          autoAddToCart={true}
          onClose={() => setIsManualAddOpen(false)}
          onSuccess={(newProduct) => {
            if (newProduct) {
              addItem(newProduct, 1);
            }
            setIsManualAddOpen(false);
          }}
        />
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onTransactionComplete={handleTransactionFinished}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={completedTransaction}
        onNewTransaction={() => {
          setCompletedTransaction(null);
        }}
      />
    </div>
  );
};

export default PosView;
