# 🏫 Sistem Manajemen & Kasir POS Koperasi SD IT Permata

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-emerald?style=flat-square)]()

Aplikasi web modern berbasis **React + Vite** yang dirancang khusus untuk operasional **Koperasi Sekolah SD IT Permata**. Sistem ini mengintegrasikan transaksi kasir (*Point of Sale*), pemindaian barcode/QR realtime, manajemen inventori stok barang, laporan keuangan bulanan berstandar resmi, hingga pencetakan struk thermal.

---

## 🌟 Fitur Utama

### 🛒 1. Kasir & Point of Sale (POS)
* **Live Barcode & QR Scanner**: Mendukung pemindaian barcode 1D dan QR Code melalui kamera HP/laptop dengan antarmuka elegan dan *acoustic beep feedback*.
* **Dukungan Hardware USB Barcode Scanner**: Terintegrasi otomatis dengan scanner tembak (*keystroke buffer detection*).
* **Multi-Metode Pembayaran**: Mendukung Tunai (*Cash* dengan hitung kembalian otomatis), QRIS Dinamis, dan Transfer Bank.
* **Cetak Struk Thermal**: Format cetak struk kasir kompatibel printer thermal 58mm & 80mm lengkap dengan informasi item, kasir, dan footer koperasi.
* **Riwayat Shift & Filter Tanggal Kasir**: Memudahkan kasir memantau omset shift hari ini, kemarin, 7 hari terakhir, bulan ini, atau kustom tanggal.
* **Auto Barcode Request**: Mengirimkan notifikasi dan pengajuan pendaftaran barcode baru secara otomatis ke admin jika barang belum ada di sistem.

### 📦 2. Katalog Barang & Inventori
* **Master Data Barang**: Pengelolaan data produk lengkap (Nama, Barcode, SKU, Kategori, Harga Pokok/HPP, Harga Jual, Diskon, dan Minimum Stok).
* **Manajemen Kategori**: Pengelompokan produk yang dinamis dan terstruktur.
* **Cetak Label Barcode**: Pembuatan dan pencetakan stiker label barcode produk siap tempel dengan berbagai pilihan layout.
* **Status Produk & Deaktivasi Aman**: Proteksi database agar produk yang memiliki riwayat transaksi tidak dapat terhapus permanen melainkan dinonaktifkan dari kasir.

### 📊 3. Manajemen Stok & Mutasi
* **Pencatatan Mutasi Stok**: Tracking stok masuk (*Restock*), stok keluar (*Pengurangan*), dan penyesuaian (*Opname*).
* **Riwayat Mutasi Transparan**: Audit trail log mutasi stok lengkap dengan catatan, tanggal, dan petugas pelaksana.
* **Indikator Stok Otomatis**: Peringatan visual instan untuk stok aman, stok menipis (*low stock*), dan stok habis (*out of stock*).

### 📈 4. Laporan Keuangan & Audit Transaksi
* **Laporan Bulanan Resmi (PDF)**: Cetak laporan penjualan & laba rugi lengkap dengan Kop Surat Sekolah, tabel rekapitulasi, dan tanda tangan pejabat pengelola.
* **Export Excel (.xlsx)**: Unduh data mutasi, penjualan, dan inventori ke format spreadsheet untuk pembukuan akuntansi.
* **Audit Faktur Penjualan**: Pencarian dan rincian transaksi per struk dengan opsi cetak ulang kapan saja.

### 🔐 5. Keamanan & Manajemen Pengguna
* **Role-Based Access Control (RBAC)**: Pemisahan hak akses antara **Administrator** (Pengelola Penuh) dan **Kasir** (Khusus Penjualan & Shift).
* **Sesi Berbasis Tab (*Tab-Scoped Session*)**: Mengharuskan login ulang secara otomatis saat tab/browser ditutup demi keamanan kasir.
* **Pembersihan Sesi Berganti Hari (*Daily Shift Reset*)**: Reset sesi otomatis saat berganti tanggal untuk memastikan ketertiban shift kasir harian.
* **Global Error Boundary**: Pencegah *white screen crash* dengan opsi muat ulang dan pemulihan cepat.

---

## 🛠️ Teknologi yang Digunakan

* **Frontend Framework**: [React 18](https://react.dev/)
* **Build Tool & Bundler**: [Vite](https://vitejs.dev/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **HTTP Client**: [Axios](https://axios-http.com/)
* **Barcode & QR Processing**: [html5-qrcode](https://github.com/mebjas/html5-qrcode) & [JsBarcode](https://github.com/lindell/JsBarcode)
* **Document Export**: [jsPDF](https://github.com/parallax/jsPDF), [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable), & [XLSX](https://sheetjs.com/)

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Prasyarat
Pastikan Anda telah menginstal:
* [Node.js](https://nodejs.org/) (Versi 18.x atau lebih baru)
* [Git](https://git-scm.com/)

### 2. Clone Repository
```bash
git clone https://github.com/Geraldoafrinandi/manajemen_koperasi.git
cd manajemen_koperasi
```

### 3. Instal Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan URL endpoint backend API:
```env
VITE_API_URL=http://localhost:3000/api
```

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser Anda di `http://localhost:5173`.

### 6. Build untuk Produksi
```bash
npm run build
```
File hasil kompilasi siap deploy akan berada di folder `dist/`.

---

## 📁 Struktur Direktori

```text
frontend-koperasi/
├── public/                # Asset publik, favicon, dan logo
├── src/
│   ├── assets/            # File logo vektor dan gambar
│   ├── components/        # Komponen modular UI
│   │   ├── common/        # Komponen umum (Modal, Badge, ErrorBoundary, Logo)
│   │   ├── layout/        # Navbar, Sidebar, Layout navigasi
│   │   ├── pos/           # Modul kasir (ProductGrid, CartDrawer, CameraScanner, Receipt)
│   │   ├── products/      # Modal form produk, kategori, label barcode
│   │   └── transactions/  # Modal detail transaksi faktur
│   ├── context/           # React Context (Auth, Cart, Product, Toast)
│   ├── data/              # Konfigurasi default profil koperasi
│   ├── services/          # API Client & integrasi backend service
│   ├── utils/             # Helper formatters, export PDF, Excel, barcode helper
│   ├── views/             # Halaman Admin & Kasir POS
│   ├── App.jsx            # Routing dan state navigasi utama
│   ├── main.jsx           # Entry point React
│   └── index.css          # Desain sistem dan animasi Tailwind
├── .env.example           # Template environment variables
├── .gitignore             # Konfigurasi file yang diabaikan Git
├── package.json           # Dependensi & script proyek
└── vite.config.js         # Konfigurasi Vite & proxy backend
```

---

## 🤝 Kontribusi & Lisensi

Dikembangkan dengan bangga untuk **Koperasi SD IT Permata**.  
Hak Cipta © 2026. Seluruh hak cipta dilindungi undang-undang.
