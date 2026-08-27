import { useState } from 'react';
import Modal from '../common/Modal';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../../context/ToastContext';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Package,
  Layers,
} from 'lucide-react';

export const CategoryManagementModal = ({ isOpen, onClose }) => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useProducts();
  const toast = useToast();

  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.warning('Nama kategori tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addCategory({ name: newCatName.trim() });
      toast.success(`Kategori "${newCatName.trim()}" berhasil ditambahkan.`);
      setNewCatName('');
    } catch (err) {
      toast.error(err.message || 'Gagal menambahkan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (cat) => {
    setEditingCatId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = async (catId) => {
    if (!editingName.trim()) {
      toast.warning('Nama kategori tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCategory(catId, { name: editingName.trim() });
      toast.success('Kategori berhasil diperbarui.');
      setEditingCatId(null);
      setEditingName('');
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const productCount = (products || []).filter(
      (p) => p.categoryId === cat.id || p.category_id === cat.id || p.category?.toLowerCase() === cat.name?.toLowerCase()
    ).length;

    if (productCount > 0) {
      if (
        !window.confirm(
          `Peringatan: Terdapat ${productCount} barang di bawah kategori "${cat.name}". Apakah Anda yakin ingin menghapusnya?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Hapus kategori "${cat.name}"?`)) {
        return;
      }
    }

    try {
      await deleteCategory(cat.id);
      toast.success(`Kategori "${cat.name}" berhasil dihapus.`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus kategori.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kelola Master Kategori Barang"
      size="md"
    >
      <div className="space-y-4">
        {/* Form Tambah Kategori Cepat */}
        <form onSubmit={handleCreateCategory} className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ketik nama kategori baru (misal: Seragam, ATK, Makanan)"
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newCatName.trim()}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </form>

        {/* List Kategori */}
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {(!categories || categories.length === 0) ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Belum ada kategori yang terdaftar. Tambahkan kategori baru di atas.
            </div>
          ) : (
            categories.map((cat, idx) => {
              const productCount = (products || []).filter(
                (p) =>
                  p.categoryId === cat.id ||
                  p.category_id === cat.id ||
                  p.category?.toLowerCase() === cat.name?.toLowerCase()
              ).length;

              const isEditing = editingCatId === cat.id;

              return (
                <div
                  key={cat.id || idx}
                  className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center space-x-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-emerald-500 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                        title="Simpan"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                        title="Batal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900">
                            {cat.name}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Package className="w-3 h-3 text-slate-400" />
                            <span>{productCount} Barang terdaftar</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Nama Kategori"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Total: <strong>{categories?.length || 0} Kategori</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryManagementModal;
