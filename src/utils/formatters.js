// Utilitas Formatting untuk Koperasi SD IT Permata

/**
 * Format angka ke format Rupiah Indonesia (Contoh: Rp 15.000)
 * @param {number} amount 
 * @param {boolean} withSymbol 
 * @returns {string}
 */
export const formatRupiah = (amount, withSymbol = true) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return withSymbol ? 'Rp 0' : '0';
  }
  const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return withSymbol ? `Rp ${formatted}` : formatted;
};

/**
 * Format string/angka dengan titik pemisah ribuan (Contoh: 20000 -> 20.000)
 * @param {string|number} value 
 * @returns {string}
 */
export const formatThousand = (value) => {
  if (value === undefined || value === null || value === '') return '';
  const clean = value.toString().replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Mengubah string berformat ribuan ke angka murni (Contoh: "20.000" -> 20000)
 * @param {string|number} value 
 * @returns {number}
 */
export const parseThousand = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const clean = value.toString().replace(/\./g, '').replace(/\D/g, '');
  return parseInt(clean, 10) || 0;
};

/**
 * Format tanggal ke format standar Indonesia (Contoh: 25 Agustus 2026, 14:30)
 * @param {string|Date} dateString 
 * @param {boolean} withTime 
 * @returns {string}
 */
export const formatTanggal = (dateString, withTime = false) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit' }),
  };

  return new Intl.DateTimeFormat('id-ID', options).format(date);
};

export const formatTanggalShort = (dateString, withTime = false) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (withTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  return `${day}/${month}/${year}`;
};

/**
 * Format jam menit (Contoh: 14:30 WIB)
 * @param {string|Date} dateString 
 * @returns {string}
 */
export const formatWaktu = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  return (
    new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date) + ' WIB'
  );
};

/**
 * Generate nomor invoice unik untuk transaksi kasir
 * Format: TRX-YYYYMMDD-XXXX
 * @returns {string}
 */
export const generateInvoiceNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${dateStr}-${randomSuffix}`;
};

/**
 * Generate Barcode otomatis (EAN-13 style atau Custom Permata SKU)
 * @param {string} category 
 * @returns {string}
 */
export const generateBarcode = (category = 'GEN') => {
  const prefix = '899'; // Kode standar Indonesia / Koperasi
  const randNum = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}${randNum}`;
};

/**
 * Generate SKU Kode Barang Unik berdasarkan Kategori
 * @param {string} category
 * @returns {string}
 */
export const generateSku = (category = '') => {
  let prefix = 'PRM';
  const cat = (category || '').toLowerCase();
  if (cat.includes('seragam')) prefix = 'SRG';
  else if (cat.includes('buku')) prefix = 'BKU';
  else if (cat.includes('alat tulis') || cat.includes('atk')) prefix = 'ATK';
  else if (cat.includes('makan') || cat.includes('minum')) prefix = 'FNB';
  else if (cat.includes('atribut')) prefix = 'ATB';

  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomPart}`;
};

/**
 * Daftar Kategori Default Koperasi SD IT Permata
 */
export const PRODUCT_CATEGORIES = [
  'Seragam & Busana',
  'Buku & Modul',
  'Alat Tulis (ATK)',
  'Makanan & Minuman',
  'Atribut & Aksesoris',
  'Lain-lain',
];

/**
 * Daftar Satuan Barang Default
 */
export const PRODUCT_UNITS = [
  'Pcs',
  'Set',
  'Pasang',
  'Buku',
  'Pack',
  'Buah',
  'Botol',
  'Kotak',
  'Lembar',
];
