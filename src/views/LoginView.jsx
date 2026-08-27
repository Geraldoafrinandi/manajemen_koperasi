import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PermataLogo from '../components/common/PermataLogo';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const LoginView = () => {
  const { login } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Silakan isi username dan password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const loggedUser = await login(username, password);
      const isAdminUser = loggedUser?.role?.toLowerCase() === 'admin';
      const greeting = isAdminUser
        ? 'Berhasil masuk sebagai Admin.'
        : `Berhasil masuk sebagai Kasir (${loggedUser?.name || 'Kasir'}).`;

      toast.success(greeting);
    } catch (err) {
      const msg = err.message || 'Login gagal. Periksa kembali username dan password Anda.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Login Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-7 sm:p-8 border border-slate-200/80">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-emerald-50 rounded-2xl border border-emerald-100 mb-3.5 shadow-2xs">
            <PermataLogo variant="icon" size="lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Koperasi SD IT Permata
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Silakan masuk dengan akun Anda
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center space-x-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Masukkan username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-xs hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>
      </div>

      {/* Subtle Footer */}
      <p className="text-xs text-slate-400 mt-6 text-center font-medium">
        © {new Date().getFullYear()} Koperasi SD IT Permata
      </p>
    </div>
  );
};

export default LoginView;
