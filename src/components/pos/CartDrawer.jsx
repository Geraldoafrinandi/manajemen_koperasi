import { useCart } from '../../context/CartContext';
import { formatRupiah } from '../../utils/formatters';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react';

export const CartDrawer = ({ onProceedToPayment }) => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    discount,
    subtotal,
    grandTotal,
    totalItems,
  } = useCart();

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">Keranjang Kasir</h3>
            <p className="text-[11px] text-slate-500 font-medium">{totalItems} barang dipilih</p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center space-x-1 px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Kosongkan Keranjang"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">Batal</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-2">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <p className="font-bold text-xs text-slate-700">Keranjang Masih Kosong</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[210px] leading-relaxed">
              Klik barang pada katalog atau scan barcode/QR code untuk menambahkan pesanan.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productId}
              className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 flex items-center justify-between gap-2 hover:bg-slate-100/70 transition-colors"
            >
              <div className="truncate flex-1">
                <p className="font-extrabold text-xs text-slate-900 truncate">{item.name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {formatRupiah(item.sellPrice)} × {item.quantity} {item.unit || 'Pcs'}
                </p>
              </div>

              <div className="flex items-center space-x-1 shrink-0 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-black text-xs text-slate-900 font-mono">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-6 h-6 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="text-right shrink-0 min-w-[70px]">
                <p className="font-black text-xs text-slate-900 font-mono">
                  {formatRupiah(item.subtotal)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors font-semibold cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Subtotal Pesanan</span>
          <span className="font-mono">{formatRupiah(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
            <span>Diskon</span>
            <span className="font-mono">- {formatRupiah(discount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
          <span className="font-bold text-xs sm:text-sm text-slate-900">Total Tagihan</span>
          <span className="font-black text-lg sm:text-xl text-emerald-700 font-mono tracking-tight">
            {formatRupiah(grandTotal)}
          </span>
        </div>

        <button
          type="button"
          disabled={items.length === 0}
          onClick={onProceedToPayment}
          className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-98 ${
            items.length === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs'
          }`}
        >
          <span>Lanjut ke Pembayaran ({totalItems})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CartDrawer;
