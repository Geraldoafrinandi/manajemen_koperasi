import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import productService from '../services/productService';
import storageService from '../services/storageService';
import barcodeRequestService from '../services/barcodeRequestService';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState(null);
  const toast = useToast();

  // 1. Bungkus dengan useCallback
  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // Audio context might be restricted
    }
  }, []); // Dependensi kosong

  // 2. Gunakan useCallback untuk fungsi Add Item
  const addItem = useCallback((product, qtyToAdd = 1) => {
    if (!product) return;

    if (product.stock <= 0) {
      toast.error(`Stok "${product.name}" habis!`);
      return false;
    }

    // setItems dengan callback otomatis tahan terhadap race-condition
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (i) => i.productId === product.id || i.id === product.id
      );

      if (existingIndex > -1) {
        const currentItem = prevItems[existingIndex];
        const newQty = currentItem.quantity + qtyToAdd;

        if (newQty > product.stock) {
          toast.warning(`Maksimal stok "${product.name}" yang tersedia adalah ${product.stock}`);
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...currentItem,
          quantity: newQty,
          subtotal: newQty * currentItem.sellPrice,
        };
        return updated;
      } else {
        if (qtyToAdd > product.stock) {
          toast.warning(`Maksimal stok "${product.name}" yang tersedia adalah ${product.stock}`);
          return prevItems;
        }

        return [
          ...prevItems,
          {
            id: product.id,
            productId: product.id,
            barcode: product.barcode,
            sku: product.sku,
            name: product.name,
            category: product.category,
            unit: product.unit,
            costPrice: product.costPrice,
            sellPrice: product.sellPrice,
            quantity: qtyToAdd,
            maxStock: product.stock,
            subtotal: qtyToAdd * product.sellPrice,
          },
        ];
      }
    });

    playBeep();
    return true;
  }, [toast, playBeep]); // Dependensi ditambahkan

  // 3. Gunakan useCallback untuk addItemByBarcode
  const addItemByBarcode = useCallback(async (barcodeQuery, productList = []) => {
    if (!barcodeQuery) return false;
    const cleanQuery = barcodeQuery.toString().trim();

    const localProds = productList && productList.length > 0 ? productList : (storageService.getProducts() || []);
    let product = localProds.find(
      (p) =>
        (p.barcode && String(p.barcode).trim().toLowerCase() === cleanQuery.toLowerCase()) ||
        (p.sku && String(p.sku).trim().toLowerCase() === cleanQuery.toLowerCase())
    );

    if (!product) {
      try {
        product = await productService.getByBarcode(cleanQuery);
      } catch (err) { }
    }

    if (!product) {
      setUnregisteredBarcode(cleanQuery);
      const cashierName = storageService.getCurrentUser()?.name || 'Petugas Kasir';
      const cashierId = storageService.getCurrentUser()?.id;

      barcodeRequestService.create({
        barcode: cleanQuery,
        cashierName: cashierName,
        cashierId: cashierId,
      });

      productService
        .create({
          name: 'Permintaan Barang Baru (Kasir)',
          barcode: cleanQuery,
          status: false,
          stock: 0,
          purchase_price: 0,
          selling_price: 0,
          category_id: 1,
          description: `Diminta oleh ${cashierName}`,
        })
        .catch(() => { });

      toast.warning(`Barcode "${cleanQuery}" belum terdaftar. Permintaan telah dikirim ke Admin.`);
      return { success: false, notFound: true, barcode: cleanQuery };
    }

    const success = addItem(product, 1);
    if (success) {
      toast.success(`+1 ${product.name}`);
    }
    return { success: true, product };
  }, [addItem, toast]);

  // 4. Pindahkan removeItem ke atas updateQuantity agar bisa digunakan
  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId && i.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQty) => {
    const qty = Number(newQty);
    if (isNaN(qty) || qty <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId || item.id === productId) {
          if (qty > item.maxStock) {
            toast.warning(`Stok tersedia hanya ${item.maxStock}`);
            return {
              ...item,
              quantity: item.maxStock,
              subtotal: item.maxStock * item.sellPrice,
            };
          }
          return {
            ...item,
            quantity: qty,
            subtotal: qty * item.sellPrice,
          };
        }
        return item;
      })
    );
  }, [removeItem, toast]);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
  }, []);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [items]);

  const subtotal = total;

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const grandTotal = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addItemByBarcode,
        updateQuantity,
        removeItem,
        clearCart,
        discount,
        setDiscount,
        unregisteredBarcode,
        setUnregisteredBarcode,
        subtotal,
        grandTotal,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartProvider;
