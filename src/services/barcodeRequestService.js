import api from './api';
import storageService from './storageService';

class BarcodeRequestService {
  async getAll() {
    try {
      const res = await api.get('/barcode-requests');
      const list = res.data || res.requests || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length >= 0) {
        storageService.setBarcodeRequests(list);
        return list;
      }
    } catch (err) {
      // Endpoint opsional / fallback lokal jika backend belum mengaktifkan route barcode-requests
    }
    return storageService.getBarcodeRequests() || [];
  }

  async create({ barcode, cashierName, cashierId }) {
    const cleanBarcode = String(barcode || '').trim();
    if (!cleanBarcode) return null;

    // Simpan lokal terlebih dahulu
    const localReq = storageService.addBarcodeRequest({
      barcode: cleanBarcode,
      cashierName: cashierName || 'Petugas Kasir',
      cashierId: cashierId || null,
    });

    // Kirimkan ke server agar perangkat lain (PC Admin) langsung menerima
    try {
      await api.post('/barcode-requests', {
        barcode: cleanBarcode,
        cashierName: cashierName || 'Petugas Kasir',
        cashierId: cashierId || null,
      });
    } catch (err) {
      console.warn('Barcode request sync error:', err.message);
    }

    return localReq;
  }

  async delete(barcodeOrId) {
    if (!barcodeOrId) return;
    const clean = String(barcodeOrId).trim();
    storageService.completeBarcodeRequest(clean);
    storageService.removeBarcodeRequest(clean);

    try {
      await api.delete('/barcode-requests', {
        data: { barcode: clean, id: clean },
      });
    } catch (err) {
      console.warn('Delete barcode request error:', err.message);
    }
  }
}

export const barcodeRequestService = new BarcodeRequestService();
export default barcodeRequestService;
