import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem('koperasi_permata_token') ||
      localStorage.getItem('koperasi_permata_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let message = 'Terjadi kesalahan pada server.';
    if (error.response) {
      const data = error.response.data;
      if (data?.errors) {
        if (Array.isArray(data.errors)) {
          message = data.errors
            .map((err) => (typeof err === 'string' ? err : err.msg || err.message || JSON.stringify(err)))
            .join(' | ');
        } else if (typeof data.errors === 'object') {
          message = Object.entries(data.errors)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
            .join(' | ');
        }
      } else if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      } else {
        message = `Error ${error.response.status}: ${error.response.statusText || 'Data tidak dapat diproses'}`;
      }

      if (error.response.status === 401) {
        sessionStorage.removeItem('koperasi_permata_token');
        sessionStorage.removeItem('koperasi_permata_current_user');
        sessionStorage.removeItem('koperasi_session_active');
        localStorage.removeItem('koperasi_permata_token');
        localStorage.removeItem('koperasi_permata_current_user');
        window.dispatchEvent(new CustomEvent('koperasi_unauthorized'));
      }
    } else if (error.request) {
      message = 'Tidak dapat terhubung ke server backend (http://localhost:5000). Pastikan backend berjalan.';
    } else {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
