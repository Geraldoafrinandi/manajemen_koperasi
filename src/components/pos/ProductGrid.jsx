import { useState, useMemo, useRef } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { formatRupiah } from '../../utils/formatters';
import {
  Search,
  Plus,
  Barcode,
  Package,
  QrCode,
  X,
} from 'lucide-react';
import Badge from '../common/Badge';

export const ProductGrid = ({ onOpenScanner, onAddNewProduct }) => {
  const { products } = useProducts();
  const { addItem, addItemByBarcode } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [justScanned, setJustScanned] = useState(false);
  const manualInputRef = useRef(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status === false) return false;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));

      return matchQuery;
    });
  }, [products, searchQuery]);

  const handleManualBarcodeSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      addItemByBarcode(manualBarcode.trim());
      setJustScanned(true);
      setTimeout(() => setJustScanned(false), 1500);
      setManualBarcode('');
      if (manualInputRef.current) {
        manualInputRef.current.focus();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl p-3 sm:p-5 border border-slate-200 shadow-xs">
      <div className="mb-3.5 sm:mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang / kategori..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <form onSubmit={handleManualBarcodeSubmit} className="flex gap-1.5 flex-1 sm:flex-initial">
              <div className="relative flex-1 sm:w-40">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={manualInputRef}
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Barcode..."
                  className={`w-full pl-9 pr-2.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono transition-all ${
                    justScanned ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
              >
                Enter
              </button>
            </form>

            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
              title="Buka kamera untuk scan barcode / QR produk"
            >
              <QrCode className="w-4 h-4" />
              <span className="whitespace-nowrap">Scan Kamera</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/80 rounded-2xl border border-dashed border-slate-300">
            <Package className="w-12 h-12 text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm">Barang Tidak Ditemukan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Coba sesuaikan kata kunci pencarian atau scan barcode barang dengan scanner / kamera.
            </p>
            {onAddNewProduct && (
              <button
                type="button"
                onClick={onAddNewProduct}
                className="mt-3.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Daftarkan Barang Baru</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock <= (product.minStock || 5) && product.stock > 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addItem(product, 1)}
                  className={`group relative flex flex-col justify-between p-3.5 rounded-2xl bg-white border transition-all duration-200 select-none ${isOutOfStock
                    ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50/80'
                    : 'border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer active:scale-98'
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 truncate max-w-[110px]">
                        {product.category || 'Umum'}
                      </span>
                      {isOutOfStock ? (
                        <Badge variant="danger" size="sm">
                          Habis
                        </Badge>
                      ) : isLowStock ? (
                        <Badge variant="warning" size="sm">
                          Sisa {product.stock}
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          {product.stock} {product.unit || 'Pcs'}
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 flex items-center space-x-1">
                      <Barcode className="w-3.3 h-3.5 text-slate-300" />
                      <span>{product.barcode || product.sku || '-'}</span>
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-emerald-700 font-mono">
                        {formatRupiah(product.sellPrice)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isOutOfStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white shadow-2xs active:scale-95 cursor-pointer'
                        }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
