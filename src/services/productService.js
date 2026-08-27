import api from './api';

export const normalizeProduct = (p) => {
  if (!p) return null;
  return {
    id: p.id || p.product_id || p._id,
    name: p.name || p.product_name || '',
    barcode: p.barcode || '',
    sku: p.sku || p.code || (p.barcode ? `BRC-${p.barcode.slice(-4)}` : `PRD-${p.id}`),
    category: p.category?.name || p.category_name || (typeof p.category === 'string' ? p.category : 'Umum'),
    categoryId: p.category_id || p.categoryId || (typeof p.category === 'object' ? p.category?.id : null),
    unit: p.unit || 'Pcs',
    costPrice: Number(p.purchase_price ?? p.purchasePrice ?? p.cost_price ?? p.costPrice ?? p.hpp ?? 0),
    sellPrice: Number(p.selling_price ?? p.sellingPrice ?? p.sell_price ?? p.sellPrice ?? p.price ?? 0),
    stock: Number(p.stock ?? p.quantity ?? p.qty ?? 0),
    minStock: Number(p.min_stock ?? p.minStock ?? p.minimum_stock ?? 5),
    discount: Number(p.discount ?? 0),
    description: p.description || '',
    image: p.image || p.image_url || '',
    status: p.status !== undefined ? p.status : true,
    createdAt: p.created_at || p.createdAt || new Date().toISOString(),
    updatedAt: p.updated_at || p.updatedAt || new Date().toISOString(),
  };
};

export const normalizeStockHistory = (m) => {
  if (!m) return null;
  const prevStock = Number(m.previous_stock ?? m.previousStock ?? m.old_stock ?? m.stok_awal ?? 0);
  const newStock = Number(m.new_stock ?? m.newStock ?? m.current_stock ?? m.stok_akhir ?? 0);

  let rawQty = m.quantity ?? m.qty ?? m.amount ?? m.change ?? m.qty_change ?? m.stock_change ?? m.jumlah ?? m.stok_masuk;
  let isNegative = Number(rawQty) < 0;
  let parsedQty = rawQty !== undefined && rawQty !== null && !isNaN(Number(rawQty)) ? Math.abs(Number(rawQty)) : 0;

  if (parsedQty === 0 && newStock !== prevStock) {
    parsedQty = Math.abs(newStock - prevStock);
    if (newStock < prevStock) isNegative = true;
  }

  const noteText = String(m.note || m.notes || m.reason || m.keterangan || '').toLowerCase();
  const refNo = String(m.reference_no || m.referenceNo || m.invoice_no || m.faktur || '');
  const isSaleRef = refNo.toUpperCase().startsWith('TRX') || refNo.toUpperCase().startsWith('INV') || refNo.toUpperCase().startsWith('POS');
  const isSaleNote = noteText.includes('penjualan') || noteText.includes('kasir') || noteText.includes('terjual') || noteText.includes('transaksi');
  const isReduceNote = noteText.includes('rusak') || noteText.includes('keluar') || noteText.includes('expired') || noteText.includes('kadaluwarsa') || noteText.includes('retur') || noteText.includes('internal') || noteText.includes('kurang') || noteText.includes('hilang');

  let type = 'IN';
  if (isNegative || isSaleRef || isSaleNote || isReduceNote || m.type === 'OUT' || m.type === 'SALE' || m.type === 'reduce') {
    type = 'OUT';
  } else {
    type = 'IN';
  }

  let rawAuthor = m.user?.name || m.author || m.user_name || m.userName || 'Admin Koperasi';
  const cleanAuthor = String(rawAuthor).trim();
  if (
    cleanAuthor.toLowerCase() === 'administrator' ||
    cleanAuthor.toLowerCase() === 'admin' ||
    cleanAuthor.toLowerCase().includes('administrator')
  ) {
    rawAuthor = 'Admin Koperasi';
  }

  return {
    id: m.id || m.history_id || m.stock_id || `mut-${Date.now()}-${Math.random()}`,
    productId: m.product_id || m.productId,
    productName: m.product?.name || m.product_name || m.productName || m.name || 'Produk',
    sku: m.sku || m.product?.barcode || m.product?.sku || m.barcode || '-',
    type: type,
    quantity: parsedQty,
    previousStock: prevStock,
    newStock: newStock,
    reason: m.note || m.notes || m.reason || m.keterangan || (type === 'IN' ? 'Barang Masuk / Restock' : 'Barang Keluar / Pengurangan Stok'),
    author: rawAuthor,
    date: m.createdAt || m.created_at || m.date || m.tanggal || new Date().toISOString(),
    referenceNo: m.reference_no || m.referenceNo || m.invoice_no || m.faktur || null,
  };
};

class ProductService {
  async getAll(params = {}) {
    const query = {
      page: params.page || 1,
      limit: params.limit || 1000,
      ...(params.search ? { search: params.search } : {}),
      ...(params.categoryId ? { category_id: params.categoryId } : {}),
    };

    if (params.status !== undefined && params.status !== 'all') {
      query.status = params.status;
    }

    const res = await api.get('/products', { params: query });
    const rawList = res.data?.products || res.data || res.products || (Array.isArray(res) ? res : []);
    return rawList.map(normalizeProduct);
  }

