import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!user) return;

    const checkSessionValidity = () => {
      if (!authService.isSessionValid()) {
        setUser(null);
        toast.warning('Hari telah berganti atau sesi browser berakhir. Silakan login untuk memulai shift kasir hari ini.');
      }
    };

    const timerInterval = setInterval(checkSessionValidity, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionValidity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timerInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    const handleUnauthorized = () => {
      authService.clearSession();
      setUser(null);
      toast.error('Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.');
    };

    window.addEventListener('koperasi_unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('koperasi_unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (role) => {
    const switchedUser = authService.switchRole(role);
    if (switchedUser) {
      setUser(switchedUser);
    }
    return switchedUser;
  };

  const isSuperAdmin = Boolean(
    user && (user.role === 'super_admin' || user.role === 'superadmin' || user.role === 'super admin')
  );
  const isOnlyAdmin = Boolean(user && user.role === 'admin');
  const isAdmin = Boolean(isSuperAdmin || isOnlyAdmin);
  const isCashier = Boolean(user && (user.role === 'cashier' || user.role === 'kasir'));
  const canManageUsers = isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchRole,
        isSuperAdmin,
        isOnlyAdmin,
        isAdmin,
        isCashier,
        canManageUsers,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
