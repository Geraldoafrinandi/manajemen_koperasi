import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import PermataLogo from '../common/PermataLogo';
import {
  LayoutDashboard,
  Package,
  Layers,
  Receipt,
  FileText,
  ShoppingCart,
  Settings,
  RotateCcw,
  Barcode,
  ChevronRight,
  X,
} from 'lucide-react';

export const Sidebar = ({ currentView, onNavigate, isMobileMenuOpen, onCloseMobileMenu }) => {
  const { isAdmin } = useAuth();
  const { lowStockCount, pendingBarcodeRequestsCount } = useProducts();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('koperasi_sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('koperasi_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Admin menu grouped cleanly
  const adminSections = [
    {
      title: 'Menu Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard Analitik', icon: LayoutDashboard },
        {
          id: 'products',
          label: 'Master Data Barang',
          icon: Package,
          badge: pendingBarcodeRequestsCount > 0 ? `+${pendingBarcodeRequestsCount} Request` : null,
        },
        {
          id: 'stock',
          label: 'Stok & Mutasi',
          icon: Layers,
          badge: lowStockCount > 0 ? `${lowStockCount} Alert` : null,
        },
        { id: 'transactions', label: 'Riwayat Transaksi', icon: Receipt },
        { id: 'reports', label: 'Rekap & Laporan', icon: FileText },
      ],
    },
    {
      title: 'Konfigurasi',
      items: [
        { id: 'settings', label: 'Pengaturan Sistem', icon: Settings },
      ],
    },
  ];

  // Cashier menu grouped
  const cashierSections = [
    {
      title: 'Kasir POS',
      items: [
        { id: 'pos', label: 'Kasir POS & Scanner', icon: ShoppingCart },
        { id: 'shift-history', label: 'Riwayat Shift Kasir', icon: RotateCcw },
      ],
    },
  ];

  const sections = isAdmin ? adminSections : cashierSections;

  const renderNavItems = (isDrawer = false) => (
    <div className="flex-1 space-y-3">
      {sections.map((section, sIdx) => (
        <div key={sIdx} className="space-y-1">
          <div
            className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              !isDrawer && isCollapsed
                ? 'max-h-0 opacity-0 -translate-y-1 my-0'
                : 'max-h-8 opacity-100 translate-y-0 my-1 px-2.5 py-1'
            }`}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              {section.title}
            </span>
          </div>
          {!isDrawer && isCollapsed && sIdx > 0 && (
            <div className="my-2 border-t border-slate-100 transition-opacity duration-300" />
          )}

          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              const btnClass = isActive
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold';

              const iconClass = isActive
                ? 'text-white'
                : 'text-slate-400 group-hover:text-slate-700';

              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => {
                      onNavigate(item.id);
                      if (isDrawer && onCloseMobileMenu) {
                        onCloseMobileMenu();
                      }
                    }}
                    className={`w-full flex items-center px-2.5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors duration-200 cursor-pointer overflow-hidden ${btnClass}`}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <Icon className={`w-5 h-5 shrink-0 transition-colors ${iconClass}`} />
                      <span
                        className={`truncate whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                          !isDrawer && isCollapsed
                            ? 'max-w-0 opacity-0 -translate-x-3 pointer-events-none'
                            : 'max-w-[180px] opacity-100 translate-x-0 ml-2.5'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {/* Badge */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        !isDrawer && isCollapsed
                          ? 'max-w-0 opacity-0 scale-0'
                          : 'max-w-24 opacity-100 scale-100'
                      }`}
                    >
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 tracking-wide whitespace-nowrap ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-amber-500 text-white shadow-2xs'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {!isDrawer && isCollapsed && item.badge && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
                    )}
                  </button>

                  {/* Tooltip in collapsed mode (desktop only) */}
                  {!isDrawer && isCollapsed && (
                    <div className="fixed left-[78px] ml-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs font-bold rounded-xl shadow-xl z-50 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 flex items-center space-x-2 border border-slate-700/50">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold shadow-2xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (Visible only on md screens and larger) */}
      <aside
        className={`hidden md:flex ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        } bg-white border-r border-slate-200 flex-col shrink-0 h-full no-print shadow-xs select-none transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative will-change-[width]`}
      >
        {/* Floating Center Border Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 shadow-xs hover:shadow-sm transition-all duration-200 z-20 cursor-pointer group hover:scale-105 active:scale-95"
          title={isCollapsed ? 'Perlebar Sidebar' : 'Ciutkan Sidebar'}
        >
          <ChevronRight
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isCollapsed ? 'rotate-0' : 'rotate-180'
            }`}
          />
        </button>

        {/* Main Inner Scrollable Content */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden p-3">
          {renderNavItems(false)}

          {/* Quick Info Box / Footer */}
          <div className="mt-auto pt-3 border-t border-slate-100">
            <div
              className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isCollapsed
                  ? 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
                  : 'max-h-32 opacity-100 translate-y-0'
              }`}
            >
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700">
                <div className="flex items-center space-x-1.5 text-emerald-700 mb-0.5">
                  <Barcode className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">Smart Barcode Ready</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Mendukung scan kamera HP/webcam & scanner USB gun langsung.
                </p>
              </div>
            </div>

            {isCollapsed && (
              <div className="flex justify-center group relative py-1 transition-opacity duration-300">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 flex items-center justify-center cursor-help">
                  <Barcode className="w-5 h-5" />
                </div>
                <div className="fixed left-[78px] ml-2 bottom-4 px-3 py-2 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-slate-700">
                  <p className="font-bold text-emerald-400">Smart Barcode Ready</p>
                  <p className="text-[10px] text-slate-300">Scanner USB Gun & Kamera Aktif</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MOBILE DRAWER OVERLAY (Visible only when mobileMenuOpen is true on mobile screens) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex select-none no-print">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={onCloseMobileMenu}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          />

          {/* Slide-over Drawer */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <PermataLogo variant="full" size="sm" />
              <button
                type="button"
                onClick={onCloseMobileMenu}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Items */}
            <div className="flex-1 overflow-y-auto p-3">
              {renderNavItems(true)}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-medium flex items-center space-x-2">
                <Barcode className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Koperasi SD IT Permata POS v2.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
