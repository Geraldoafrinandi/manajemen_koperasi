import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../../context/ToastContext';
import { generateBarcode, formatRupiah, formatThousand, parseThousand } from '../../utils/formatters';
import BarcodeCameraScanner from '../pos/BarcodeCameraScanner';
import BarcodePrintModal from './BarcodePrintModal';
import { BarcodeSvg } from '../../utils/barcodeGenerator';
import {
  Barcode,
  Sparkles,
  Tag,
  Plus,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Banknote,
  Info,
  ShieldCheck,
  Check,
  Camera,
  Printer,
  RefreshCw,
  Scan,
} from 'lucide-react';

export const ProductFormModal = ({
  isOpen,
  onClose,
  productToEdit = null,
  initialBarcode = '',
  onSuccess = null,
  autoAddToCart = false,
}) => {
  const { addProduct, updateProduct, categories, addCategory } = useProducts();
  const toast = useToast();

  const categoryOptions = categories && categories.length > 0 ? categories : FALLBACK_CATEGORIES;
  const isEditMode = !!productToEdit;

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    categoryId: categoryOptions?.[0]?.id || 1,
    purchasePrice: '',
    sellingPrice: '',
    discount: '0',
    stock: '10',
    status: true,
  });

  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const barcodeInputRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      isInitializedRef.current = true;
      if (productToEdit) {
        setFormData({
          name: productToEdit.name || '',
          barcode: productToEdit.barcode || generateBarcode(),
          categoryId:
            productToEdit.categoryId ||
            productToEdit.category_id ||
            categoryOptions?.[0]?.id ||
            1,
          purchasePrice: formatThousand(productToEdit.costPrice ?? productToEdit.purchase_price ?? ''),
          sellingPrice: formatThousand(productToEdit.sellPrice ?? productToEdit.selling_price ?? ''),
          discount: formatThousand(productToEdit.discount ?? 0),
          stock: (productToEdit.stock ?? 0).toString(),
          status: productToEdit.status !== undefined ? Boolean(productToEdit.status) : true,
        });
      } else {
        setFormData({
          name: '',
          barcode: initialBarcode ? initialBarcode.trim() : generateBarcode(),
          categoryId: categoryOptions?.[0]?.id || 1,
          purchasePrice: '',
          sellingPrice: '',
          discount: '0',
          stock: '10',
          status: true,
        });
      }
      setShowQuickAddCategory(false);
      setQuickCategoryName('');
    } else if (!isOpen) {
      isInitializedRef.current = false;
    }
  }, [isOpen, productToEdit, initialBarcode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'purchasePrice' || name === 'sellingPrice' || name === 'discount') {
      setFormData((prev) => ({
        ...prev,
        [name]: formatThousand(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleGenerateNewBarcode = () => {
    const newCode = generateBarcode();
    setFormData((prev) => ({
      ...prev,
      barcode: newCode,
    }));
    toast.success('Barcode random berhasil dibuat!');
  };

  const handleCameraScanSuccess = (scannedCode) => {
    if (scannedCode) {
      setFormData((prev) => ({
        ...prev,
        barcode: scannedCode.trim(),
      }));
      setIsCameraModalOpen(false);
      toast.success(`Barcode berhasil dipindai: ${scannedCode}`);
    }
  };

  const handleQuickAddCategory = async (e) => {
    e.preventDefault();
    if (!quickCategoryName.trim()) {
      toast.warning('Nama kategori tidak boleh kosong.');
      return;
    }
    try {
      const created = await addCategory({ name: quickCategoryName.trim() });
      toast.success(`Kategori "${quickCategoryName.trim()}" berhasil dibuat.`);
      const newId = created?.data?.id || created?.id;
      if (newId) {
        setFormData((prev) => ({ ...prev, categoryId: newId }));
      }
      setQuickCategoryName('');
      setShowQuickAddCategory(false);
    } catch (err) {
      toast.error(err.message || 'Gagal membuat kategori.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cost = parseThousand(formData.purchasePrice);
      const sell = parseThousand(formData.sellingPrice);
      const discount = parseThousand(formData.discount);
      const stock = parseInt(formData.stock, 10) || 0;

      if (!formData.name.trim()) {
        toast.error('Nama barang wajib diisi.');
        return;
      }

      // Barcode: pastikan barcode terisi (input manual, scanner, kamera, atau auto-generated random)
      const finalBarcode = formData.barcode?.trim() || generateBarcode();

      const catId = formData.categoryId
        ? Number(formData.categoryId)
        : (categories?.[0]?.id ? Number(categories[0].id) : 1);

      if (sell < cost) {
        toast.warning('Peringatan: Harga jual lebih kecil dari modal (HPP).');
      }

      const productPayload = {
        name: formData.name.trim(),
        barcode: finalBarcode,
        category_id: catId,
        purchase_price: cost,
        selling_price: sell,
        discount: discount,
        stock: stock,
        status: Boolean(formData.status),
      };

      let saved = null;
      if (isEditMode) {
        saved = await updateProduct(productToEdit.id, productPayload);
        toast.success(`Barang "${productPayload.name}" berhasil diperbarui.`);
      } else {
        saved = await addProduct(productPayload);
        toast.success(`Barang "${productPayload.name}" berhasil didaftarkan.`);
      }

      if (onSuccess) {
        onSuccess(saved || { ...productPayload, id: Date.now() });
      }

      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan barang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live calculation keuntungan & margin
  const costVal = parseThousand(formData.purchasePrice);
  const sellVal = parseThousand(formData.sellingPrice);
  const discVal = parseThousand(formData.discount);
  const netSellPrice = Math.max(0, sellVal - discVal);
  const profitPerItem = netSellPrice - costVal;
  const profitMargin = costVal > 0 ? ((profitPerItem / costVal) * 100).toFixed(1) : 0;
  const isLoss = profitPerItem < 0 && sellVal > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditMode
          ? 'Edit Data Barang Koperasi'
          : initialBarcode
            ? 'Daftarkan Barang Baru'
            : 'Tambah Master Barang Baru'
      }
      subtitle={
        isEditMode
          ? 'Perbarui informasi produk, barcode, harga, atau kategori barang'
          : initialBarcode
            ? `Barcode "${initialBarcode}" belum terdaftar. Lengkapi data untuk mendaftarkannya.`
            : 'Masukkan rincian barang, barcode fisik / acak, dan parameter harga'
      }
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Banner Notifikasi Barcode Belum Terdaftar */}
        {initialBarcode && !isEditMode && (
          <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl flex items-center space-x-3 text-amber-900 text-xs shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <p className="font-bold text-xs text-amber-900">
                Barcode Baru: <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-extrabold">{initialBarcode}</span>
              </p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                Barang yang didaftarkan akan otomatis tersimpan di database dan langsung dimasukkan ke keranjang kasir.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Informasi Utama */}
        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200/60">
            <Package className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Informasi Umum Barang
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nama Produk */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Barang / Produk <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Seragam Batik SD IT Permata L / Beng-Beng Chocolate"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Kategori */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Kategori Barang <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCategory(!showQuickAddCategory)}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showQuickAddCategory ? 'Batal Tambah Kategori' : '+ Buat Kategori Baru'}</span>
                </button>
              </div>

              {showQuickAddCategory ? (
                <div className="flex items-center space-x-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl mb-2">
                  <input
                    type="text"
                    value={quickCategoryName}
                    onChange={(e) => setQuickCategoryName(e.target.value)}
                    placeholder="Nama kategori baru..."
                    className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer shrink-0"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCategory(false)}
                    className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-300 cursor-pointer shrink-0"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
                  >
                    {(categories || []).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Barcode & Identifikasi */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-200/70">
            <div className="flex items-center space-x-2">
              <Barcode className="w-4.5 h-4.5 text-emerald-700" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Barcode & Identifikasi Barang
                </h4>
                <p className="text-[11px] text-slate-500">
                  Scan barcode kemasan pabrik, gunakan scanner kamera, atau buat barcode acak
                </p>
              </div>
            </div>

            {/* Tombol Cetak Label Stiker */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              disabled={!formData.barcode}
              className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
              title="Cetak label stiker barcode untuk ditempel di pakaian/seragam/barang"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cetak Label Stiker</span>
            </button>
          </div>

          {/* Barcode Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Kode Barcode (EAN-13 / Angka Unik) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                <Scan className="w-3 h-3" />
                <span>Scanner USB / Bluetooth Siap Input</span>
              </span>
            </div>

            <div className="relative flex items-center">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={barcodeInputRef}
                type="text"
                name="barcode"
                required
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Ketik manual atau tembak dengan barcode scanner..."
                className="w-full pl-9 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
              />
              {formData.barcode && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, barcode: '' }))}
                  className="absolute right-2.5 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>

          {/* 2 Metode Utama: Scan Kamera vs Buat Barcode Random */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Opsi 1: Untuk Snack / ATK (Barcode Kemasan Pabrik) */}
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="p-3 bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center space-x-2.5 transition-all text-left group cursor-pointer shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                  Scan via Kamera (HP/Webcam)
                </p>
                <p className="text-[10px] text-slate-500">
                  Untuk snack, minuman, & ATK berkemasan
                </p>
              </div>
            </button>

            {/* Opsi 2: Untuk Pakaian / Seragam (Tanpa Barcode Fisik) */}
            <button
              type="button"
              onClick={handleGenerateNewBarcode}
              className="p-3 bg-white hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 rounded-xl flex items-center space-x-2.5 transition-all text-left group cursor-pointer shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100/80 group-hover:bg-amber-600 text-amber-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-amber-900">
                  Buat Barcode Random
                </p>
                <p className="text-[10px] text-slate-500">
                  Untuk pakaian, seragam, & makanan tanpa kemasan
                </p>
              </div>
            </button>
          </div>

          {/* Visual Barcode Vector Preview */}
          {formData.barcode && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-1 rounded-lg border border-slate-200">
                  <BarcodeSvg value={formData.barcode} barWidth={1.4} height={30} showText={false} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Garis Barcode Aktif:
                  </span>
                  <p className="font-mono font-extrabold text-xs text-slate-900 tracking-wider">
                    {formData.barcode}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak Stiker Label</span>
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Harga & Keuntungan */}
        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200/60">
            <Banknote className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Finansial & Harga Jual
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Harga Modal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Modal (HPP) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  name="purchasePrice"
                  required
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  placeholder="20.000"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Harga Jual */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Jual Normal <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  name="sellingPrice"
                  required
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  placeholder="30.000"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Diskon */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Diskon Potongan (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Live Metric Card */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-colors ${isLoss
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`p-1.5 rounded-xl font-bold ${isLoss ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
              >
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] opacity-75">Estimasi Laba Bersih per Item:</span>
                <p className="font-extrabold text-sm">
                  {formatRupiah(profitPerItem)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] opacity-75">Margin Keuntungan:</span>
              <p className="font-extrabold text-sm">
                {isLoss ? `${profitMargin}%` : `+${profitMargin}%`}
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Stok Awal & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jumlah Stok {isEditMode ? 'Saat Ini' : 'Awal Masuk'}
            </label>
            <input
              type="number"
              name="stock"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
            />
          </div>

          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Status Penjualan
            </label>
            <select
              name="status"
              value={formData.status ? 'true' : 'false'}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value === 'true' }))
              }
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
            >
              <option value="true">Aktif (Dijual di Kasir POS)</option>
              <option value="false">Nonaktif (Diarsipkan)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? 'Menyimpan...'
              : isEditMode
                ? 'Simpan Perubahan'
                : autoAddToCart
                  ? 'Simpan & Masukkan ke Keranjang'
                  : 'Tambah Barang'}
          </button>
        </div>
      </form>

      {/* Sub-Modal 1: Kamera Scanner HP / Webcam */}
      <BarcodeCameraScanner
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />

      {/* Sub-Modal 2: Cetak Label & Stiker Barcode */}
      <BarcodePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        productName={formData.name || 'Produk Koperasi'}
        barcode={formData.barcode || '899123456789'}
        price={Math.max(0, parseThousand(formData.sellingPrice) - parseThousand(formData.discount))}
      />
    </Modal>
  );
};

export default ProductFormModal;
