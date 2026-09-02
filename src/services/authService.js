import api from './api';
import storageService from './storageService';

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SESSION_KEYS = {
  TOKEN: 'koperasi_permata_token',
  CURRENT_USER: 'koperasi_permata_current_user',
  SESSION_ACTIVE: 'koperasi_session_active',
  LOGIN_DATE: 'koperasi_login_date',
};

class AuthService {
  async login(username, password) {
    const cleanUsername = username.trim();
    const response = await api.post('/auth/login', {
      username: cleanUsername,
      email: cleanUsername,
      password,
    });

    const userData = response.user || response.data?.user || response.data || response;
    const token = response.token || response.data?.token || response.accessToken || response.data?.accessToken;

    // Simpan token di sessionStorage (khusus tab aktif saat ini)
    if (token) {
      sessionStorage.setItem(SESSION_KEYS.TOKEN, token);
    }

    const rawRole = (userData.role || '').toLowerCase().trim();
    let role = 'kasir';
    if (rawRole === 'super_admin' || rawRole === 'superadmin' || rawRole === 'super admin' || rawRole.includes('super')) {
      role = 'super_admin';
    } else if (rawRole === 'admin') {
      role = 'admin';
    } else {
      role = 'kasir';
    }

    const displayName = userData.name || (
      role === 'super_admin' ? 'Super Admin' :
        role === 'admin' ? 'Admin Koperasi' :
          'Kasir'
    );

    const user = {
      id: userData.id || userData.user_id || `usr-${Date.now()}`,
      name: displayName,
      username: userData.username || cleanUsername,
      email: userData.email || '',
      role: role,
      avatar: userData.avatar || null,
    };

    // Bersihkan sisa kredensial lama di localStorage
    localStorage.removeItem(SESSION_KEYS.TOKEN);
    localStorage.removeItem(SESSION_KEYS.LOGIN_DATE);
    localStorage.removeItem(SESSION_KEYS.CURRENT_USER);

    // Simpan data sesi baru di sessionStorage
    storageService.setCurrentUser(user);
    sessionStorage.setItem(SESSION_KEYS.SESSION_ACTIVE, '1');
    sessionStorage.setItem(SESSION_KEYS.LOGIN_DATE, getTodayDateString());

    return user;
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      this.clearSession();
    }
  }

  clearSession() {
    sessionStorage.removeItem(SESSION_KEYS.TOKEN);
    sessionStorage.removeItem(SESSION_KEYS.LOGIN_DATE);
    sessionStorage.removeItem(SESSION_KEYS.SESSION_ACTIVE);
    sessionStorage.removeItem(SESSION_KEYS.CURRENT_USER);
    localStorage.removeItem(SESSION_KEYS.TOKEN);
    localStorage.removeItem(SESSION_KEYS.LOGIN_DATE);
    localStorage.removeItem(SESSION_KEYS.CURRENT_USER);
    storageService.setCurrentUser(null);
  }

  isSessionValid() {
    const user = storageService.getCurrentUser();
    if (!user) return false;

    // 1. Wajib login ulang jika tab / browser sebelumnya telah ditutup
    const isTabSessionActive = sessionStorage.getItem(SESSION_KEYS.SESSION_ACTIVE);
    if (!isTabSessionActive) {
      this.clearSession();
      return false;
    }

    // 2. Wajib login ulang jika hari telah berganti (esok hari / tanggal berbeda)
    const today = getTodayDateString();
    const loginDate = sessionStorage.getItem(SESSION_KEYS.LOGIN_DATE);
    if (!loginDate || loginDate !== today) {
      this.clearSession();
      return false;
    }

    return true;
  }

  getCurrentUser() {
    if (!this.isSessionValid()) {
      return null;
    }
    const u = storageService.getCurrentUser();
    if (u && (u.name?.toLowerCase().includes('ustadz') || u.name?.toLowerCase().includes('fatimah') || u.name === 'Admin' || u.name === 'Administrator')) {
      if (u.role === 'super_admin' || u.role === 'superadmin') {
        u.name = 'Super Admin';
      } else if (u.role === 'admin') {
        u.name = 'Admin Koperasi';
      } else {
        u.name = 'Kasir';
      }
      storageService.setCurrentUser(u);
    }
    return u;
  }

  isSuperAdmin() {
    const user = this.getCurrentUser();
    return Boolean(user && (user.role === 'super_admin' || user.role === 'superadmin' || user.role === 'super admin'));
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return Boolean(user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'superadmin' || user.role === 'super admin'));
  }

  isCashier() {
    const user = this.getCurrentUser();
    return Boolean(user && (user.role === 'cashier' || user.role === 'kasir'));
  }

  canManageUsers() {
    return this.isSuperAdmin();
  }

  switchRole(targetRole) {
    const user = this.getCurrentUser();
    if (user) {
      const defaultName = targetRole === 'super_admin' ? 'Super Admin' : targetRole === 'admin' ? 'Admin Koperasi' : 'Kasir';
      const updated = {
        ...user,
        role: targetRole,
        name: defaultName,
      };
      storageService.setCurrentUser(updated);
      return updated;
    }
    return null;
  }

  async getUsers(params = {}) {
    const res = await api.get('/users', { params });
    return res.data || res;
  }

  async getUserById(id) {
    const res = await api.get(`/users/${id}`);
    return res.data || res;
  }

  async createUser(userData) {
    const res = await api.post('/users', userData);
    return res.data || res;
  }

  async updateUser(id, userData) {
    const res = await api.put(`/users/${id}`, userData);
    return res.data || res;
  }

  async updatePassword(id, passwordData) {
    const res = await api.patch(`/users/${id}/password`, passwordData);
    return res.data || res;
  }

  async deleteUser(id) {
    const res = await api.delete(`/users/${id}`);
    return res.data || res;
  }
}

export const authService = new AuthService();
export default authService;
