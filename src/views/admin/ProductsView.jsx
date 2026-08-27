import { useState, useMemo } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../../context/ToastContext';
import { formatRupiah } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import ProductFormModal from '../../components/products/ProductFormModal';
import CategoryManagementModal from '../../components/products/CategoryManagementModal';
import BarcodeLabelPrinterModal from '../../components/products/BarcodeLabelPrinterModal';
import Modal from '../../components/common/Modal';
import {
  Package,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  Barcode,
  CheckCircle2,
} from 'lucide-react';

export const ProductsView = () => {
  const { products, categories, deleteProduct, updateProduct } = useProducts();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedProductForLabel, setSelectedProductForLabel] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productToDeactivate, setProductToDeactivate] = useState(null);

  const inactiveCount = useMemo(() => {
    return products.filter((p) => p.status === false).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === 'ALL' || p.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q));

      const isOutOfStock = p.stock === 0;
      const isLowStock = p.stock > 0 && p.stock <= p.minStock;
      const isInactive = p.status === false;
      const isActive = p.status !== false;

      let matchStatus = true;
      if (statusFilter === 'ACTIVE') matchStatus = isActive;
      if (statusFilter === 'INACTIVE') matchStatus = isInactive;
      if (statusFilter === 'LOW') matchStatus = isLowStock && isActive;
      if (statusFilter === 'OUT') matchStatus = isOutOfStock && isActive;

      return matchCategory && matchQuery && matchStatus;
    });
  }, [products, selectedCategory, searchQuery, statusFilter]);

  const handleOpenAddModal = () => {
    setSelectedProductForEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setSelectedProductForEdit(product);
    setIsFormModalOpen(true);
  };

  const handleOpenLabelModal = (product) => {
    setSelectedProductForLabel(product);
    setIsLabelModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const target = productToDelete;
    setProductToDelete(null);
    try {
      await deleteProduct(target.id);
      toast.success(`Barang "${target.name}" berhasil dihapus.`);
    } catch (e) {
      if (
        e.isForeignKeyConstraint ||
        e.message?.toLowerCase().includes('foreign key') ||
        e.message?.toLowerCase().includes('sale_items') ||
        e.message?.toLowerCase().includes('riwayat')
      ) {
        setProductToDeactivate(target);
      } else {
        toast.error(e.message || 'Gagal menghapus barang.');
      }
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!productToDeactivate) return;
    try {
      await updateProduct(productToDeactivate.id, {
        status: false,
      });
      toast.success(`Barang "${productToDeactivate.name}" berhasil dinonaktifkan dari kasir POS.`);
    } catch (e) {
      toast.error(e.message || 'Gagal menonaktifkan barang.');
    } finally {
      setProductToDeactivate(null);
    }
  };

  const handleReactivateProduct = async (product) => {
    try {
      await updateProduct(product.id, {
        status: true,
      });
      toast.success(`Barang "${product.name}" berhasil diaktifkan kembali dan kini muncul di kasir POS.`);
    } catch (e) {
      toast.error(e.message || 'Gagal mengaktifkan barang.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Katalog & Inventori Barang</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Master Data Barang Koperasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Total terdaftar: <strong className="text-slate-700">{products.length} barang</strong> di {categories?.length || 0} kategori
            {inactiveCount > 0 && (
              <span className="text-amber-700 font-semibold ml-1.5">
                ({inactiveCount} nonaktif)
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            title="Kelola Daftar Kategori Barang"
          >
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Kelola Kategori</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang Baru</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama barang, kode barcode..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="ALL">Semua Kategori</option>
              {(categories || []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'ACTIVE', label: 'Aktif' },
              { id: 'LOW', label: 'Menipis' },
              { id: 'OUT', label: 'Habis (0)' },
              { id: 'INACTIVE', label: `Nonaktif${inactiveCount > 0 ? ` (${inactiveCount})` : ''}` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? tab.id === 'INACTIVE'
                      ? 'bg-white text-slate-700 shadow-xs'
                      : tab.id === 'OUT'
                        ? 'bg-white text-rose-700 shadow-xs'
                        : tab.id === 'LOW'
                          ? 'bg-white text-amber-700 shadow-xs'
                          : 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama Barang</th>
                <th className="py-3.5 px-4">Barcode</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-right">Modal (HPP)</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-center">Diskon</th>
                <th className="py-3.5 px-4 text-center">Stok</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Tidak ada data barang yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock === 0;
                  const isLowStock = product.stock > 0 && product.stock <= (product.minStock || 5);
                  const isInactive = product.status === false;
                  const finalSellPrice = Math.max(0, product.sellPrice - (product.discount || 0));
                  const profitMargin = Math.max(0, finalSellPrice - product.costPrice);

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isInactive ? 'bg-slate-50/40 opacity-80' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{product.name}</span>
                          {isInactive && (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-200 text-slate-600">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                          SKU: {product.sku}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {product.barcode ? (
                          <div className="flex items-center space-x-1.5">
                            <Barcode className="w-3.5 h-3.5 text-slate-400" />
                            <span>{product.barcode}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Tanpa Barcode</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                          {product.category || 'Umum'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {formatRupiah(product.costPrice)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className="font-bold text-slate-900 block">
                          {formatRupiah(product.sellPrice)}
                        </span>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          +{formatRupiah(profitMargin)}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        {product.discount > 0 ? (
                          <span className="text-rose-600 font-bold">
                            -{formatRupiah(product.discount)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-sm text-slate-900">
                          {product.stock}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isInactive ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-200 text-slate-600 border border-slate-300">
                            Nonaktif
                          </span>
                        ) : isOutOfStock ? (
                          <Badge variant="danger" size="sm">
                            Habis (0)
                          </Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning" size="sm">
                            Menipis ({product.stock})
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Aktif
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isInactive ? (
                            <button
                              type="button"
                              onClick={() => handleReactivateProduct(product)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                              title="Aktifkan Kembali ke Kasir POS"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aktifkan</span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleOpenLabelModal(product)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Cetak Label Barcode"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Edit Data Barang"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus / Nonaktifkan Barang"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        productToEdit={selectedProductForEdit}
      />

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <BarcodeLabelPrinterModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        selectedProduct={selectedProductForLabel}
      />

      {productToDelete && (
        <Modal
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          title="Konfirmasi Hapus Barang"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus barang{' '}
              <strong className="text-slate-900 font-bold">"{productToDelete.name}"</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ya, Hapus Barang
              </button>
            </div>
          </div>
        </Modal>
      )}

      {productToDeactivate && (
        <Modal
          isOpen={!!productToDeactivate}
          onClose={() => setProductToDeactivate(null)}
          title="Barang Memiliki Riwayat Penjualan"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-1">
              <p className="font-bold">Tidak Dapat Dihapus Permanen</p>
              <p className="text-amber-800 text-xs leading-relaxed">
                Barang <strong>"{productToDeactivate.name}"</strong> sudah pernah terjual dan tercatat di struk transaksi. Database memproteksi data ini agar riwayat keuangan dan audit laba rugi tetap akurat.
              </p>
            </div>
            <p className="text-xs text-slate-600">
              Sebagai solusinya, Anda dapat <strong>Menonaktifkan Barang Ini</strong> agar tidak lagi muncul di layar penjualan kasir POS.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setProductToDeactivate(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeactivate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Nonaktifkan Barang
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductsView;