  async getById(id) {
    const res = await api.get(`/products/${id}`);
    const raw = res.data?.product || res.data || res;
    return normalizeProduct(raw);
  }

  async getByBarcode(barcode) {
    if (!barcode) return null;
    const cleanBarcode = encodeURIComponent(barcode.trim());
    const res = await api.get(`/products/barcode/${cleanBarcode}`);
    const raw = res.data?.product || res.data || res;
    return normalizeProduct(raw);
  }

  async create(productData) {
    const cleanBarcode = productData.barcode ? String(productData.barcode).trim() : '';
    const catId = Number(productData.categoryId || productData.category_id || 1);
    const costPrice = Number(productData.costPrice ?? productData.purchase_price ?? productData.cost_price ?? 0);
    const sellPrice = Number(productData.sellPrice ?? productData.selling_price ?? productData.sell_price ?? 0);
    const discount = Number(productData.discount ?? 0);
    const stock = Number(productData.stock ?? 0);
    const status = productData.status !== undefined ? Boolean(productData.status) : true;

    const finalBarcode = cleanBarcode || `899${Math.floor(100000000 + Math.random() * 900000000)}`;

    const payload = {
      name: productData.name?.trim(),
      barcode: finalBarcode,
      category_id: catId,
      purchase_price: costPrice,
      selling_price: sellPrice,
      discount: discount,
      stock: stock,
      status: status,
    };

    const res = await api.post('/products', payload);
    const raw = res.data?.product || res.data || res;
    return normalizeProduct(raw);
  }

  async update(id, productData) {
    const payload = {
      ...(productData.name ? { name: productData.name.trim() } : {}),
      ...(productData.categoryId || productData.category_id
        ? { category_id: Number(productData.categoryId || productData.category_id) }
        : {}),
      ...(productData.costPrice !== undefined || productData.purchase_price !== undefined
        ? { purchase_price: Number(productData.costPrice ?? productData.purchase_price) }
        : {}),
      ...(productData.sellPrice !== undefined || productData.selling_price !== undefined
        ? { selling_price: Number(productData.sellPrice ?? productData.selling_price) }
        : {}),
      ...(productData.discount !== undefined ? { discount: Number(productData.discount) } : {}),
      ...(productData.stock !== undefined ? { stock: Number(productData.stock) } : {}),
      ...(productData.status !== undefined
        ? {
            status: Boolean(productData.status),
            is_active: Boolean(productData.status) ? 1 : 0,
          }
        : {}),
    };

    if (productData.barcode !== undefined && productData.barcode !== null && String(productData.barcode).trim() !== '') {
      payload.barcode = String(productData.barcode).trim();
    }

    const res = await api.put(`/products/${id}`, payload);
    const raw = res.data?.product || res.data || res;
    return normalizeProduct(raw);
  }

  async delete(id) {
    try {
      const res = await api.delete(`/products/${id}`);
      return res.data || res;
    } catch (err) {
      const rawMsg = err?.response?.data?.message || err?.message || '';
      if (
        rawMsg.toLowerCase().includes('foreign key') ||
        rawMsg.toLowerCase().includes('sale_items') ||
        rawMsg.toLowerCase().includes('parent row') ||
        rawMsg.toLowerCase().includes('restrict') ||
        rawMsg.toLowerCase().includes('constraint')
      ) {
        const customErr = new Error(
          'Barang tidak dapat dihapus permanen karena sudah memiliki riwayat penjualan/transaksi. Anda dapat menonaktifkannya agar tidak muncul di kasir.'
        );
        customErr.isForeignKeyConstraint = true;
        throw customErr;
      }
      throw err;
    }
  }

  async addStock({ productId, quantity, note, notes, reason }) {
    const payload = {
      product_id: Number(productId),
      quantity: Number(quantity),
      note: note || notes || reason || 'Barang masuk dari supplier',
    };

    const res = await api.post('/stocks', payload);
    return res.data || res;
  }

  async reduceStock({ productId, quantity, note, notes, reason }) {
    const payload = {
      product_id: Number(productId),
      quantity: Number(quantity),
      note: note || notes || reason || 'Pengeluaran stok barang',
    };

    const res = await api.post('/stocks/reduce', payload);
    return res.data || res;
  }

  async getStockHistories(params = {}) {
    const query = {
      page: params.page || 1,
      limit: params.limit || 500,
      ...(params.productId ? { product_id: params.productId } : {}),
      ...(params.startDate ? { start_date: params.startDate } : {}),
      ...(params.endDate ? { end_date: params.endDate } : {}),
    };

    const res = await api.get('/stocks/histories', { params: query });
    let rawList = [];

    if (Array.isArray(res.data?.histories)) {
      rawList = res.data.histories;
    } else if (Array.isArray(res.data?.data)) {
      rawList = res.data.data;
    } else if (Array.isArray(res.data?.stocks)) {
      rawList = res.data.stocks;
    } else if (Array.isArray(res.data?.rows)) {
      rawList = res.data.rows;
    } else if (Array.isArray(res.data)) {
      rawList = res.data;
    } else if (Array.isArray(res.histories)) {
      rawList = res.histories;
    } else if (Array.isArray(res)) {
      rawList = res;
    }

    return rawList.map(normalizeStockHistory);
  }
}

export const productService = new ProductService();
export default productService;
