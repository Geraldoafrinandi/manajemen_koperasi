import api from './api';
import storageService from './storageService';

export const normalizeTransaction = (t) => {
  if (!t || typeof t !== 'object') return null;

  const rawItems = t.items || t.details || t.transaction_details || t.transactionDetails || [];
  const items = (Array.isArray(rawItems) ? rawItems : []).map((item) => {
    const rawPrice =
      item.selling_price ??
      item.price ??
      item.sell_price ??
      item.sellPrice ??
      item.unit_price ??
      item.product?.selling_price ??
      item.product?.price ??
      item.product?.sell_price ??
      0;
    const rawCost =
      item.cost_price ??
      item.costPrice ??
      item.modal ??
      item.purchase_price ??
      item.product?.cost_price ??
      item.product?.purchase_price ??
      0;
    const quantity = Number(item.quantity || item.qty || 1);
    const itemDiscount = Number(item.discount || item.item_discount || 0);
    const subtotal = Number(
      item.subtotal ??
      ((Number(rawPrice) - itemDiscount) * quantity)
    );

    return {
      id: item.id || item.product_id || item.productId,
      productId: item.product_id || item.productId || item.product?.id || item.id,
      name:
        item.product?.name ||
        item.product_name ||
        item.productName ||
        item.name ||
        'Barang Koperasi',
      barcode: item.product?.barcode || item.barcode || '',
      sku: item.product?.sku || item.sku || '',
      sellPrice: Number(rawPrice),
      costPrice: Number(rawCost),
      discount: itemDiscount,
      quantity: quantity,
      subtotal: subtotal,
      unit: item.unit || item.product?.unit || 'pcs',
      category: item.category || item.product?.category?.name || item.category_name || 'Umum',
    };
  });

  const grandTotal = Number(
    t.total ??
    t.grand_total ??
    t.grandTotal ??
    t.total_amount ??
    t.totalAmount ??
    t.final_amount ??
    items.reduce((sum, i) => sum + (i.subtotal || 0), 0)
  );

  const calculatedItemsSubtotal = items.reduce(
    (sum, i) => sum + ((Number(i.sellPrice) || 0) * (Number(i.quantity) || 1)),
    0
  );

  const subtotal = Number(
    t.subtotal ??
    (calculatedItemsSubtotal > 0 ? calculatedItemsSubtotal : grandTotal)
  );

  const itemLevelDiscount = items.reduce(
    (sum, i) => sum + ((Number(i.discount) || 0) * (Number(i.quantity) || 1)),
    0
  );

  let totalDiscount = Number(
    t.discount ??
    t.discount_total ??
    t.discountTotal ??
    itemLevelDiscount
  );

  if (totalDiscount <= 0 && subtotal > grandTotal) {
    totalDiscount = subtotal - grandTotal;
  }

  const totalCost = Number(
    t.total_cost ??
    t.totalCost ??
    items.reduce((sum, i) => sum + (i.costPrice * i.quantity), 0)
  );

  const profit = Number(t.profit ?? (grandTotal - totalCost));

  const rawMethod = String(
    t.payment_method ??
    t.paymentMethod ??
    t.payment_type ??
    t.paymentType ??
    t.method ??
    t.metode_pembayaran ??
    t.payment ??
    'Cash'
  ).trim();

  let paymentMethod = 'Cash';
  if (rawMethod.toLowerCase().includes('qris')) {
    paymentMethod = 'QRIS';
  } else if (
    rawMethod.toLowerCase().includes('transfer') ||
    rawMethod.toLowerCase().includes('bank') ||
    rawMethod.toLowerCase().includes('tf')
  ) {
    paymentMethod = 'Transfer';
  } else {
    paymentMethod = 'Cash';
  }

  return {
    id: t.id || t.transaction_id || t.transactionId || `trx-${Date.now()}`,
    invoiceNumber:
      t.invoice_number ||
      t.invoiceNumber ||
      t.code ||
      t.invoice_no ||
      t.invoiceNo ||
      t.no_faktur ||
      (t.id ? `TRX-${t.id}` : `TRX-${Date.now()}`),
    cashierId: t.user_id || t.cashier_id || t.cashierId || t.user?.id || t.userId,
    cashierName:
      t.user?.name ||
      t.cashier_name ||
      t.cashierName ||
      t.user_name ||
      t.cashier?.name ||
      'Petugas Kasir',
    paymentMethod: paymentMethod,
    subtotal: subtotal,
    discount: totalDiscount,
    discountTotal: totalDiscount,
    grandTotal: grandTotal,
    cashPaid: Number(
      t.paid ??
      t.cash_paid ??
      t.cashPaid ??
      t.paid_amount ??
      t.paidAmount ??
      grandTotal
    ),
    change: Number(t.change ?? t.return_amount ?? t.returnAmount ?? 0),
    totalCost: totalCost,
    profit: profit,
    items: items,
    createdAt:
      t.createdAt ||
      t.created_at ||
      t.date ||
      t.transaction_date ||
      t.timestamp ||
      new Date().toISOString(),
  };
};

