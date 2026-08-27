import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import reportService from '../../services/reportService';
import { formatRupiah, formatTanggal } from '../../utils/formatters';
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Receipt,
  Layers,
  Clock,
  PieChart,
  Award,
} from 'lucide-react';
import Badge from '../../components/common/Badge';

export const DashboardView = ({ onNavigate }) => {
  const { user } = useAuth();
  const { products, transactions, lowStockCount } = useProducts();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update jam & detik realtime setiap detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const metrics = useMemo(() => {
    return reportService.getDashboardMetrics(products, transactions);
  }, [products, transactions]);

  // Statistik Kategori untuk Diagram Lingkaran (Pie / Donut Chart)
  const categoryStats = useMemo(() => {
    if (!products || products.length === 0) return [];
    const counts = {};
    products.forEach((p) => {
      const cat = p.category || 'Umum';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const colors = [
      { fill: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-200', lightBg: 'bg-emerald-50' },
      { fill: '#0284c7', bg: 'bg-sky-600', text: 'text-sky-700', border: 'border-sky-200', lightBg: 'bg-sky-50' },
      { fill: '#8b5cf6', bg: 'bg-violet-600', text: 'text-violet-700', border: 'border-violet-200', lightBg: 'bg-violet-50' },
      { fill: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', lightBg: 'bg-amber-50' },
      { fill: '#ec4899', bg: 'bg-pink-500', text: 'text-pink-700', border: 'border-pink-200', lightBg: 'bg-pink-50' },
      { fill: '#14b8a6', bg: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-200', lightBg: 'bg-teal-50' },
      { fill: '#64748b', bg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-200', lightBg: 'bg-slate-50' },
    ];

    const total = products.length;
    let currentOffset = 0;

    return Object.entries(counts).map(([name, count], index) => {
      const percent = total > 0 ? (count / total) * 100 : 0;
      const roundedPercent = Math.round(percent);
      const offsetPercent = currentOffset;
      currentOffset += percent;

      return {
        name,
        count,
        percentage: percent,
        roundedPercent,
        offsetPercent,
        color: colors[index % colors.length],
      };
    });
  }, [products]);

  // Format tanggal & jam realtime Indonesia
  const fullDateString = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(currentTime);
  }, [currentTime]);

  const timeString = useMemo(() => {
    return (
      new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(currentTime) + ' WIB'
    );
  }, [currentTime]);

  // Max value untuk scaling grafik 7 hari
  const maxRevenue7Days = useMemo(() => {
    const max = Math.max(...metrics.last7Days.map((d) => d.revenue), 100000);
    return max;
  }, [metrics]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Sambutan Simpel, Elegan & Minimalis dengan Tanggal & Waktu Realtime */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Koperasi SD IT Permata Kita</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Assalamu'alaikum, {user?.name || 'Pengelola'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Ringkasan analitik dan aktivitas perputaran kas koperasi sekolah
          </p>
        </div>

        {/* Live Date & Time + Action Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex items-center space-x-1.5 font-medium text-slate-700">
              <span className="font-semibold text-slate-900">{fullDateString}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono font-bold">{timeString}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-all flex items-center space-x-1.5 hover:border-slate-300"
          >
            <Receipt className="w-4 h-4 text-emerald-700" />
            <span>Laporan Bulanan</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Penjualan Hari Ini */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-emerald-300 hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Penjualan Hari Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-xs tracking-tight">
              Rp
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatRupiah(metrics.today.revenue)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
              <span className="font-semibold text-emerald-700">{metrics.today.count}</span>
              <span>transaksi berhasil hari ini</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Laba Bersih Hari Ini */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-emerald-300 hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Laba Bersih Hari Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
              {formatRupiah(metrics.today.profit)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Keuntungan setelah modal barang
            </p>
          </div>
        </div>

        {/* Metric 3: Omset Bulan Ini */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Omset Bulan Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatRupiah(metrics.month.revenue)}
            </h3>
            <p className="text-xs text-emerald-700 font-semibold mt-1">
              Laba: {formatRupiah(metrics.month.profit)}
            </p>
          </div>
        </div>

        {/* Metric 4: Peringatan Stok Kritis */}
        <div
          onClick={() => onNavigate('stock')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Stok Perlu Perhatian
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowStockCount > 0
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
                }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {lowStockCount} Produk
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center justify-between">
              <span>
                {metrics.inventory.outOfStockCount} habis,{' '}
                {metrics.inventory.lowStockCount - metrics.inventory.outOfStockCount} menipis
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-400" />
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: 7-Day Chart & Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Grafik Tren Penjualan 7 Hari Terakhir */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Tren Penjualan 7 Hari Terakhir</span>
              </h3>
              <p className="text-xs text-slate-500">Grafik perbandingan omset penjualan harian vs estimasi laba bersih</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-600"></span>
                <span className="text-slate-700">Total Omset</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-300"></span>
                <span className="text-slate-700">Laba Bersih</span>
              </div>
            </div>
          </div>

          {/* Interactive Bar Visualization */}
          <div className="pt-6 pb-2">
            <div className="grid grid-cols-7 gap-2 sm:gap-4 h-52 items-end border-b border-slate-100 px-1">
              {metrics.last7Days.map((day, idx) => {
                const revenueHeight = Math.max(8, (day.revenue / maxRevenue7Days) * 100);
                const profitHeight = Math.max(4, (day.profit / maxRevenue7Days) * 100);

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-150 absolute -top-12 mb-2 px-2.5 py-1.5 bg-slate-900 text-white rounded-xl text-[10.5px] text-center font-bold whitespace-nowrap shadow-xl pointer-events-none z-20">
                      <div>{formatRupiah(day.revenue)}</div>
                      <div className="text-emerald-300 font-normal">Laba: {formatRupiah(day.profit)}</div>
                    </div>

                    <div className="w-full max-w-[40px] flex items-end justify-center space-x-1 h-38">
                      {/* Bar Revenue (Emerald 600) */}
                      <div
                        style={{ height: `${revenueHeight}%` }}
                        className="w-1/2 bg-emerald-600 rounded-t-md transition-all duration-300 group-hover:bg-emerald-700"
                      />
                      {/* Bar Profit (Emerald 300) */}
                      <div
                        style={{ height: `${profitHeight}%` }}
                        className="w-1/2 bg-emerald-300 rounded-t-md transition-all duration-300 group-hover:bg-emerald-400"
                      />
                    </div>

                    <span className="text-[11px] font-bold text-slate-800 mt-2">
                      {day.dayName}
                    </span>
                    <span className="text-[9.5px] text-slate-400 font-medium">
                      {day.date.slice(8, 10)}/{day.date.slice(5, 7)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Alert Stok Menipis & Habis */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Stok Perlu Restock</span>
            </h3>
            <button
              onClick={() => onNavigate('stock')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Lihat Semua
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1">
            {metrics.inventory.lowStockList.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Semua stok barang dalam kondisi aman.
              </div>
            ) : (
              metrics.inventory.lowStockList.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                    <p className="text-[10px] text-slate-500">
                      Batas Minimal: {prod.minStock} {prod.unit}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${prod.stock <= 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                  >
                    {prod.stock <= 0 ? 'Habis (0)' : `Sisa ${prod.stock}`}
                  </span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate('stock')}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5"
          >
            <span>Buka Manajemen Stok Barang</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Section: Katalog & Komposisi Barang di Database */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Katalog & Komposisi Barang Database</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
                  {products.length} Produk
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi diagram lingkaran persentase kategori barang dan daftar persediaan di database
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('products')}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
          >
            <span>Buka Master Barang</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2-Column Section: Diagram Lingkaran (Kiri) & Pratinjau Produk (Kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Diagram Lingkaran (Pie / Donut Chart) */}
          <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>Diagram Lingkaran Kategori</span>
              </h4>
              <span className="text-[11px] font-semibold text-slate-500">
                {categoryStats.length} Kategori
              </span>
            </div>

            {products.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada data barang untuk digambar ke diagram.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4 pt-1">
                {/* SVG Donut Chart Visual */}
                <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r="46"
                      fill="transparent"
                      stroke="#e2e8f0"
                      strokeWidth="16"
                    />
                    {categoryStats.map((cat, idx) => {
                      const radius = 46;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((cat.offsetPercent / 100) * circumference);

                      return (
                        <circle
                          key={idx}
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="transparent"
                          stroke={cat.color.fill}
                          strokeWidth="16"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-500 hover:opacity-80"
                        />
                      );
                    })}
                  </svg>
                  {/* Center Counter */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 leading-none">
                      {products.length}
                    </span>
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      Total Barang
                    </span>
                  </div>
                </div>

                {/* Legend List with Percentages */}
                <div className="w-full space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {categoryStats.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color.fill }}
                        />
                        <span className="font-bold text-slate-800 truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 font-mono">
                        <span className="text-[11px] font-medium text-slate-500">
                          {cat.count} produk
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${cat.color.lightBg} ${cat.color.text} border ${cat.color.border}`}
                        >
                          {cat.roundedPercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Grid Kartu Barang */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Package className="w-4 h-4 text-slate-600" />
                <span>Pratinjau Barang Tersimpan</span>
              </h4>
              <span className="text-[11px] font-medium text-slate-400">
                Menampilkan {Math.min(6, products.length)} dari {products.length} barang
              </span>
            </div>

            {products.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                <Package className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Belum ada data barang di database.</p>
                <button
                  onClick={() => onNavigate('products')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  + Tambah Barang Baru
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {products.slice(0, 6).map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock <= (p.minStock || 5) && p.stock > 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => onNavigate('products')}
                      className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600 truncate max-w-[90px]">
                            {p.category || 'Umum'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isOutOfStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOutOfStock ? 'Habis (0)' : `${p.stock} ${p.unit || 'Pcs'}`}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug">
                          {p.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {p.barcode || p.sku || '-'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block leading-none">Harga Jual</span>
                          <strong className="text-emerald-700 font-extrabold font-mono text-[11px]">
                            {formatRupiah(p.sellPrice)}
                          </strong>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-emerald-600 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {products.length > 6 && (
              <div className="pt-1 text-center">
                <button
                  onClick={() => onNavigate('products')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>Lihat semua {products.length} barang di katalog</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Section: Peringkat Produk Terlaris & Transaksi Terakhir */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Produk Terlaris */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Peringkat 5 Produk Terlaris</span>
            </h3>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Master Barang
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
            {(!metrics.topProducts || metrics.topProducts.length === 0) ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Belum ada data penjualan produk.
              </div>
            ) : (
              metrics.topProducts.slice(0, 5).map((prod, idx) => (
                <div
                  key={prod.id || idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between hover:bg-slate-100/70 transition-colors text-xs"
                >
                  <div className="flex items-center space-x-3 truncate pr-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950 shadow-xs'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800 font-bold'
                          : idx === 2
                          ? 'bg-amber-700/60 text-white font-bold'
                          : 'bg-slate-200 text-slate-700 font-semibold'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate">{prod.name}</p>
                      <p className="text-[10px] text-slate-500">{prod.category || 'Umum'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-emerald-700 text-xs block">
                      {prod.soldCount} terjual
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatRupiah(prod.revenue)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Data penjualan produk otomatis</span>
            <span className="font-semibold text-emerald-700">Real-time</span>
          </div>
        </div>

        {/* Kolom Kanan: Transaksi Terakhir Koperasi */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Transaksi Terakhir Koperasi</span>
              </h3>
              <p className="text-xs text-slate-500">Daftar transaksi kasir terbaru</p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Semua Transaksi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10.5px] font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No. Faktur</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Kasir</th>
                  <th className="py-2.5 px-3 text-center">Metode</th>
                  <th className="py-2.5 px-3 text-right">Total Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-xs italic">
                      Belum ada transaksi penjualan yang tercatat.
                    </td>
                  </tr>
                ) : (
                  metrics.recentTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {trx.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {formatTanggal(trx.createdAt, true)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{trx.cashierName}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant="primary">{trx.paymentMethod}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                        {formatRupiah(trx.grandTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Riwayat arus kas masuk</span>
            <span className="font-semibold text-slate-700">{metrics.today.count} trx hari ini</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
