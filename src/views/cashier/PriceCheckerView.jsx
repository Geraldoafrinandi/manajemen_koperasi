import { useState, useEffect, useRef, useCallback } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../../context/ToastContext';
import { formatRupiah } from '../../utils/formatters';
import productService from '../../services/productService';
import BarcodeCameraScanner from '../../components/pos/BarcodeCameraScanner';
import {
  ScanLine,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
} from 'lucide-react';

// Web Audio API Sound effect
const playBeep = (isSuccess = true) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isSuccess) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) { }
};

export const PriceCheckerView = ({ onNavigate }) => {
  const { products, refreshProducts } = useProducts();
  const toast = useToast();

  const [scannedProduct, setScannedProduct] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'found' | 'not_found' | 'loading'
  const [manualInput, setManualInput] = useState('');
  const [unregisteredBarcode, setUnregisteredBarcode] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Zoom & Fullscreen Settings
  const [zoomLevel, setZoomLevel] = useState(() => {
    try {
      const saved = localStorage.getItem('koperasi_price_checker_zoom');
      return saved ? Number(saved) : 100;
    } catch (e) {
      return 100;
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-reset timer (7 seconds after scan)
  const AUTO_RESET_SECONDS = 7;
  const [countdown, setCountdown] = useState(AUTO_RESET_SECONDS);
  const countdownTimerRef = useRef(null);

  // Scanner Hardware Keystroke Interceptor
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(Date.now());

  useEffect(() => {
    if (refreshProducts) {
      refreshProducts();
    }
  }, []);

  // Save zoom level
  const handleZoomChange = (newZoom) => {
    const clamped = Math.min(Math.max(newZoom, 80), 200);
    setZoomLevel(clamped);
    try {
      localStorage.setItem('koperasi_price_checker_zoom', String(clamped));
    } catch (e) { }
  };

  // Fullscreen toggle handler
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (e) {
      // Fallback for browsers with restricted permissions
      setIsFullscreen((prev) => !prev);
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Hardware Scanner Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (timeDiff > 120 && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 3) {
          const barcode = bufferRef.current.trim();
          bufferRef.current = '';
          e.preventDefault();
          handleLookup(barcode);
        } else {
          bufferRef.current = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (!isInput) {
          bufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Auto Reset Countdown Timer
  useEffect(() => {
    if (scanStatus === 'found' || scanStatus === 'not_found') {
      setCountdown(AUTO_RESET_SECONDS);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            handleReset();
            return AUTO_RESET_SECONDS;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [scanStatus]);

  // Lookup Barcode
  const handleLookup = useCallback(
    async (query) => {
      if (!query) return;
      const clean = query.toString().trim();
      if (!clean) return;

      setScanStatus('loading');
      setManualInput('');

      // 1. Search local product list
      const matched = (products || []).find((p) => {
        const pBarcode = String(p.barcode || '').trim().toLowerCase();
        const pSku = String(p.sku || '').trim().toLowerCase();
        const pName = String(p.name || '').trim().toLowerCase();
        const q = clean.toLowerCase();
        return pBarcode === q || pSku === q || pName === q;
      });

      if (matched) {
        setScannedProduct(matched);
        setScanStatus('found');
        setUnregisteredBarcode('');
        playBeep(true);
        return;
      }

      // 2. Fallback backend lookup
      try {
        const backendProduct = await productService.getByBarcode(clean);
        if (backendProduct && backendProduct.name) {
          setScannedProduct(backendProduct);
          setScanStatus('found');
          setUnregisteredBarcode('');
          playBeep(true);
          return;
        }
      } catch (err) { }

      // 3. Not Found
      setScannedProduct(null);
      setUnregisteredBarcode(clean);
      setScanStatus('not_found');
      playBeep(false);
    },
    [products]
  );

  const handleReset = () => {
    setScannedProduct(null);
    setScanStatus('idle');
    setUnregisteredBarcode('');
    setManualInput('');
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  };

  return (
    <div
      className={`min-h-full flex flex-col justify-between bg-slate-50 text-slate-800 select-none transition-all duration-200 ${isFullscreen
        ? 'fixed inset-0 z-50 overflow-y-auto p-4 sm:p-8 bg-slate-50'
        : 'p-3 sm:p-6 max-w-5xl mx-auto'
        }`}
    >
      {/* Modal Kamera Scanner (Aman dari race condition & transition collision) */}
      <BarcodeCameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={(code) => {
          setIsCameraOpen(false);
          handleLookup(code);
        }}
      />

      {/* Top Header & Settings Toolbar */}
      <div className="flex flex-wrap items-center justify-between pb-3.5 mb-2 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-2xs">
            <ScanLine className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
              Cek Harga Barang
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Koperasi SD IT Permata
            </p>
          </div>
        </div>

        {/* Toolbar: Zoom Controls, Fullscreen Toggle */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Zoom In / Out Controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleZoomChange(zoomLevel - 15)}
              disabled={zoomLevel <= 80}
              className="p-1.5 hover:bg-slate-100 disabled:opacity-30 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Perkecil Tampilan (Zoom Out)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoomChange(100)}
              className="px-2 py-1 text-[11px] font-mono font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
              title="Reset Zoom ke 100%"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={() => handleZoomChange(zoomLevel + 15)}
              disabled={zoomLevel >= 200}
              className="p-1.5 hover:bg-slate-100 disabled:opacity-30 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Perbesar Tampilan (Zoom In)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Kamera Cadangan (Disimpan di Toolbar) */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Buka Kamera Scanner (Cadangan)"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${isFullscreen
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            title="Tampilkan Satu Layar Penuh (Fullscreen)"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-emerald-600" /> : <Maximize className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Keluar Fullscreen' : 'Full Layar'}</span>
          </button>
        </div>
      </div>

      {/* Main Center Price Checker Card with dynamic Zoom Scaling */}
      <div className="my-auto py-6 flex items-center justify-center overflow-visible">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-full max-w-xl mx-auto"
        >
          {scanStatus === 'loading' ? (
            /* Loading State */
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin mx-auto mb-4" />
              <h3 className="text-base font-bold text-slate-800">Mengecek Harga...</h3>
            </div>
          ) : scanStatus === 'found' && scannedProduct ? (
            /* ====================================================
               Supermarket Price Display (Scanned State)
               ==================================================== */
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Auto reset progress bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-100">
                <div
                  className="h-full bg-emerald-600 transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / AUTO_RESET_SECONDS) * 100}%` }}
                />
              </div>

              {/* Header metadata */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                  {scannedProduct.category || 'Umum'}
                </span>

                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{countdown}s</span>
                </div>
              </div>

              {/* Product Name */}
              <div className="text-center my-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                  {scannedProduct.name}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Barcode: {scannedProduct.barcode || scannedProduct.sku || '-'}
                </p>
              </div>

              {/* Giant Clean Price Tag */}
              <div className="my-6 py-6 px-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Harga
                </span>
                <div className="text-4xl sm:text-5xl font-black text-emerald-700 font-mono tracking-tight">
                  {formatRupiah(
                    scannedProduct.discount
                      ? scannedProduct.sellPrice * (1 - scannedProduct.discount / 100)
                      : scannedProduct.sellPrice
                  )}
                </div>

                {scannedProduct.discount > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-sm line-through text-slate-400 font-mono">
                      {formatRupiah(scannedProduct.sellPrice)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-xs font-bold">
                      Diskon {scannedProduct.discount}%
                    </span>
                  </div>
                )}
              </div>

              {/* Stock Info */}
              {/* <div className="text-center mb-6">
                <span className="text-xs text-slate-600">
                  Status Stok:{' '}
                  <strong className={scannedProduct.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                    {scannedProduct.stock > 0
                      ? `Tersedia (${scannedProduct.stock} ${scannedProduct.unit || 'pcs'})`
                      : 'Stok Habis'}
                  </strong>
                </span>
              </div> */}

              {/* Simple Action */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Scan Barang Berikutnya ({countdown}s)</span>
                </button>
              </div>
            </div>
          ) : scanStatus === 'not_found' ? (
            /* ====================================================
               Not Found State
               ==================================================== */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Barang Tidak Ditemukan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Barcode: <strong className="text-slate-800 font-mono">{unregisteredBarcode}</strong>
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Scan Ulang
              </button>
            </div>
          ) : (
            /* ====================================================
               Supermarket Idle / Scan Prompt (Default Screen)
               ==================================================== */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
              {/* Center Scanner Icon */}
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 border border-emerald-100">
                <ScanLine className="w-10 h-10" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Arahkan Barcode ke Scanner
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
                Dekatkan barcode produk di bawah pemindai untuk mengecek harga barang.
              </p>

              {/* Manual input fallback */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualInput.trim()) handleLookup(manualInput);
                  }}
                  className="flex items-center gap-1.5 max-w-xs mx-auto"
                >
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Ketik kode barcode..."
                    className="flex-1 bg-slate-50 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cek
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Clean Footer */}
      <div className="text-center text-[11px] text-slate-400 pt-3">
        Pemindai barcode otomatis aktif • Koperasi SD IT Permata
      </div>
    </div>
  );
};

export default PriceCheckerView;
