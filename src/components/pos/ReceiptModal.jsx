import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import Modal from '../common/Modal';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../../context/ToastContext';
import PermataLogo from '../common/PermataLogo';
import { formatRupiah, formatTanggal } from '../../utils/formatters';
import { printThermalReceipt } from '../../utils/printReceiptHelper';
import { Printer, Download, Plus } from 'lucide-react';

export const ReceiptModal = ({ isOpen, onClose, transaction, onNewTransaction }) => {
  const { coopProfile } = useProducts();
  const toast = useToast();
  const receiptRef = useRef(null);
  const [paperWidth, setPaperWidth] = useState(58);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'F1') {
        e.preventDefault();
        onClose();
        if (onNewTransaction) onNewTransaction();
      } else if ((e.key === 'p' || e.key === 'P' || e.key === 'F8') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlePrint();
      } else if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleDownloadPdf();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        if (onNewTransaction) onNewTransaction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNewTransaction, transaction, coopProfile, paperWidth]);

  if (!transaction) return null;

  const grandTotal = Number(transaction.grandTotal || transaction.total || 0);
  const rawSubtotal = Number(
    transaction.subtotal ||
      (transaction.items || []).reduce(
        (sum, i) =>
          sum +
          (Number(i.sellPrice || i.price) || 0) * (Number(i.quantity || i.qty) || 1),
        0
      ) ||
      grandTotal
  );
  let discountTotal = Number(transaction.discount || transaction.discountTotal || 0);
  if (discountTotal <= 0 && rawSubtotal > grandTotal) {
    discountTotal = rawSubtotal - grandTotal;
  }
  const subtotal = rawSubtotal > grandTotal ? rawSubtotal : grandTotal + discountTotal;
  const cashPaid = Number(transaction.cashPaid || transaction.paid || grandTotal);
  const change = Number(transaction.change || (cashPaid > grandTotal ? cashPaid - grandTotal : 0));

  const handlePrint = () => {
    printThermalReceipt(transaction, coopProfile, paperWidth);
  };

  const handleDownloadPdf = () => {
    try {
      const pdfWidth = paperWidth === 58 ? 58 : 80;
      const itemCount = (transaction.items || []).length || 1;
      const pdfHeight = Math.max(90, Math.ceil(85 + (itemCount * 8.5) + (transaction.discount > 0 ? 6 : 0)));
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      const headerTitle = coopProfile.receiptHeaderTitle || coopProfile.name || 'KOPERASI SD IT PERMATA';
      const headerSubtitle = coopProfile.receiptHeaderSubtitle || coopProfile.institution || 'Full Day School • Koperasi';
      const headerAddress = coopProfile.receiptHeaderAddress || coopProfile.address || 'Jl SMP 21 Padang, Kota Padang';
      const headerPhone = coopProfile.receiptHeaderPhone || coopProfile.phone || '-';

      const centerX = pdfWidth / 2;
      const rightX = pdfWidth - 5;

      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.text(headerTitle, centerX, 8, { align: 'center' });
      doc.setFontSize(7);
      doc.text(headerSubtitle, centerX, 12, { align: 'center' });

      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.text(headerAddress, centerX, 15.5, { align: 'center' });
      if (headerPhone && headerPhone !== '-') {
        doc.text(`Telp: ${headerPhone}`, centerX, 19, { align: 'center' });
      }

      doc.text('----------------------------------------', centerX, 22.5, { align: 'center' });

      doc.setFontSize(6.5);
      doc.text(`No. Faktur: ${transaction.invoiceNumber}`, 4, 26);
      doc.text(`Waktu     : ${formatTanggal(transaction.createdAt, true)}`, 4, 29.5);
      doc.text(`Kasir     : ${transaction.cashierName || 'Kasir Koperasi'}`, 4, 33);

      doc.text('----------------------------------------', centerX, 36.5, { align: 'center' });

      let currentY = 40;
      (transaction.items || []).forEach((item) => {
        doc.setFont('courier', 'bold');
        doc.text(item.name.substring(0, 24), 4, currentY);
        currentY += 3.5;
        doc.setFont('courier', 'normal');
        doc.text(
          `${item.quantity} x ${formatRupiah(item.sellPrice)}`,
          4,
          currentY
        );
        doc.text(formatRupiah(item.subtotal), rightX, currentY, { align: 'right' });
        currentY += 3.5;
      });

      doc.text('----------------------------------------', centerX, currentY, { align: 'center' });
      currentY += 3.5;

      doc.text(`Subtotal :`, 4, currentY);
      doc.text(formatRupiah(subtotal), rightX, currentY, { align: 'right' });
      currentY += 3.5;

      if (discountTotal > 0) {
        doc.text(`Diskon   :`, 4, currentY);
        doc.text(`-${formatRupiah(discountTotal)}`, rightX, currentY, { align: 'right' });
        currentY += 3.5;
      }

      doc.setFont('courier', 'bold');
      doc.text(`TOTAL    :`, 4, currentY);
      doc.text(formatRupiah(grandTotal), rightX, currentY, { align: 'right' });
      currentY += 3.5;

      doc.setFont('courier', 'normal');
      doc.text(`Bayar (${transaction.paymentMethod}):`, 4, currentY);
      doc.text(formatRupiah(cashPaid), rightX, currentY, { align: 'right' });
      currentY += 3.5;

      doc.text(`Kembalian:`, 4, currentY);
      doc.text(formatRupiah(change), rightX, currentY, { align: 'right' });
      currentY += 5;

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.text(coopProfile.receiptFooter || '*** TERIMA KASIH ***', centerX, currentY, {
        align: 'center',
      });
      if (coopProfile.receiptPolicy) {
        currentY += 3.5;
        doc.setFont('courier', 'normal');
        doc.setFontSize(6);
        doc.text(coopProfile.receiptPolicy, centerX, currentY, { align: 'center' });
      }

      doc.save(`Struk_${transaction.invoiceNumber}.pdf`);
      toast.success(`Struk ${transaction.invoiceNumber} berhasil diunduh format PDF.`);
    } catch {
      toast.error('Gagal membuat file PDF struk.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaksi Selesai"
      subtitle="Transaksi berhasil disimpan ke sistem"
      maxWidth="max-w-sm"
    >
      <div className="space-y-3 pt-0.5">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100/80 border border-slate-200 text-xs">
          <span className="font-bold text-slate-700 pl-1 text-[11px]">Ukuran Kertas:</span>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setPaperWidth(58)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                paperWidth === 58
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              58mm (Standar)
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth(80)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                paperWidth === 80
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              80mm (Lebar)
            </button>
          </div>
        </div>

        <div
          ref={receiptRef}
          style={{ width: '100%' }}
          className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 shadow-2xs space-y-2.5 max-h-[42vh] overflow-y-auto"
        >
          <div className="text-center space-y-0.5 flex flex-col items-center">
            {coopProfile.receiptShowLogo !== false && (
              <PermataLogo variant="icon" size="sm" />
            )}
            <h3 className="font-extrabold text-xs tracking-tight text-slate-900 mt-1 uppercase">
              {coopProfile.receiptHeaderTitle || coopProfile.name || 'KOPERASI SD IT PERMATA'}
            </h3>
            <p className="text-[9.5px] font-bold uppercase text-slate-600">
              {coopProfile.receiptHeaderSubtitle || coopProfile.institution || 'Full Day School • Koperasi'}
            </p>
            <p className="text-[8.5px] text-slate-400">
              {coopProfile.receiptHeaderAddress || coopProfile.address || 'Jl SMP 21 Padang, Kota Padang'}
            </p>
            {coopProfile.receiptHeaderPhone && (
              <p className="text-[8.5px] text-slate-400">
                Telp: {coopProfile.receiptHeaderPhone || coopProfile.phone || '-'}
              </p>
            )}
          </div>

          <div className="border-t border-dashed border-slate-300"></div>

          <div className="text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Faktur:</span>
              <span className="font-bold text-slate-900">{transaction.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu:</span>
              <span className="text-slate-800">{formatTanggal(transaction.createdAt, true)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kasir:</span>
              <span className="text-slate-800">{transaction.cashierName || 'Kasir'}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300"></div>

          <div className="space-y-1.5 text-[10px]">
            {(transaction.items || []).map((item, idx) => (
              <div key={idx}>
                <p className="font-bold text-slate-900 leading-snug">{item.name}</p>
                <div className="flex justify-between text-slate-500 text-[9.5px]">
                  <span>
                    {item.quantity} x {formatRupiah(item.sellPrice)}
                  </span>
                  <span className="font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300"></div>

          <div className="space-y-1 text-[10.5px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span className="text-slate-900">{formatRupiah(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Diskon:</span>
                <span>-{formatRupiah(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-dashed border-slate-300">
              <span>TOTAL:</span>
              <span className="text-emerald-700">{formatRupiah(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-0.5">
              <span>Bayar ({transaction.paymentMethod}):</span>
              <span className="text-slate-900">{formatRupiah(cashPaid)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>Kembalian:</span>
              <span className="text-emerald-700 font-mono font-black">{formatRupiah(change)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300"></div>

          <div className="text-center space-y-0.5 py-1 font-mono">
            <p className="text-[11px] text-slate-900 font-extrabold tracking-wider">
              {coopProfile.receiptFooter || '*** TERIMA KASIH ***'}
            </p>
            {coopProfile.receiptPolicy && (
              <p className="text-[9px] text-slate-500 font-sans leading-tight">
                {coopProfile.receiptPolicy}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-2xs cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Struk</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-2xs cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download PDF</span>
            </button>
          </div>

          <button
            type="button"
            autoFocus
            onClick={() => {
              onClose();
              if (onNewTransaction) onNewTransaction();
            }}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Mulai Transaksi Selanjutnya</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
