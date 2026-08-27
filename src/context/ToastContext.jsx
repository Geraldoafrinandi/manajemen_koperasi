import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ToastItem = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const remainingRef = useRef(toast.duration || 2400);

  const handleClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 280); // smooth slide-out
  }, [isExiting, onRemove, toast.id]);

  const startTimer = useCallback(() => {
    if (toast.duration === 0) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      handleClose();
    }, remainingRef.current);
  }, [handleClose, toast.duration]);

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingRef.current = Math.max(remainingRef.current - elapsed, 400);
      setIsPaused(true);
    }
  };

  const resumeTimer = () => {
    setIsPaused(false);
    startTimer();
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  // Desain elegan, modern & minimalis (clean white card with colored micro-indicator)
  let config = {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
    icon: <CheckCircle2 className="w-4 h-4 animate-icon-pop" />,
    accentDot: 'bg-emerald-500',
    title: 'Berhasil',
    titleColor: 'text-emerald-700',
    borderColor: 'border-emerald-100/80',
  };

  if (toast.type === 'error') {
    config = {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200/60',
      icon: <XCircle className="w-4 h-4 animate-icon-wiggle" />,
      accentDot: 'bg-rose-500',
      title: 'Gagal',
      titleColor: 'text-rose-700',
      borderColor: 'border-rose-100/80',
    };
  } else if (toast.type === 'warning') {
    config = {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/60',
      icon: <AlertTriangle className="w-4 h-4 animate-icon-wiggle" />,
      accentDot: 'bg-amber-500',
      title: 'Peringatan',
      titleColor: 'text-amber-700',
      borderColor: 'border-amber-100/80',
    };
  } else if (toast.type === 'info') {
    config = {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200/60',
      icon: <Info className="w-4 h-4 animate-icon-pop" />,
      accentDot: 'bg-blue-500',
      title: 'Info',
      titleColor: 'text-blue-700',
      borderColor: 'border-blue-100/80',
    };
  }

  return (
    <div
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      className={`pointer-events-auto relative flex items-center justify-between gap-3 px-4 py-3 bg-white/95 border ${config.borderColor
        } rounded-2xl shadow-lg shadow-slate-900/5 backdrop-blur-md transition-all duration-200 hover:shadow-xl hover:scale-[1.01] ${isExiting ? 'animate-toast-out' : 'animate-toast-in'
        }`}
    >
      <div className="flex items-center space-x-3 pr-1">
        {/* Sleek Minimalist Icon */}
        <div
          className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${config.iconBg}`}
        >
          {config.icon}
        </div>

        {/* Message */}
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${config.accentDot}`}></span>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${config.titleColor}`}>
              {config.title}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug mt-0.5 break-words">
            {toast.message}
          </p>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 active:scale-95 transition-colors shrink-0"
        aria-label="Tutup"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 2400) => {
    const id = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      {/* Container Toast Notifications */}
      <div className="fixed top-5 right-5 z-[999999] flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

export default ToastProvider;
