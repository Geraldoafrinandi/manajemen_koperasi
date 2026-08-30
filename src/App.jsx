import { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layout
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Views
import LoginView from './views/LoginView';
import DashboardView from './views/admin/DashboardView';
import ProductsView from './views/admin/ProductsView';
import StockManagementView from './views/admin/StockManagementView';
import TransactionsView from './views/admin/TransactionsView';
import MonthlyReportsView from './views/admin/MonthlyReportsView';
import SettingsView from './views/admin/SettingsView';
import PosView from './views/cashier/PosView';
import ShiftHistoryView from './views/cashier/ShiftHistoryView';
import PriceCheckerView from './views/cashier/PriceCheckerView';

function AppContent() {
  const { user, isAuthenticated, isAdmin, isCashier } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync initial view based on role
  useEffect(() => {
    if (isCashier && currentView !== 'pos' && currentView !== 'shift-history' && currentView !== 'price-checker') {
      setCurrentView('pos');
    } else if (isAdmin && (currentView === 'pos' || currentView === 'shift-history')) {
      setCurrentView('dashboard');
    }
  }, [isAdmin, isCashier]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleNavigate = (viewId) => {
    setMobileMenuOpen(false);
    // Role guard: Kasir boleh membuka POS kasir, riwayat shift, dan cek harga
    if (isCashier && viewId !== 'pos' && viewId !== 'shift-history' && viewId !== 'price-checker') {
      setCurrentView('pos');
      return;
    }
    // Role guard: Admin tidak boleh membuka proses POS kasir
    if (isAdmin && (viewId === 'pos' || viewId === 'shift-history')) {
      setCurrentView('dashboard');
      return;
    }
    setCurrentView(viewId);
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col text-slate-800 overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        onNavigate={handleNavigate}
        currentView={currentView}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      {/* Main Body Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Sidebar (Desktop Collapsible & Mobile Slide-over Drawer) */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isMobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-slate-50 focus:outline-none">
          {/* Admin Views */}
          {isAdmin && currentView === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
          {isAdmin && currentView === 'products' && <ProductsView />}
          {isAdmin && currentView === 'stock' && <StockManagementView />}
          {isAdmin && currentView === 'transactions' && <TransactionsView />}
          {isAdmin && currentView === 'reports' && <MonthlyReportsView />}
          {isAdmin && (currentView === 'settings' || currentView === 'report-settings') && <SettingsView />}
          {isAdmin && currentView === 'price-checker' && <PriceCheckerView onNavigate={handleNavigate} />}

          {/* Cashier Views */}
          {isCashier && currentView === 'pos' && <PosView onNavigate={handleNavigate} />}
          {isCashier && currentView === 'shift-history' && <ShiftHistoryView onNavigate={handleNavigate} />}
          {isCashier && currentView === 'price-checker' && <PriceCheckerView onNavigate={handleNavigate} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ProductProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
