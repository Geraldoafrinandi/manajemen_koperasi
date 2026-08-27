import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../../context/ToastContext';
import PermataLogo from '../common/PermataLogo';
import ProductFormModal from '../products/ProductFormModal';
import {
  Bell,
  LogOut,
  AlertTriangle,
  ChevronDown,
  Shield,
  User,
  Settings,
  RotateCcw,
  CheckCircle2,
  Barcode,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';

const formatRelativeTime = (isoString) => {
  if (!isoString) return 'Baru saja';
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch (e) {
    return 'Baru saja';
  }
};

export const Navbar = ({ onNavigate, currentView, onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, logout, isAdmin, isCashier } = useAuth();
  const {
    lowStockList,
    outOfStockList,
    lowStockCount,
    pendingBarcodeRequests,
    pendingBarcodeRequestsCount,
    removeBarcodeRequest,
    completeBarcodeRequest,
  } = useProducts();
  const toast = useToast();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [activeAlertTab, setActiveAlertTab] = useState('requests'); // 'requests' | 'stock'
  const [registeringBarcode, setRegisteringBarcode] = useState(null);

  const profileMenuRef = useRef(null);
  const alertMenuRef = useRef(null);

  const totalAlertCount = (pendingBarcodeRequestsCount || 0) + (lowStockCount || 0);

  // Auto-switch default tab if one category has items and other doesn't
  useEffect(() => {
    if (pendingBarcodeRequestsCount > 0) {
      setActiveAlertTab('requests');
    } else if (lowStockCount > 0) {
      setActiveAlertTab('stock');
    }
  }, [pendingBarcodeRequestsCount, lowStockCount]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (alertMenuRef.current && !alertMenuRef.current.contains(event.target)) {
        setShowAlertMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    try {
      await logout();
      toast.info('Anda telah keluar dari sistem koperasi.');
    } catch (err) {
      toast.error('Gagal keluar.');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white text-slate-800 px-3 sm:px-4 lg:px-6 py-2.5 no-print shadow-xs border-b border-slate-200 select-none">
      <div className="flex items-center justify-between">
        {/* Left Section: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Hamburger Menu Toggle (Mobile Only) */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
            aria-label="Buka Menu Navigasi"
            title="Menu Navigasi"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand & School Logo */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer select-none"
            onClick={() => onNavigate(isAdmin ? 'dashboard' : 'pos')}
          >
            <PermataLogo size="sm" textColor="dark" />
            <div className="hidden md:block pl-2 border-l border-slate-200">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-emerald-50 text-emerald-700 tracking-wider border border-emerald-200">
                Koperasi Sekolah
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Notifications & User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notification Bell Dropdown (Admin only) */}
          {isAdmin && (
            <div className="relative" ref={alertMenuRef}>
              <button
                onClick={() => {
                  setShowAlertMenu(!showAlertMenu);
                  setShowProfileMenu(false);
                }}
                className={`relative p-2 rounded-xl border transition-colors cursor-pointer ${totalAlertCount > 0
                    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                title="Pusat Pemberitahuan Admin"
              >
                <Bell className="w-4 h-4" />
                {totalAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-extrabold shadow-xs animate-pulse">
                    {totalAlertCount}
                  </span>
                )}
              </button>

              {/* Alert Menu Dropdown */}
              {showAlertMenu && (
                <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-white text-slate-800 p-3 shadow-2xl z-50 border border-slate-200 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      Pusat Pemberitahuan ({totalAlertCount})
                    </span>
                  </div>

                  {/* Tabs: Permintaan Barang Kasir vs Peringatan Stok */}
                  <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl mb-2.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveAlertTab('requests')}
                      className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${activeAlertTab === 'requests'
                          ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <Barcode className="w-3.5 h-3.5" />
                      <span>Permintaan Kasir</span>
                      {pendingBarcodeRequestsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                          {pendingBarcodeRequestsCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAlertTab('stock')}
                      className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${activeAlertTab === 'stock'
                          ? 'bg-white text-rose-700 shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Stok Menipis</span>
                      {lowStockCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
                          {lowStockCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Tab 1 Content: Permintaan Barang Kasir */}
                  {activeAlertTab === 'requests' && (
                    <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
                      {pendingBarcodeRequestsCount === 0 ? (
                        <div className="text-center py-6 text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1.5 opacity-60" />
                          <p className="font-semibold text-slate-600">Tidak ada permintaan barang baru</p>
                          <p className="text-[11px] text-slate-400">Semua barcode yang di-scan kasir sudah terdaftar.</p>
                        </div>
                      ) : (
                        pendingBarcodeRequests.map((req) => (
                          <div
                            key={req.id}
                            className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/90 flex flex-col space-y-2 hover:bg-amber-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-1.5">
                                  <Barcode className="w-4 h-4 text-amber-700" />
                                  <span className="font-mono font-extrabold text-xs text-slate-900 tracking-wider">
                                    {req.barcode}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600">
                                  Diminta oleh: <strong className="text-slate-800">{req.cashierName}</strong>
                                </p>
                              </div>
                              <span className="text-[10px] text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded-md font-bold">
                                {formatRelativeTime(req.requestedAt)}
                              </span>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-1 border-t border-amber-200/60">
                              <button
                                type="button"
                                onClick={() => removeBarcodeRequest(req.id)}
                                className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                Abaikan
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAlertMenu(false);
                                  setRegisteringBarcode(req.barcode);
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Daftarkan Barang Ini</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab 2 Content: Peringatan Stok Menipis */}
                  {activeAlertTab === 'stock' && (
                    <div className="max-h-72 overflow-y-auto space-y-1.5 text-xs">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[11px] text-slate-500">Stok habis & di bawah batas minimum</span>
                        <button
                          onClick={() => {
                            setShowAlertMenu(false);
                            onNavigate('stock');
                          }}
                          className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                        >
                          Kelola Stok &rarr;
                        </button>
                      </div>

                      {lowStockCount === 0 ? (
                        <p className="text-center py-6 text-slate-400">Semua stok barang dalam kondisi aman.</p>
                      ) : (
                        <>
                          {outOfStockList.map((p) => (
                            <div
                              key={p.id}
                              className="p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-900"
                            >
                              <div className="truncate pr-2">
                                <p className="font-semibold truncate">{p.name}</p>
                                <p className="text-[10px] text-rose-600 font-mono">{p.barcode || '-'}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] shrink-0">
                                Habis (0)
                              </span>
                            </div>
                          ))}
                          {lowStockList.map((p) => (
                            <div
                              key={p.id}
                              className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-900"
                            >
                              <div className="truncate pr-2">
                                <p className="font-semibold truncate">{p.name}</p>
                                <p className="text-[10px] text-amber-600 font-mono">
                                  Sisa: {p.stock}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[10px] shrink-0">
                                Menipis ({p.stock})
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modal Pendaftaran Barang Baru dari Notifikasi Lonceng */}
          {registeringBarcode && (
            <ProductFormModal
              isOpen={Boolean(registeringBarcode)}
              initialBarcode={registeringBarcode}
              onClose={() => setRegisteringBarcode(null)}
              onSuccess={() => {
                completeBarcodeRequest(registeringBarcode);
                setRegisteringBarcode(null);
              }}
            />
          )}

          {/* User Profile & Account Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowAlertMenu(false);
              }}
              className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                  {isAdmin ? 'Admin Koperasi' : (user?.name || user?.username || 'Kasir')}
                </p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                  {isAdmin ? 'Admin Koperasi' : 'Petugas Kasir'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white text-slate-800 p-2 shadow-2xl z-50 border border-slate-200 animate-in fade-in zoom-in-95">
                {/* Account Details Header */}
                <div className="px-3 py-2.5 bg-slate-50 rounded-xl mb-1.5 border border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.name || 'Pengguna'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    @{user?.username || 'user'}
                  </p>
                  <div className="mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      {isAdmin ? 'Admin Koperasi' : 'Kasir POS'}
                    </span>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Pengaturan Sistem</span>
                  </button>
                )}

                {isCashier && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('shift-history');
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <span>Riwayat Shift Kasir</span>
                  </button>
                )}

                <div className="my-1 border-t border-slate-100"></div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Pendaftaran Barang Baru dari Notifikasi Barcode Kasir */}
      {registeringBarcode && (
        <ProductFormModal
          isOpen={!!registeringBarcode}
          onClose={() => setRegisteringBarcode(null)}
          initialBarcode={registeringBarcode}
          onSuccess={() => {
            completeBarcodeRequest(registeringBarcode);
            setRegisteringBarcode(null);
          }}
        />
      )}
    </header>
  );
};

export default Navbar;
