import { useState } from 'react';
import Modal from '../common/Modal';
import { BarcodeSvg } from '../../utils/barcodeGenerator';
import { printBarcodeLabels } from '../../utils/printBarcodeHelper';
import {
  Printer,
  CreditCard,
  Scissors,
  Info,
} from 'lucide-react';

export const BarcodePrintModal = ({
  isOpen,
  onClose,
  productName = 'Produk Koperasi',
  barcode = '899123456789',
}) => {
  const [copies, setCopies] = useState(4); // Max 4 per HVS

  if (!isOpen) return null;

  const handlePrint = () => {
    printBarcodeLabels({
      productName,
      barcode,
      copies,
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
        {/* Controls Bar */}
        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-extrabold text-slate-800">
              Ukuran Dompet Kartu & Laminasi (9.0 × 5.8 cm)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 shrink-0">
              Jumlah Print:
            </span>
            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCopies(num)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    copies === num
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {num}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tips Info Banner */}
        <div className="flex items-start space-x-2.5 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-extrabold text-emerald-950">
              Ukuran Pas Dompet Kartu (9.0 × 5.8 cm):
            </strong>{' '}
            Barcode dan nama barang diperbesar optimal agar mudah discan kasir dan pas dimasukkan ke slot dompet kartu ataupun plastik pouch laminasi.
          </p>
        </div>

        {/* Live Preview Area */}
        <div className="p-4 sm:p-5 bg-slate-100/80 border border-slate-200 rounded-2xl max-h-[440px] overflow-y-auto">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Scissors className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Pratinjau Kertas HVS ({copies} dari 4 Slot)
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              Layout 2 Kolom × 2 Baris (9.0 × 5.8 cm)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto p-4 bg-white rounded-2xl border-2 border-slate-300 shadow-sm">
            {Array.from({ length: 4 }).map((_, idx) => {
              const isFilled = idx < copies;

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
                  className="bg-white border-2 border-dashed border-slate-400 rounded-2xl shadow-2xs flex flex-col items-center justify-center text-center hover:border-emerald-500 transition-all p-4 min-h-[185px]"
                >
                  <h5 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-1 leading-snug mb-2 max-w-[96%]">
                    {productName}
                  </h5>

                  <div className="w-full flex flex-col items-center justify-center">
                    <BarcodeSvg
                      value={barcode}
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

        {/* Modal Actions */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak {copies} Barcode (Kertas HVS)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BarcodePrintModal;
