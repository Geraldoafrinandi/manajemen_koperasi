import { useState } from 'react';
import Modal from '../common/Modal';
import { formatRupiah } from '../../utils/formatters';
import { BarcodeSvg } from '../../utils/barcodeGenerator';
import { printBarcodeLabels } from '../../utils/printBarcodeHelper';
import {
  Printer,
  Package,
  CreditCard,
  Scissors,
  Info,
} from 'lucide-react';

export const BarcodeLabelPrinterModal = ({
  isOpen,
  onClose,
  selectedProduct = null,
}) => {
  // Maksimal 4 barcode per 1 lembar kertas HVS (2 kolom x 2 baris)
  const [labelCount, setLabelCount] = useState(4);

  const product = selectedProduct;

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    printBarcodeLabels({
      productName: product.name,
      barcode: product.barcode || product.sku,
      copies: labelCount,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Barcode Ukuran Dompet Kartu"
      subtitle={`Ukuran kartu dompet & laminasi (9.0 × 5.8 cm) • Maksimal 4 barcode per 1 lembar kertas HVS`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Banner Info Produk & Kontrol Jumlah Print */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-3">
          {/* Baris 1: Info Barang */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    {product.name}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    {product.category || 'Umum'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Barcode:{' '}
                  <strong className="text-slate-800">
                    {product.barcode || product.sku}
                  </strong>{' '}
                  • Harga Jual:{' '}
                  <strong className="text-emerald-700 font-bold">
                    {formatRupiah(
                      product.sellPrice ?? product.sellingPrice ?? product.price ?? 0
                    )}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* Baris 2: Pemilih Jumlah Print (Maks 4 per HVS) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-extrabold text-slate-800">
                Ukuran Dompet Kartu & Laminasi (9.0 × 5.8 cm)
              </span>
            </div>

            {/* Pemilih Jumlah Print: Maksimal 4 */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600 shrink-0">
                Jumlah Print (Maks. 4 / HVS):
              </span>
              <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setLabelCount(count)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      labelCount === count
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {count}x
                    {count === 4 && (
                      <span className="text-[10px] opacity-85 ml-1 font-normal">
                        (1 HVS Penuh)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tips Info Banner */}
        <div className="flex items-start space-x-2.5 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-extrabold text-emerald-950">
              Ukuran Pas Dompet Kartu & Laminating (9.0 × 5.8 cm):
            </strong>{' '}
            Barcode dan nama barang diperbesar optimal agar mudah discan kasir dan pas dimasukkan ke slot dompet kartu ataupun plastik pouch laminasi.
          </p>
        </div>

        {/* Pratinjau Lembar Kertas HVS (Canvas HVS dengan Grid 2x2) */}
        <div className="p-4 sm:p-5 bg-slate-100/80 rounded-2xl border border-slate-200 max-h-[440px] overflow-y-auto">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Scissors className="w-4 h-4 text-slate-500" />
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Pratinjau Kertas HVS A4 ({labelCount} dari 4 Kartu)
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              Layout 2 Kolom × 2 Baris (9.0 × 5.8 cm)
            </span>
          </div>

          {/* Grid 2x2 HVS Sheet Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto p-4 bg-white rounded-2xl border-2 border-slate-300 shadow-sm">
            {Array.from({ length: 4 }).map((_, idx) => {
              const isFilled = idx < labelCount;

              if (!isFilled) {
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border-2 border-dashed border-slate-200 p-4 min-h-[185px] flex flex-col items-center justify-center text-slate-300 bg-slate-50/50"
                  >
                    <span className="text-xs font-bold text-slate-400">
                      Slot #{idx + 1} (Kosong)
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border-2 border-dashed border-slate-400 shadow-2xs flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:shadow-md transition-all relative overflow-hidden p-4 min-h-[185px]"
                >
                  {/* Nama Produk Saja */}
                  <h5 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-1 leading-snug mb-2 max-w-[96%]">
                    {product.name}
                  </h5>

                  {/* Barcode Graphic Representation (Larger) */}
                  <div className="w-full flex flex-col items-center justify-center">
                    <BarcodeSvg
                      value={product.barcode || product.sku}
                      barWidth={2.05}
                      height={52}
                      fontSize={13}
                      showText={true}
                    />
                  </div>
                </div>
              );
            })}
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
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center space-x-2 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak {labelCount} Barcode (Kertas HVS)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BarcodeLabelPrinterModal;
