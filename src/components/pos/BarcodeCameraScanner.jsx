import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ScanLine,
} from 'lucide-react';

const playScanBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch {
    // Audio feedback is optional
  }
};

export const BarcodeCameraScanner = ({ isOpen, onClose, onScanSuccess }) => {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scannedFeedback, setScannedFeedback] = useState(null);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const lastScannedCodeRef = useRef('');
  const feedbackTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const isSecure =
      window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!isSecure) {
      setErrorMsg(
        'Akses kamera membutuhkan koneksi aman HTTPS atau dibuka melalui localhost.'
      );
    }

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('belakang') ||
              d.label.toLowerCase().includes('environment') ||
              d.label.toLowerCase().includes('rear')
          );
          const defaultId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(defaultId);
          startScanner(defaultId);
        } else {
          startScanner({ facingMode: 'environment' });
        }
      })
      .catch((err) => {
        console.warn('getCameras fallback:', err);
        startScanner({ facingMode: 'environment' });
      });

    return () => {
      stopScanner();
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, [isOpen]);

  const startScanner = async (cameraConfig) => {
    try {
      setErrorMsg('');
      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      await new Promise((resolve) => setTimeout(resolve, 150));
      const element = document.getElementById('qr-camera-reader');
      if (!element) return;

      const html5QrCode = new Html5Qrcode('qr-camera-reader');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxWidth = Math.floor(minEdge * 0.8);
          const boxHeight = Math.floor(boxWidth * 0.7);
          return { width: boxWidth, height: boxHeight };
        },
        aspectRatio: 1.333333,
      };

      const targetCamera =
        cameraConfig || selectedCameraId || { facingMode: 'environment' };

      await html5QrCode.start(
        targetCamera,
        config,
        (decodedText) => {
          const now = Date.now();
          const isSameCode = decodedText === lastScannedCodeRef.current;
          if (now - lastScanTimeRef.current < (isSameCode ? 2000 : 800)) {
            return;
          }

          lastScanTimeRef.current = now;
          lastScannedCodeRef.current = decodedText;
          setLastScannedCode(decodedText);
          setScannedFeedback(decodedText);

          playScanBeep();

          if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
          feedbackTimeoutRef.current = setTimeout(() => {
            setScannedFeedback(null);
          }, 2500);

          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }
        },
        () => {
          // Frame decode in progress
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start camera scanner:', err);
      const isHttp =
        !window.isSecureContext &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';
      if (isHttp) {
        setErrorMsg(
          'Browser memblokir kamera di jaringan HTTP. Silakan gunakan link HTTPS atau akses dari localhost.'
        );
      } else {
        setErrorMsg(
          'Izin kamera belum aktif atau sedang digunakan aplikasi lain. Silakan izinkan akses kamera di browser Anda.'
        );
      }
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isScanning) return;
    try {
      const stream = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
      if (stream && stream.torchFeature) {
        const nextState = !torchOn;
        await stream.torchFeature().apply(nextState);
        setTorchOn(nextState);
      }
    } catch (e) {
      console.warn('Torch toggle not supported on this device/browser');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErrorMsg('');
      const html5QrCode =
        html5QrCodeRef.current || new Html5Qrcode('qr-camera-reader');
      const decodedText = await html5QrCode.scanFile(file, true);
      setLastScannedCode(decodedText);
      setScannedFeedback(decodedText);
      playScanBeep();

      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => {
        setScannedFeedback(null);
      }, 2500);

      if (onScanSuccess) {
        onScanSuccess(decodedText);
      }
    } catch {
      setErrorMsg(
        'Barcode / QR tidak terbaca jelas dari foto. Pastikan gambar terlihat fokus dan terang.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className="relative transform overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl transition-all w-full max-w-md border border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-2xs">
                <ScanLine className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Pemindai Barcode & QR
                </h3>
                <p className="text-[11px] text-slate-400">
                  Arahkan kamera ke barcode produk
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
              title="Tutup Scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Viewport Area */}
          <div className="p-3 sm:p-4 bg-slate-950">
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden min-h-[280px] sm:min-h-[320px] flex items-center justify-center border border-slate-800/60">
              <div id="qr-camera-reader" className="w-full h-full" />

              {/* Minimalist Viewfinder Reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="relative w-60 h-44 sm:w-64 sm:h-48 rounded-2xl border border-white/20 bg-slate-950/10">
                  {/* Subtle Corner Brackets */}
                  <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                  <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                  <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                  <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-tr-md" />

                  {/* Subtle Central Alignment Reticle */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="w-2 h-2 rounded-full bg-white/70" />
                  </div>

                  {/* Elegant Soft Scan Line */}
                  <div className="absolute left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.4)] animate-elegant-scan" />
                </div>
              </div>

              {/* Real-time Scanned Feedback Toast */}
              {scannedFeedback && (
                <div className="absolute top-3 inset-x-3 flex justify-center z-30 pointer-events-none animate-toast-in">
                  <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 text-white px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono tracking-wide">{scannedFeedback}</span>
                    <span className="text-[10px] bg-emerald-600/80 px-2 py-0.5 rounded-full text-white font-bold ml-1">
                      Ditambahkan
                    </span>
                  </div>
                </div>
              )}

              {/* Error / Fallback State */}
              {errorMsg && (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-20">
                  <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xs mb-4">
                    {errorMsg}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        startScanner(selectedCameraId || { facingMode: 'environment' })
                      }
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      Unggah Foto
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Minimalist Bottom Control Strip */}
          <div className="px-4 py-3 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between gap-2">
            {cameras.length > 1 ? (
              <div className="flex-1 max-w-[200px]">
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer truncate"
                >
                  {cameras.map((cam) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Kamera ${cam.id.substring(0, 6)}...`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl border border-slate-700/80 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Foto Barcode</span>
              </button>
            )}

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  torchOn
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title="Lampu Flash"
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() =>
                  startScanner(selectedCameraId || { facingMode: 'environment' })
                }
                className="p-2 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                title="Muat Ulang Kamera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeCameraScanner;
