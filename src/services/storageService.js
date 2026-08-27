import {
  INITIAL_COOP_PROFILE,
} from '../data/initialData';

const KEYS = {
  PRODUCTS: 'koperasi_permata_products',
  USERS: 'koperasi_permata_users',
  PROFILE: 'koperasi_permata_profile',
  TRANSACTIONS: 'koperasi_permata_transactions',
  MUTATIONS: 'koperasi_permata_mutations',
  CATEGORIES: 'koperasi_permata_categories',
  BARCODE_REQUESTS: 'koperasi_permata_barcode_requests',
  CURRENT_USER: 'koperasi_permata_current_user',
};

class StorageService {
  constructor() {
    this.initDatabase();
  }

  initDatabase() {
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.PROFILE)) {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(INITIAL_COOP_PROFILE));
    }
    if (!localStorage.getItem(KEYS.MUTATIONS)) {
      localStorage.setItem(KEYS.MUTATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.CATEGORIES)) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.BARCODE_REQUESTS)) {
      localStorage.setItem(KEYS.BARCODE_REQUESTS, JSON.stringify([]));
    }
  }

  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
      return false;
    }
  }

  getProducts() {
    return this.getItem(KEYS.PRODUCTS, []);
  }

  setProducts(products) {
    return this.setItem(KEYS.PRODUCTS, products || []);
  }

  getTransactions() {
    return this.getItem(KEYS.TRANSACTIONS, []);
  }

  setTransactions(transactions) {
    return this.setItem(KEYS.TRANSACTIONS, transactions || []);
  }

  getMutations() {
    return this.getItem(KEYS.MUTATIONS, []);
  }

  setMutations(mutations) {
    return this.setItem(KEYS.MUTATIONS, mutations || []);
  }

  getManualMutations() {
    return this.getItem('koperasi_manual_mutations', []);
  }

  setManualMutations(mutations) {
    return this.setItem('koperasi_manual_mutations', mutations || []);
  }

  addManualMutation(mutation) {
    if (!mutation) return [];
    const current = this.getManualMutations() || [];
    const updated = [mutation, ...current.filter((m) => m.id !== mutation.id)];
    this.setManualMutations(updated);
    return updated;
  }

  getCategories() {
    return this.getItem(KEYS.CATEGORIES, []);
  }

  setCategories(categories) {
    return this.setItem(KEYS.CATEGORIES, categories || []);
  }

  getProfile() {
    return this.getCoopProfile();
  }

  setProfile(profile) {
    return this.setCoopProfile(profile);
  }

  getCoopProfile() {
    return this.getItem(KEYS.PROFILE, INITIAL_COOP_PROFILE);
  }

  setCoopProfile(profile) {
    return this.setItem(KEYS.PROFILE, profile);
  }

  getBarcodeRequests() {
    return this.getItem(KEYS.BARCODE_REQUESTS, []);
  }

  setBarcodeRequests(requests) {
    return this.setItem(KEYS.BARCODE_REQUESTS, requests || []);
  }

  addBarcodeRequest(request) {
    const existing = this.getBarcodeRequests();
    const cleanBarcode = String(request.barcode || '').trim();
    if (!cleanBarcode) return null;

    const newReq = {
      id: request.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      barcode: cleanBarcode,
      cashierName: request.cashierName || 'Petugas Kasir',
      cashierId: request.cashierId || null,
      requestedAt: request.requestedAt || new Date().toISOString(),
      status: 'pending',
    };

    const foundIndex = existing.findIndex((r) => r.barcode === cleanBarcode && r.status !== 'completed');
    let updated;
    if (foundIndex >= 0) {
      existing[foundIndex] = { ...existing[foundIndex], ...newReq, id: existing[foundIndex].id };
      updated = [...existing];
    } else {
      updated = [newReq, ...existing];
    }

    this.setBarcodeRequests(updated);
    return newReq;
  }

  removeBarcodeRequest(idOrBarcode) {
    if (!idOrBarcode) return;
    const existing = this.getBarcodeRequests();
    const clean = String(idOrBarcode).trim();
    const updated = existing.filter((r) => r.id !== clean && String(r.barcode).trim() !== clean);
    this.setBarcodeRequests(updated);
  }

  completeBarcodeRequest(barcode) {
    this.removeBarcodeRequest(barcode);
  }

  getUsers() {
    return this.getItem(KEYS.USERS, []);
  }

  setUsers(users) {
    return this.setItem(KEYS.USERS, users || []);
  }

  getCurrentUser() {
    try {
      const sessionItem = sessionStorage.getItem(KEYS.CURRENT_USER);
      if (sessionItem) {
        return JSON.parse(sessionItem);
      }
      return null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user) {
    if (user === null || user === undefined) {
      sessionStorage.removeItem(KEYS.CURRENT_USER);
      localStorage.removeItem(KEYS.CURRENT_USER);
      return true;
    }
    try {
      sessionStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      // Pastikan localStorage bersih dari kredensial permanen
      localStorage.removeItem(KEYS.CURRENT_USER);
      return true;
    } catch (e) {
      console.error(`Error writing ${KEYS.CURRENT_USER} to sessionStorage:`, e);
      return false;
    }
  }

  clearAllData() {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.MUTATIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify([]));
    localStorage.setItem(KEYS.BARCODE_REQUESTS, JSON.stringify([]));
    localStorage.removeItem('koperasi_manual_mutations');
  }

  resetToDefault() {
    this.clearAllData();
    localStorage.setItem(KEYS.USERS, JSON.stringify([]));
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(INITIAL_COOP_PROFILE));
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem('koperasi_permata_token');
    sessionStorage.removeItem(KEYS.CURRENT_USER);
    sessionStorage.removeItem('koperasi_permata_token');
    window.dispatchEvent(new Event('koperasi_storage_change'));
  }
}

export const storageService = new StorageService();
export default storageService;