class TransactionService {
  async getAll(params = {}) {
    const user = params.user || null;
    const isCashier = params.role === 'cashier' || user?.role === 'cashier';

    const query = {
      page: params.page || 1,
      limit: params.limit || 500,
      ...(user?.id ? { user_id: user.id, cashier_id: user.id } : {}),
      ...(params.startDate ? { start_date: params.startDate } : {}),
      ...(params.endDate ? { end_date: params.endDate } : {}),
      ...(params.paymentMethod ? { payment_method: params.paymentMethod } : {}),
    };

    try {
      let res;
      try {
        res = await api.get('/transactions', { params: query });
      } catch (errGet) {
        if (errGet.message?.includes('404')) {
          res = await api.get('/sales', { params: query });
        } else {
          throw errGet;
        }
      }

      let rawList = [];

      if (Array.isArray(res)) {
        rawList = res;
      } else if (Array.isArray(res?.sales)) {
        rawList = res.sales;
      } else if (Array.isArray(res?.data?.sales)) {
        rawList = res.data.sales;
      } else if (Array.isArray(res?.transactions)) {
        rawList = res.transactions;
      } else if (Array.isArray(res?.data?.transactions)) {
        rawList = res.data.transactions;
      } else if (Array.isArray(res?.data?.data)) {
        rawList = res.data.data;
      } else if (Array.isArray(res?.data?.rows)) {
        rawList = res.data.rows;
      } else if (Array.isArray(res?.data)) {
        rawList = res.data;
      } else if (Array.isArray(res?.rows)) {
        rawList = res.rows;
      } else if (res && typeof res === 'object') {
        const candidates = Object.values(res.data || res).filter(Array.isArray);
        if (candidates.length > 0) {
          rawList = candidates[0];
        }
      }

      let normalized = rawList.map(normalizeTransaction).filter(Boolean);

      if (isCashier && user) {
        const uId = String(user.id || '').trim();
        const uName = (user.name || '').toLowerCase().trim();
        const uUsername = (user.username || '').toLowerCase().trim();

        normalized = normalized.filter((t) => {
          const tCashierId = String(t.cashierId || '').trim();
          const tCashierName = (t.cashierName || '').toLowerCase().trim();

          if (uId && tCashierId && (tCashierId === uId || tCashierId === String(user.user_id))) {
            return true;
          }
          if (uName && tCashierName && (tCashierName.includes(uName) || uName.includes(tCashierName))) {
            return true;
          }
          if (uUsername && tCashierName && (tCashierName.includes(uUsername) || uUsername.includes(tCashierName))) {
            return true;
          }
          if (!tCashierId && (!tCashierName || tCashierName === 'petugas kasir' || tCashierName === 'kasir' || tCashierName === 'kasir koperasi')) {
            return true;
          }
          return false;
        });
      }

      storageService.setTransactions(normalized);
      return normalized;
    } catch (err) {
      console.warn('Backend /transactions or /sales fetch error:', err.message);
      const fallback = storageService.getTransactions() || [];
      return (Array.isArray(fallback) ? fallback : []).map(normalizeTransaction).filter(Boolean);
    }
  }

  async getById(id) {
    try {
      let res;
      try {
        res = await api.get(`/transactions/${id}`);
      } catch (errGet) {
        if (errGet.message?.includes('404')) {
          res = await api.get(`/sales/${id}`);
        } else {
          throw errGet;
        }
      }
      const raw = res.data?.sale || res.data?.transaction || res.data?.data || res.data || res;
      return normalizeTransaction(raw);
    } catch (err) {
      const fallback = (storageService.getTransactions() || []).find((t) => String(t.id) === String(id));
      return fallback ? normalizeTransaction(fallback) : null;
    }
  }

  async createTransaction({
    items,
    discount = 0,
    paymentMethod = 'Cash',
    cashPaid = 0,
    grandTotal = 0,
    cashier,
  }) {
    if (!items || items.length === 0) {
      throw new Error('Keranjang belanja masih kosong.');
    }

    const paidAmount = Number(cashPaid) || Number(grandTotal) || 0;

    const payload = {
      items: items.map((item) => ({
        product_id: Number(item.productId || item.product_id || item.id),
        quantity: Number(item.quantity || item.qty || 1),
      })),
      paid: paidAmount,
      cash_paid: paidAmount,
      payment_method: paymentMethod,
      payment_type: paymentMethod,
      paymentMethod: paymentMethod,
      method: paymentMethod,
      metode_pembayaran: paymentMethod,
      discount: Number(discount) || 0,
      user_id: cashier?.id || 1,
      cashier_id: cashier?.id || 1,
      userId: cashier?.id || 1,
    };

    let res;
    try {
      try {
        res = await api.post('/transactions', payload);
      } catch (errPost) {
        if (errPost.message?.includes('404')) {
          res = await api.post('/sales', payload);
        } else {
          throw errPost;
        }
      }
    } catch (backendError) {
      console.error('Error saat menyimpan transaksi ke backend MySQL:', backendError);
      throw new Error(backendError.message || 'Gagal menyimpan transaksi ke database.');
    }

    const raw = res.data?.sale || res.data?.transaction || res.data?.data || res.data || res;
    
    const returnMethod = (raw?.payment_method && raw?.payment_method !== 'Cash')
      ? raw.payment_method
      : (paymentMethod || raw?.payment_method || raw?.paymentMethod || 'Cash');

    const combined = typeof raw === 'object'
      ? { ...raw, payment_method: returnMethod, paymentMethod: returnMethod }
      : { payment_method: returnMethod, paymentMethod: returnMethod };

    const normalized = normalizeTransaction(combined);

    if (normalized) {
      const existing = storageService.getTransactions() || [];
      const updated = [normalized, ...existing.filter((t) => t.id !== normalized.id)];
      storageService.setTransactions(updated);
    }

    return normalized;
  }
}

export const transactionService = new TransactionService();
export default transactionService;
