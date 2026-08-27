import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import productService from '../services/productService';
import transactionService from '../services/transactionService';
import categoryService from '../services/categoryService';
import storageService from '../services/storageService';
import barcodeRequestService from '../services/barcodeRequestService';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const ProductContext = createContext(null);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(() => storageService.getProducts() || []);
  const [mutations, setMutations] = useState(() => storageService.getMutations() || []);
  const [transactions, setTransactions] = useState(() => storageService.getTransactions() || []);
  const [categories, setCategories] = useState(() => storageService.getCategories() || []);
  const [barcodeRequests, setBarcodeRequests] = useState(() => storageService.getBarcodeRequests() || []);
  const [coopProfile, setCoopProfile] = useState(() => (storageService.getProfile ? storageService.getProfile() : storageService.getCoopProfile ? storageService.getCoopProfile() : {}));
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const { user } = useAuth();
  const isFetchingRef = useRef(false);

  const refreshProducts = useCallback(async () => {
    // Jangan panggil jika belum login atau jika sedang proses fetching
    if (!user || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const [prodsRes, stocksRes, trxRes, catsRes, allProdsRes, syncedReqsRes] = await Promise.allSettled([
        productService.getAll({ status: true }),
        productService.getStockHistories(),
        transactionService.getAll({ user: user, role: user?.role, cashierId: user?.id }),
        categoryService.getAll(),
        productService.getAll({ status: 'all' }),
        barcodeRequestService.getAll(),
      ]);

      if (allProdsRes.status === 'fulfilled' && Array.isArray(allProdsRes.value)) {
        setProducts(allProdsRes.value);
        storageService.setProducts(allProdsRes.value);
      } else if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value)) {
        setProducts(prodsRes.value);
        storageService.setProducts(prodsRes.value);
      }

      let liveTrx = [];
      if (trxRes.status === 'fulfilled' && Array.isArray(trxRes.value)) {
        liveTrx = trxRes.value;
        setTransactions(liveTrx);
        storageService.setTransactions(liveTrx);
      } else {
        liveTrx = storageService.getTransactions() || [];
      }

      const currentProducts =
        allProdsRes.status === 'fulfilled' && Array.isArray(allProdsRes.value)
          ? allProdsRes.value
          : prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value)
          ? prodsRes.value
          : products || [];

      const normalizeAuthor = (auth) => {
        if (!auth) return 'Admin Koperasi';
        const s = String(auth).trim();
        if (
          s.toLowerCase() === 'admin' ||
          s.toLowerCase() === 'administrator' ||
          s.toLowerCase().includes('administrator')
        ) {
          return 'Admin Koperasi';
        }
        return s;
      };

      let backendStocks = [];
      if (stocksRes.status === 'fulfilled' && Array.isArray(stocksRes.value)) {
        backendStocks = stocksRes.value.map((b) => ({
          ...b,
          author: normalizeAuthor(b.author),
        }));
      }

      // Filter out manual mutations that are already saved in backend MySQL
      let manualMutations = [];
      try {
        const stored = localStorage.getItem('koperasi_manual_mutations');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            manualMutations = parsed
              .filter((m) => {
                const hasInBackend = backendStocks.some(
                  (b) =>
                    String(b.productId) === String(m.productId) &&
                    String(b.type).toUpperCase() === String(m.type).toUpperCase() &&
                    Number(b.quantity) === Number(m.quantity) &&
                    (b.reason === m.reason ||
                      Math.abs(new Date(b.date).getTime() - new Date(m.date).getTime()) < 120000)
                );
                return !hasInBackend;
              })
              .map((m) => ({
                ...m,
                author: normalizeAuthor(m.author),
              }));
          }
        }
      } catch (e) {}

      try {
        localStorage.setItem('koperasi_manual_mutations', JSON.stringify(manualMutations));
      } catch (e) {}

      // Set of existing reference numbers / sale keys in backendStocks to avoid duplicate sale mutations
      const existingBackendSalesRefs = new Set();
      backendStocks.forEach((b) => {
        if (b.referenceNo) {
          existingBackendSalesRefs.add(`${String(b.referenceNo).trim().toUpperCase()}-${b.productId}`);
        }
        if (b.reason && b.reason.includes('INV-')) {
          const match = b.reason.match(/INV-[\w-]+/);
          if (match) {
            existingBackendSalesRefs.add(`${match[0].toUpperCase()}-${b.productId}`);
          }
        }
      });

      const saleMutations = [];
      liveTrx.forEach((tx) => {
        (tx.items || []).forEach((it, idx) => {
          const pId = it.productId || it.product_id;
          const refKey = `${String(tx.invoiceNumber || '').trim().toUpperCase()}-${pId}`;
          if (!existingBackendSalesRefs.has(refKey)) {
            saleMutations.push({
              id: `sale-${tx.id || tx.invoiceNumber}-${pId || idx}`,
              productId: pId,
              productName: it.name || it.product_name || 'Barang Terjual',
              sku: it.barcode || it.sku || '-',
              type: 'SALE',
              quantity: Number(it.quantity || it.qty || 1),
              previousStock: null,
              newStock: null,
              reason: `Terjual di Kasir POS (${tx.invoiceNumber || '-'})`,
              author: normalizeAuthor(tx.cashierName || tx.cashier?.name || 'Kasir'),
              date: tx.createdAt || tx.date || new Date().toISOString(),
              referenceNo: tx.invoiceNumber,
            });
          }
        });
      });

      // Riwayat Penambahan Barang Baru (Stok Awal saat pertama kali produk dibuat)
      // Hanya tambahkan jika di backendStocks belum ada riwayat untuk produk ini
      const existingProductStockHistories = new Set(
        backendStocks.map((b) => String(b.productId))
      );

      const initialProductMutations = currentProducts
        .filter((p) => !existingProductStockHistories.has(String(p.id)) && Number(p.stock ?? 0) > 0)
        .map((p) => ({
          id: `init-prod-${p.id}`,
          productId: p.id,
          productName: p.name,
          sku: p.barcode || p.sku || '-',
          type: 'IN',
          quantity: Number(p.stock ?? 0),
          previousStock: 0,
          newStock: Number(p.stock ?? 0),
          reason: 'Penambahan Barang Baru (Stok Awal)',
          author: 'Admin Koperasi',
          date: p.createdAt || new Date().toISOString(),
          referenceNo: `PROD-${p.id}`,
        }));

      const allCombinedMutations = [
        ...backendStocks,
        ...saleMutations,
        ...initialProductMutations,
        ...(Array.isArray(manualMutations) ? manualMutations : []),
      ];

      const mutationMap = new Map();
      allCombinedMutations.forEach((m) => {
        if (m && m.id && !mutationMap.has(String(m.id))) {
          mutationMap.set(String(m.id), m);
        }
      });

      const sortedMutations = Array.from(mutationMap.values()).sort(
        (a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
      );

      setMutations(sortedMutations);
      storageService.setMutations(sortedMutations);

      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
        setCategories(catsRes.value);
        storageService.setCategories(catsRes.value);
      }

      // Ambil daftar permintaan barcode live dari kasir
      const syncedList = syncedReqsRes.status === 'fulfilled' && Array.isArray(syncedReqsRes.value) ? syncedReqsRes.value : [];

      // Dapatkan semua barcode yang sudah resmi terdaftar di sistem
      const existingProductBarcodes = new Set(
        (allProdsRes.status === 'fulfilled' && Array.isArray(allProdsRes.value) ? allProdsRes.value : products || [])
          .map((p) => String(p.barcode || '').trim())
          .filter(Boolean)
      );

      // Hanya tampilkan barcode yang BELUM pernah didaftarkan dan berstatus pending
      const activeBarcodeRequests = syncedList.filter((r) => {
        const clean = String(r.barcode || '').trim();
        return clean && !existingProductBarcodes.has(clean) && r.status !== 'completed';
      });

      setBarcodeRequests(activeBarcodeRequests);
    } catch (err) {
      console.warn('Backend sync warning:', err.message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user]);

  // Sinkronisasi live berkala (polling 5 detik & onFocus) agar admin di PC langsung menerima alert dari HP
  useEffect(() => {
    if (user) {
      refreshProducts();
      const interval = setInterval(() => {
        refreshProducts();
      }, 5000);

      const handleFocus = () => {
        refreshProducts();
      };
      window.addEventListener('focus', handleFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      setProducts([]);
      setMutations([]);
      setTransactions([]);
      setCategories(storageService.getCategories() || []);
      setBarcodeRequests([]);
    }
  }, [user, refreshProducts]);

  // Tambah Master Barang (Async)
  const addProduct = async (productData) => {
    try {
      const created = await productService.create({
        ...productData,
        responsiblePerson: user?.name || 'Admin Koperasi',
      });

      const initialStock = Number(productData.stock || created?.stock || 0);

      // Jika barang baru yang diinput memiliki stok awal > 0, catat ke riwayat mutasi
      if (initialStock > 0) {
        const newMutation = {
          id: `init-prod-${created?.id || Date.now()}`,
          productId: created?.id || `prod-${Date.now()}`,
          productName: created?.name || productData.name || 'Barang Baru',
          sku: created?.barcode || productData.barcode || created?.sku || productData.sku || '-',
          type: 'IN',
          quantity: initialStock,
          previousStock: 0,
          newStock: initialStock,
          reason: 'Penambahan Barang Baru (Stok Awal)',
          author: user?.name || 'Admin Koperasi',
          date: created?.createdAt || new Date().toISOString(),
          referenceNo: `PROD-${created?.id || Date.now()}`,
        };

        try {
          const currentManual = JSON.parse(localStorage.getItem('koperasi_manual_mutations') || '[]');
          localStorage.setItem(
            'koperasi_manual_mutations',
            JSON.stringify([newMutation, ...currentManual].slice(0, 200))
          );
        } catch (e) {}

        const currentMutations = storageService.getMutations();
        const updatedMutations = [newMutation, ...currentMutations];
        storageService.setMutations(updatedMutations);
        setMutations(updatedMutations);
      }

      // Jika barang yang ditambahkan berasal dari permintaan kasir, hapus otomatis permintaannya
      if (productData.barcode) {
        const cleanBc = String(productData.barcode).trim();
        await barcodeRequestService.delete(cleanBc);
        setBarcodeRequests((prev) => prev.filter((r) => String(r.barcode).trim() !== cleanBc));
      }

      await refreshProducts();
      return created;
    } catch (error) {
      throw error;
    }
  };

  // Update Master Barang (Async)
  const updateProduct = async (id, productData) => {
    try {
      const updated = await productService.update(id, productData);
      await refreshProducts();
      return updated;
    } catch (error) {
      throw error;
    }
  };

  // Hapus / Nonaktifkan Master Barang (Async)
  const deleteProduct = async (id) => {
    try {
      await productService.delete(id);
      // Hapus langsung dari state reaktif
      setProducts((prev) => prev.filter((p) => p.id != id && String(p.id) !== String(id)));
      // Hapus dari penyimpanan lokal
      const localProducts = storageService.getProducts();
      storageService.setProducts(localProducts.filter((p) => p.id != id && String(p.id) !== String(id)));
      await refreshProducts();
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Restock Barang Masuk (Async)
  const restockProduct = async (id, payloadOrQty, reasonStr) => {
    try {
      let qty = 0;
      let reason = 'Restock Barang Masuk';
      let cost = null;

      if (typeof payloadOrQty === 'object' && payloadOrQty !== null) {
        qty = payloadOrQty.quantity;
        reason = payloadOrQty.reason || reason;
        cost = payloadOrQty.newCostPrice;
      } else {
        qty = payloadOrQty;
        reason = reasonStr || reason;
      }

      const res = await productService.addStock({
        productId: id,
        quantity: qty,
        costPrice: cost,
        notes: reason,
      });

      await refreshProducts();
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Penyesuaian Stok Cek Fisik (Async)
  const adjustProductStock = async (id, payloadOrTarget, reasonStr) => {
    try {
      let targetStock = 0;
      let reason = 'Koreksi Jumlah Stok di Rak';

      if (typeof payloadOrTarget === 'object' && payloadOrTarget !== null) {
        targetStock = Number(payloadOrTarget.actualStock || 0);
        reason = payloadOrTarget.reason || reason;
      } else {
        targetStock = Number(payloadOrTarget || 0);
        reason = reasonStr || reason;
      }

      const prod = (products || []).find((p) => String(p.id) === String(id));
      if (!prod) {
        throw new Error('Barang tidak ditemukan.');
      }

      const prevStock = prod.stock;
      const diff = targetStock - prevStock;

      let res = null;
      if (diff > 0) {
        res = await productService.addStock({
          productId: id,
          quantity: diff,
          notes: reason || 'Koreksi Stok Fisik Bertambah',
        });
      } else if (diff < 0) {
        res = await productService.reduceStock({
          productId: id,
          quantity: Math.abs(diff),
          note: reason || 'Koreksi Stok Fisik Berkurang',
        });
      } else {
        return prod;
      }

      await refreshProducts();
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Pengeluaran Stok Manual (Barang Rusak, Kadaluwarsa, Retur, Pemakaian Internal)
  const reduceProductStock = async (id, payloadOrQty, reasonStr) => {
    try {
      let qty = 0;
      let reason = 'Pengeluaran Stok Manual';
      let author = user?.name || 'Admin';

      if (typeof payloadOrQty === 'object' && payloadOrQty !== null) {
        qty = Number(payloadOrQty.quantity || 0);
        reason = payloadOrQty.reason || reason;
        author = payloadOrQty.author || author;
      } else {
        qty = Number(payloadOrQty || 0);
        reason = reasonStr || reason;
      }

      if (qty <= 0) {
        throw new Error('Jumlah barang keluar harus lebih dari 0.');
      }

      const prod = (products || []).find((p) => String(p.id) === String(id));
      if (!prod) {
        throw new Error('Barang tidak ditemukan di sistem.');
      }

      if (prod.stock < qty) {
        throw new Error(`Stok saat ini (${prod.stock} ${prod.unit}) tidak mencukupi untuk dikeluarkan sebanyak ${qty} ${prod.unit}.`);
      }

      let res = null;
      let apiSuccess = false;
      try {
        // Panggil endpoint backend /stocks/reduce agar tersimpan ke tabel stock_histories MySQL
        res = await productService.reduceStock({
          productId: id,
          quantity: qty,
          note: reason,
        });
        apiSuccess = true;
      } catch (errApi) {
        console.warn('Backend reduceStock API fallback:', errApi.message);
        // Fallback update master product jika backend belum di-restart / diperbarui
        const targetStock = Math.max(0, prod.stock - qty);
        res = await productService.update(id, { stock: targetStock });
      }

      // Catat mutasi keluar manual lokal HANYA jika endpoint backend gagal / offline
      if (!apiSuccess) {
        const newMutation = {
          id: `mut-out-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku || prod.barcode,
          type: 'OUT',
          previousStock: prod.stock,
          quantity: qty,
          newStock: Math.max(0, prod.stock - qty),
          reason: reason,
          author: author,
          date: new Date().toISOString(),
        };

        storageService.addManualMutation(newMutation);
      }

      await refreshProducts();
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Tambah Kategori (Async)
  const addCategory = async (catData) => {
    try {
      const res = await categoryService.create(catData);
      await refreshProducts();
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Update Kategori (Async)
  const updateCategory = async (id, catData) => {
    try {
      const res = await categoryService.update(id, catData);
      await refreshProducts();
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Hapus Kategori (Async)
  const deleteCategory = async (id) => {
    try {
      const res = await categoryService.delete(id);
      await refreshProducts();
      return res;
    } catch (error) {
      throw error;
    }
  };

  // Update Profil Koperasi
  const updateCoopProfile = (newProfile) => {
    storageService.setProfile(newProfile);
    setCoopProfile(newProfile);
  };

  useEffect(() => {
    const handleRequestsChange = () => {
      setBarcodeRequests(storageService.getBarcodeRequests() || []);
    };
    window.addEventListener('koperasi_barcode_request_change', handleRequestsChange);
    window.addEventListener('storage', handleRequestsChange);
    return () => {
      window.removeEventListener('koperasi_barcode_request_change', handleRequestsChange);
      window.removeEventListener('storage', handleRequestsChange);
    };
  }, []);

  const addBarcodeRequest = async (req) => {
    const newReq = await barcodeRequestService.create(req);
    await refreshProducts();
    return newReq;
  };

  const removeBarcodeRequest = async (idOrBarcode) => {
    const clean = String(idOrBarcode || '').trim();
    await barcodeRequestService.delete(clean);
    setBarcodeRequests((prev) =>
      prev.filter((r) => r.id !== clean && String(r.barcode).trim() !== clean)
    );
  };

  const completeBarcodeRequest = async (idOrBarcode) => {
    const clean = String(idOrBarcode || '').trim();
    await barcodeRequestService.delete(clean);
    setBarcodeRequests((prev) =>
      prev.filter((r) => r.id !== clean && String(r.barcode).trim() !== clean)
    );
    await refreshProducts();
  };

  const pendingBarcodeRequests = (barcodeRequests || []).filter((r) => r.status !== 'completed');
  const pendingBarcodeRequestsCount = pendingBarcodeRequests.length;

  const lowStockList = (products || []).filter((p) => p.stock <= p.minStock && p.stock > 0);
  const outOfStockList = (products || []).filter((p) => p.stock <= 0);
  const lowStockCount = lowStockList.length + outOfStockList.length;

  return (
    <ProductContext.Provider
      value={{
        products: products || [],
        mutations: mutations || [],
        transactions: transactions || [],
        categories: categories || [],
        barcodeRequests: barcodeRequests || [],
        pendingBarcodeRequests,
        pendingBarcodeRequestsCount,
        addBarcodeRequest,
        removeBarcodeRequest,
        completeBarcodeRequest,
        coopProfile: coopProfile || {},
        loading,
        refreshProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        restockProduct,
        reduceProductStock,
        adjustProductStock,
        adjustStock: adjustProductStock,
        updateCoopProfile,
        updateProfile: updateCoopProfile,
        lowStockList,
        outOfStockList,
        lowStockCount,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export default ProductProvider;
