import { useState, useMemo } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatRupiah, formatTanggal, formatThousand, parseThousand } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import {
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  AlertTriangle,
  Package,
  Search,
  CheckCircle2,
  Filter,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  MinusCircle,
  Edit3,
  Trash2,
  ShoppingBag,
} from 'lucide-react';

export const StockManagementView = () => {
  const {
    products,
    mutations,
    restockProduct,
    reduceProductStock,
    adjustProductStock,
    lowStockCount,
    categories,
  } = useProducts();
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [mutationTypeFilter, setMutationTypeFilter] = useState('ALL');

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockTab, setStockTab] = useState('restock');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');
  const [restockNotes, setRestockNotes] = useState('');

  const [reduceQty, setReduceQty] = useState('');
  const [reduceCategoryReason, setReduceCategoryReason] = useState('Barang Rusak / Cacat');
  const [reduceNotes, setReduceNotes] = useState('');

  const [adjustActualStock, setAdjustActualStock] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      const matchCategory =
        selectedCategory === 'ALL' || p.categoryId === selectedCategory;

      const matchStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'CRITICAL' && p.stock <= p.minStock) ||
        (stockFilter === 'SAFE' && p.stock > p.minStock);

      return matchQuery && matchCategory && matchStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const filteredMutations = useMemo(() => {
    return mutations.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        m.productName.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        (m.referenceNo && m.referenceNo.toLowerCase().includes(q)) ||
        (m.reason && m.reason.toLowerCase().includes(q));

      const noteText = String(m.reason || '').toLowerCase();
      const refNo = String(m.referenceNo || '');
      const isOut =
        m.type === 'OUT' ||
        m.type === 'SALE' ||
        refNo.toUpperCase().startsWith('TRX') ||
        refNo.toUpperCase().startsWith('INV') ||
        noteText.includes('penjualan') ||
        noteText.includes('kasir') ||
        noteText.includes('terjual') ||
        noteText.includes('rusak') ||
        noteText.includes('keluar') ||
        noteText.includes('kadaluwarsa') ||
        noteText.includes('retur');

      const isMatchCategory =
        mutationTypeFilter === 'ALL' ||
        (mutationTypeFilter === 'IN' && !isOut) ||
        (mutationTypeFilter === 'OUT' && isOut);

      return matchQuery && isMatchCategory;
    });
  }, [mutations, searchQuery, mutationTypeFilter]);

  const resetForms = () => {
    setRestockQty('');
    setRestockCost('');
    setRestockNotes('');
    setReduceQty('');
    setReduceCategoryReason('Barang Rusak / Cacat');
    setReduceNotes('');
    setAdjustActualStock('');
    setAdjustReason('');
  };

  const handleOpenStockModal = (product, defaultTab = 'restock') => {
    const target = product || products[0] || null;
    setSelectedProduct(target);
    setStockTab(defaultTab);
    if (target) {
      setRestockCost(formatThousand(target.costPrice));
      setAdjustActualStock(target.stock.toString());
    } else {
      resetForms();
    }
    setIsStockModalOpen(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) {
      toast.error('Jumlah barang masuk harus lebih dari 0.');
      return;
    }

    try {
      await restockProduct(selectedProduct.id, {
        quantity: qty,
        newCostPrice: restockCost ? parseThousand(restockCost) : null,
        reason: restockNotes || 'Penambahan stok barang masuk dari supplier',
        author: user?.name || 'Admin',
      });
      toast.success(
        `Stok "${selectedProduct.name}" berhasil ditambah (+${qty} ${selectedProduct.unit}).`
      );
      setIsStockModalOpen(false);
      resetForms();
    } catch (err) {
      toast.error(err.message || 'Gagal memproses penambahan stok.');
    }
  };

  const handleReduceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = parseInt(reduceQty);
    if (!qty || qty <= 0) {
      toast.error('Jumlah barang keluar harus lebih dari 0.');
      return;
    }

    if (selectedProduct.stock < qty) {
      toast.error(
        `Stok "${selectedProduct.name}" tidak mencukupi (Tersedia: ${selectedProduct.stock} ${selectedProduct.unit}).`
      );
      return;
    }

    const fullReason = `${reduceCategoryReason}${reduceNotes ? `: ${reduceNotes}` : ''}`;

    try {
      if (reduceProductStock) {
        await reduceProductStock(selectedProduct.id, {
          quantity: qty,
          reason: fullReason,
          author: user?.name || 'Admin',
        });
      } else {
        await adjustProductStock(selectedProduct.id, {
          actualStock: Math.max(0, selectedProduct.stock - qty),
          reason: fullReason,
          author: user?.name || 'Admin',
        });
      }

      toast.success(
        `Barang keluar berhasil dicatat: "${selectedProduct.name}" (-${qty} ${selectedProduct.unit}).`
      );
      setIsStockModalOpen(false);
      resetForms();
    } catch (err) {
      toast.error(err.message || 'Gagal memproses pengeluaran barang.');
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const actual = parseInt(adjustActualStock);
    if (isNaN(actual) || actual < 0) {
      toast.error('Jumlah stok fisik tidak valid.');
      return;
    }

    try {
      await adjustProductStock(selectedProduct.id, {
        actualStock: actual,
        reason: adjustReason || 'Koreksi hitung fisik stok di rak',
        author: user?.name || 'Admin',
      });
      toast.success(
        `Stok "${selectedProduct.name}" berhasil disesuaikan menjadi ${actual} ${selectedProduct.unit}.`
      );
      setIsStockModalOpen(false);
      resetForms();
    } catch (err) {
      toast.error(err.message || 'Gagal menyesuaikan stok.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Manajemen Persediaan Barang Koperasi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Kontrol Stok & Mutasi Barang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola barang masuk (restock), catat barang keluar (rusak/expired/retur), dan koreksi stok fisik
          </p>
        </div>

        <div>
          <button
            onClick={() => handleOpenStockModal(null, 'restock')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Kelola persediaan stok barang (barang masuk, barang keluar, atau koreksi hitung fisik)"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Kelola Stok Barang</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Jenis Produk</span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              {products.length} Produk
            </h3>
            <p className="text-[11px] text-slate-400">Tersedia di katalog koperasi</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Perlu Tambah Stok Segera</span>
            <h3 className="text-lg sm:text-xl font-extrabold text-amber-600 mt-0.5">
              {lowStockCount} Produk
            </h3>
            <p className="text-[11px] text-slate-400">Stok berada di bawah batas minimum</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Riwayat Mutasi</span>
            <h3 className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-0.5">
              {mutations.length} Catatan
            </h3>
            <p className="text-[11px] text-slate-400">Log barang masuk, keluar & kasir</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 px-4 sm:px-6 pt-3">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'inventory'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
          >
            <Package className="w-4 h-4" />
            <span>1. Posisi Stok Barang di Rak ({filteredProducts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('mutations')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'mutations'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Data Keluar-Masuk Barang ({filteredMutations.length})</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama barang, barcode, atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {activeTab === 'inventory' && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="ALL">Semua Kategori</option>
                {(categories || []).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="ALL">Semua Status Stok</option>
                <option value="CRITICAL"> Stok Menipis </option>
                <option value="SAFE"> Stok Aman</option>
              </select>
            </div>
          )}

          {activeTab === 'mutations' && (
            <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
              {[
                { id: 'ALL', label: 'Semua Aktivitas' },
                { id: 'IN', label: ' Barang Masuk (+)' },
                { id: 'OUT', label: ' Barang Keluar (-)' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setMutationTypeFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mutationTypeFilter === pill.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Harga Modal (HPP)</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Kelola Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400 text-xs italic">
                      Tidak ada data barang yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLowStock = p.stock <= (p.minStock || 5) && p.stock > 0;
                    const isOutOfStock = p.stock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {p.name}
                          <p className="text-[10px] text-slate-400 font-mono">
                            {p.barcode || p.sku || '-'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {p.category || 'Umum'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                          {formatRupiah(p.costPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(p.sellPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-md ${isOutOfStock
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : isLowStock
                                ? 'bg-amber-100 text-amber-800 font-bold'
                                : 'bg-emerald-50 text-emerald-800 font-bold'
                              }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isOutOfStock ? (
                            <Badge variant="danger" size="sm">
                              Habis
                            </Badge>
                          ) : isLowStock ? (
                            <Badge variant="warning" size="sm">
                              Menipis
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              Aman
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleOpenStockModal(p, 'restock')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                              title="Kelola stok barang ini (masuk, keluar, atau koreksi hitung fisik)"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Kelola Stok</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'mutations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4 text-center">Jenis Aktivitas</th>
                  <th className="py-3 px-4 text-center">Jumlah</th>
                  <th className="py-3 px-4">Keterangan / Alasan</th>
                  <th className="py-3 px-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMutations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400 text-xs italic">
                      Belum ada catatan keluar-masuk barang.
                    </td>
                  </tr>
                ) : (
                  filteredMutations.map((mut) => {
                    const noteText = String(mut.reason || '').toLowerCase();
                    const refNo = String(mut.referenceNo || '');
                    const isCashierSale =
                      mut.type === 'SALE' ||
                      refNo.toUpperCase().startsWith('TRX') ||
                      refNo.toUpperCase().startsWith('INV') ||
                      noteText.includes('penjualan') ||
                      noteText.includes('kasir') ||
                      noteText.includes('terjual');

                    const isManualOut =
                      mut.type === 'OUT' ||
                      noteText.includes('rusak') ||
                      noteText.includes('kadaluwarsa') ||
                      noteText.includes('retur') ||
                      noteText.includes('keluar') ||
                      noteText.includes('hilang') ||
                      noteText.includes('pemakaian');

                    const isBarangMasuk = !isCashierSale && !isManualOut;
                    const calcDiff = Math.abs((mut.newStock ?? 0) - (mut.previousStock ?? 0));
                    const qty = mut.quantity > 0 ? mut.quantity : (calcDiff > 0 ? calcDiff : 1);

                    return (
                      <tr key={mut.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {formatTanggal(mut.date, true)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {mut.productName}
                          <p className="text-[10px] text-slate-400 font-mono">{mut.sku}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isBarangMasuk ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center space-x-1">
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>Barang Masuk</span>
                            </span>
                          ) : isCashierSale ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center space-x-1">
                              <ShoppingBag className="w-3 h-3" />
                              <span>Terjual di Kasir</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center space-x-1">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>Barang Keluar</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono">
                          <span
                            className={
                              isBarangMasuk
                                ? 'text-emerald-600'
                                : isCashierSale
                                  ? 'text-blue-600'
                                  : 'text-rose-600'
                            }
                          >
                            {isBarangMasuk ? `+${qty}` : `-${qty}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700">
                          <p className="font-semibold text-slate-900">{mut.reason || '-'}</p>
                          {mut.referenceNo && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              No. Faktur: {mut.referenceNo}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                          {(() => {
                            const raw = mut.responsiblePerson || mut.author || 'Admin Koperasi';
                            const s = String(raw).trim();
                            if (
                              s.toLowerCase() === 'admin' ||
                              s.toLowerCase() === 'administrator' ||
                              s.toLowerCase().includes('administrator')
                            ) {
                              return 'Admin Koperasi';
                            }
                            return s;
                          })()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          resetForms();
        }}
        title="Kelola Persediaan Stok Barang"
        subtitle="Pilih apakah ingin menambah stok barang masuk, mencatat barang keluar, atau koreksi hitung fisik di rak"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Produk Barang <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const found = products.find((p) => p.id == e.target.value);
                setSelectedProduct(found);
                if (found) {
                  setRestockCost(formatThousand(found.costPrice));
                  setAdjustActualStock(found.stock.toString());
                }
              }}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — (Stok Saat Ini: {p.stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setStockTab('restock')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${stockTab === 'restock'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>1. Masuk (+)</span>
            </button>

            <button
              type="button"
              onClick={() => setStockTab('reduce')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${stockTab === 'reduce'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>2. Keluar (-)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStockTab('adjust');
                if (selectedProduct) setAdjustActualStock(selectedProduct.stock.toString());
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${stockTab === 'adjust'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>3. Koreksi Stok</span>
            </button>
          </div>

          {stockTab === 'restock' && (
            <form onSubmit={handleRestockSubmit} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Barang Masuk ({selectedProduct?.unit || 'Pcs'}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="Contoh: 50"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                />
                {selectedProduct && restockQty && parseInt(restockQty) > 0 && (
                  <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl mt-2 flex items-center space-x-2 text-xs text-emerald-900 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Stok saat ini: <strong>{selectedProduct.stock}</strong> + Masuk:{' '}
                      <strong>{restockQty}</strong> = Total Baru:{' '}
                      <strong className="text-emerald-700 underline">
                        {selectedProduct.stock + parseInt(restockQty)} {selectedProduct.unit}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harga Modal Beli Satuan (Rp) <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={restockCost}
                  onChange={(e) => setRestockCost(formatThousand(e.target.value))}
                  placeholder="Contoh: 20.000"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Pembelian <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Contoh: Restock Baju / ATK"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockModalOpen(false);
                    resetForms();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  Simpan Tambah Stok (+)
                </button>
              </div>
            </form>
          )}

          {stockTab === 'reduce' && (
            <form onSubmit={handleReduceSubmit} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Barang Keluar ({selectedProduct?.unit || 'Pcs'}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct?.stock || 99999}
                  required
                  value={reduceQty}
                  onChange={(e) => setReduceQty(e.target.value)}
                  placeholder="Contoh: 3"
                  className="w-full px-3.5 py-2.5 bg-white border border-rose-200 rounded-xl text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 shadow-2xs"
                />
                {selectedProduct && reduceQty && parseInt(reduceQty) > 0 && (
                  <div className="p-2.5 bg-rose-50/80 border border-rose-200 rounded-xl mt-2 flex items-center space-x-2 text-xs text-rose-900 font-semibold">
                    <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Stok saat ini: <strong>{selectedProduct.stock}</strong> - Keluar:{' '}
                      <strong>{reduceQty}</strong> = Sisa Stok:{' '}
                      <strong className="text-rose-700 underline">
                        {Math.max(0, selectedProduct.stock - parseInt(reduceQty))} {selectedProduct.unit}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Alasan Barang Keluar <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reduceCategoryReason}
                  onChange={(e) => setReduceCategoryReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                >
                  <option value="Barang Rusak / Cacat">Barang Rusak / Cacat / Pecah</option>
                  <option value="Kadaluwarsa (Expired)">Kadaluwarsa (Expired)</option>
                  <option value="Retur ke Supplier">Retur Barang ke Supplier</option>
                  <option value="Pemakaian Internal Sekolah/Koperasi">Pemakaian Internal Sekolah / Koperasi</option>
                  <option value="Hilang / Selisih Fisik">Hilang / Selisih Hitung</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Tambahan <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={reduceNotes}
                  onChange={(e) => setReduceNotes(e.target.value)}
                  placeholder="Contoh: Kemasan bocor / basi saat penyimpanan"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockModalOpen(false);
                    resetForms();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  Simpan Barang Keluar (-)
                </button>
              </div>
            </form>
          )}

          {stockTab === 'adjust' && (
            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Fisik Sebenarnya di Rak Saat Ini ({selectedProduct?.unit || 'Pcs'}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustActualStock}
                  onChange={(e) => setAdjustActualStock(e.target.value)}
                  placeholder="Jumlah real hasil hitung di rak..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600 shadow-2xs"
                />
                {selectedProduct && adjustActualStock !== '' && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl mt-2 text-xs text-slate-700 font-medium">
                    Stok saat ini: <strong>{selectedProduct.stock}</strong> → Diubah menjadi:{' '}
                    <strong className="text-slate-900">{adjustActualStock}</strong> (Selisih:{' '}
                    <span
                      className={
                        parseInt(adjustActualStock || 0) - selectedProduct.stock < 0
                          ? 'text-rose-600 font-bold'
                          : 'text-emerald-700 font-bold'
                      }
                    >
                      {parseInt(adjustActualStock || 0) - selectedProduct.stock >= 0 ? '+' : ''}
                      {parseInt(adjustActualStock || 0) - selectedProduct.stock} {selectedProduct.unit}
                    </span>
                    )
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan / Keterangan Penyesuaian <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Contoh: Hasil hitung fisik di rak / koreksi salah hitung"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockModalOpen(false);
                    resetForms();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  Simpan Perubahan Stok
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StockManagementView;
