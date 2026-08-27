import { useState } from 'react';
import Modal from '../common/Modal';
import PermataLogo from '../common/PermataLogo';
import { formatRupiah } from '../../utils/formatters';
import { BarcodeSvg } from '../../utils/barcodeGenerator';
import { printBarcodeLabels } from '../../utils/printBarcodeHelper';
import { Printer, Tag, Package } from 'lucide-react';

export const BarcodeLabelPrinterModal = ({ isOpen, onClose, selectedProduct = null }) => {
  const [labelCount, setLabelCount] = useState(8);

  const product = selectedProduct;

  const handlePrint = () => {
    if (!product) return;
    printBarcodeLabels({
      productName: product.name,
      barcode: product.barcode || product.sku,
      price: product.sellPrice,
      institutionName: 'KOPERASI SD IT PERMATA',
      copies: labelCount,
    });
  };

  if (!isOpen || !product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Label Stiker Barcode"
      subtitle={`Pratinjau label stiker barcode khusus untuk barang: ${product.name}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Banner Info Produk & Kontrol Jumlah Stiker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          {/* Detail Barang Terpilih */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {product.name}
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  {product.category || 'Umum'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Barcode: <strong className="text-slate-800">{product.barcode || product.sku}</strong> • Harga:{' '}
                <strong className="text-emerald-700 font-bold">{formatRupiah(product.sellPrice)}</strong>
              </p>
            </div>
          </div>

          {/* Pemilih Jumlah Cetak Stiker */}
          <div className="flex items-center space-x-1.5 shrink-0 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-600 px-2">Jumlah:</span>
            {[2, 4, 8, 12, 24].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setLabelCount(count)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  labelCount === count
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {count}x
              </button>
            ))}
          </div>
        </div>

        {/* Sticker Preview Grid Container */}
        <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200 max-h-[380px] overflow-y-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center mb-3">
            Pratinjau Lembaran Stiker Siap Cetak ({labelCount} Label Stiker)
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: labelCount }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-xl border-2 border-dashed border-slate-300 shadow-2xs flex flex-col items-center justify-between text-center space-y-1.5 hover:border-emerald-500 transition-colors"
              >
                <div className="border-b border-slate-200 pb-1 w-full">
                  <p className="text-[8.5px] font-black uppercase text-emerald-800 tracking-wider">
                    KOPERASI SD IT PERMATA
                  </p>
                  <h5 className="text-[10px] font-bold text-slate-900 line-clamp-1 leading-tight mt-0.5">
                    {product.name}
                  </h5>
                </div>

                {/* Barcode Graphic Representation */}
                <div className="py-1 px-1 w-full flex flex-col items-center justify-center">
                  <BarcodeSvg
                    value={product.barcode || product.sku}
                    barWidth={1.2}
                    height={32}
                    showText={true}
                  />
                </div>

                <div className="pt-1 border-t border-slate-200 w-full">
                  <span className="text-xs font-black text-emerald-700">
                    {formatRupiah(product.sellPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center space-x-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak {labelCount} Stiker Sekarang</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BarcodeLabelPrinterModal;
