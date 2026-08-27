import { useState } from 'react';
import Modal from '../common/Modal';
import { BarcodeSvg } from '../../utils/barcodeGenerator';
import { formatRupiah } from '../../utils/formatters';
import { printBarcodeLabels } from '../../utils/printBarcodeHelper';
import { Printer, X, Tag, Copy, CheckCircle2 } from 'lucide-react';

export const BarcodePrintModal = ({
  isOpen,
  onClose,
  productName = 'Produk Koperasi',
  barcode = '899123456789',
  price = 0,
  institutionName = 'KOPERASI SD IT PERMATA',
}) => {
  const [copies, setCopies] = useState(4);
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' (A4 stiker sheet) | 'single' (Thermal label)

  if (!isOpen) return null;

  const handlePrint = () => {
    printBarcodeLabels({
      productName,
      barcode,
      price,
      institutionName,
      copies,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Label & Stiker Barcode"
      size="lg"
    >
      <div className="space-y-5">
        {/* Controls Bar */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold text-slate-700">Jumlah Cetak:</label>
            <div className="flex items-center space-x-1">
              {[1, 2, 4, 8, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCopies(num)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    copies === num
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num}x
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="50"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang ({copies} Label)</span>
            </button>
          </div>
        </div>

        {/* Live Preview Area (Screen & Printable on Print Mode) */}
        <div className="p-5 bg-slate-100/70 border border-slate-200 rounded-2xl max-h-[60vh] overflow-y-auto">
          <div className="text-center mb-3 no-print">
            <span className="text-[11px] font-semibold text-slate-500">
              Pratinjau label stiker barcode yang siap dicetak ke printer kertas atau printer stiker:
            </span>
          </div>

          <div
            id="printable-barcode-area"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3.5 justify-center items-center max-w-2xl mx-auto"
          >
            {Array.from({ length: copies }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-dashed border-slate-300 p-3.5 rounded-xl shadow-2xs flex flex-col items-center justify-between text-center space-y-1.5 min-w-[220px] print:border-solid print:border-black print:rounded-none print:shadow-none print:break-inside-avoid print:p-2"
                style={{ pageBreakInside: 'avoid' }}
              >
                {/* Header Stiker */}
                <div className="border-b border-slate-200 pb-1 w-full print:border-black">
                  <p className="text-[10px] font-extrabold tracking-wider uppercase text-slate-700 print:text-black">
                    {institutionName}
                  </p>
                  <p className="text-xs font-bold text-slate-900 line-clamp-1 print:text-black">
                    {productName}
                  </p>
                </div>

                {/* SVG Barcode Vector */}
                <div className="py-1 flex justify-center w-full">
                  <BarcodeSvg value={barcode} barWidth={1.7} height={42} showText={true} />
                </div>

                {/* Footer Harga */}
                <div className="border-t border-slate-200 pt-1 w-full print:border-black">
                  <p className="text-xs font-black text-emerald-800 print:text-black">
                    {formatRupiah(price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 no-print">
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
            className="flex items-center space-x-1.5 px-5 py-2 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Label Barcode</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BarcodePrintModal;
