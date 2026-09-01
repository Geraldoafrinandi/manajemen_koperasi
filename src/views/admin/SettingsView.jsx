import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import storageService from '../../services/storageService';
import { formatTanggal } from '../../utils/formatters';
import PermataLogo from '../../components/common/PermataLogo';
import {
  Settings,
  Building,
  UserCheck,
  Printer,
  Users,
  Save,
  Eye,
  Plus,
  Key,
  Edit,
  Trash2,
  AlertTriangle,
  FileText,
  CheckCircle2,
  RefreshCw,
  Database,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  User,
} from 'lucide-react';

export const SettingsView = () => {
  const { user: currentAuthUser, isSuperAdmin, isOnlyAdmin, canManageUsers } = useAuth();
  const { coopProfile, updateCoopProfile, refreshProducts } = useProducts();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('users');

  const [formData, setFormData] = useState({
    name: coopProfile.name || 'KOPERASI PERMATA KITA',
    institution: coopProfile.institution || 'Full Day School • Centre of Islamic Education Service',
    nopen: coopProfile.nopen && coopProfile.nopen !== 'KOP-PERMATA-KITA/2026/08' ? coopProfile.nopen : `KOP-PERMATA-KITA/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    address: coopProfile.address || 'Jl SMP 21 Padang',
    city: coopProfile.city || 'Kota Padang',
    postalCode: coopProfile.postalCode || '25164',
    phone: coopProfile.phone || '-',
    email: coopProfile.email || '-',
    website: coopProfile.website || '-',

    headName: coopProfile.headName || 'Tidak Diketahui',
    headTitle: coopProfile.headTitle || 'Kepala Pengelola Koperasi',
    headNip: coopProfile.headNip || '-',

    treasurerName: coopProfile.treasurerName || 'Tidak Diketahui',
    treasurerTitle: coopProfile.treasurerTitle || 'Bendahara Koperasi',
    treasurerNip: coopProfile.treasurerNip || '-',

    principalName: coopProfile.principalName || 'Tidak Diketahui',
    principalTitle: coopProfile.principalTitle || 'Kepala Sekolah SD IT Permata',
    principalNip: coopProfile.principalNip || '-',

    receiptHeaderTitle: coopProfile.receiptHeaderTitle || coopProfile.name || 'KOPERASI PERMATA KITA',
    receiptHeaderSubtitle: coopProfile.receiptHeaderSubtitle || 'Full Day School • Koperasi',
    receiptHeaderAddress: coopProfile.receiptHeaderAddress || coopProfile.address || 'Jl SMP 21 Padang, Kota Padang',
    receiptHeaderPhone: coopProfile.receiptHeaderPhone || coopProfile.phone || '-',
    receiptShowLogo: coopProfile.receiptShowLogo !== false,
    receiptFooter: coopProfile.receiptFooter || '*** TERIMA KASIH ***',
    receiptPolicy: coopProfile.receiptPolicy || '',
  });

  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'kasir',
  });
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // State Edit User
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    name: '',
    username: '',
    role: 'kasir',
  });

  // State Hapus User
  const [userToDelete, setUserToDelete] = useState(null);

  // Load Users
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await authService.getUsers();
      const list = res.users || res.data || (Array.isArray(res) ? res : []);
      setUsersList(list);
    } catch (e) {
      console.warn('Fallback users from local:', e.message);
      setUsersList(storageService.getUsers());
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (coopProfile && Object.keys(coopProfile).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...coopProfile,
        name: coopProfile.name || prev.name,
        institution: coopProfile.institution || prev.institution,
        nopen: coopProfile.nopen || prev.nopen,
        address: coopProfile.address || prev.address,
        city: coopProfile.city || prev.city,
        postalCode: coopProfile.postalCode || prev.postalCode,
        phone: coopProfile.phone || prev.phone,
        email: coopProfile.email || prev.email,
        website: coopProfile.website || prev.website,
        headName: coopProfile.headName || prev.headName,
        headTitle: coopProfile.headTitle || prev.headTitle,
        headNip: coopProfile.headNip || prev.headNip,
        treasurerName: coopProfile.treasurerName || prev.treasurerName,
        treasurerTitle: coopProfile.treasurerTitle || prev.treasurerTitle,
        treasurerNip: coopProfile.treasurerNip || prev.treasurerNip,
        principalName: coopProfile.principalName || prev.principalName,
        principalTitle: coopProfile.principalTitle || prev.principalTitle,
        principalNip: coopProfile.principalNip || prev.principalNip,
        receiptHeaderTitle: coopProfile.receiptHeaderTitle || prev.receiptHeaderTitle,
        receiptHeaderSubtitle: coopProfile.receiptHeaderSubtitle || prev.receiptHeaderSubtitle,
        receiptHeaderAddress: coopProfile.receiptHeaderAddress || prev.receiptHeaderAddress,
        receiptHeaderPhone: coopProfile.receiptHeaderPhone || prev.receiptHeaderPhone,
        receiptShowLogo: coopProfile.receiptShowLogo !== undefined ? coopProfile.receiptShowLogo : prev.receiptShowLogo,
        receiptFooter: coopProfile.receiptFooter || prev.receiptFooter,
        receiptPolicy: coopProfile.receiptPolicy || prev.receiptPolicy,
      }));
    }
  }, [coopProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    try {
      updateCoopProfile(formData);
      toast.success('Pengaturan berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan.');
    }
  };

  // User Actions: Tambah
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error('Akses Ditolak: Hanya Super Admin yang berwenang menambahkan akun baru.');
      return;
    }
    if (!newUserData.name || !newUserData.username || !newUserData.password) {
      toast.error('Semua data pengguna wajib diisi.');
      return;
    }

    try {
      await authService.createUser(newUserData);
      toast.success(`Pengguna "${newUserData.name}" berhasil ditambahkan.`);
      setShowAddUserModal(false);
      setNewUserData({ name: '', username: '', password: '', role: 'kasir' });
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal menambahkan pengguna.');
    }
  };

  // User Actions: Edit
  const handleOpenEditUser = (u) => {
    if (!isSuperAdmin) {
      toast.error('Akses Ditolak: Hanya Super Admin yang berwenang mengubah akun pengguna.');
      return;
    }
    setEditingUser(u);
    setEditUserData({
      name: u.name || '',
      username: u.username || '',
      role: u.role || 'kasir',
    });
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error('Akses Ditolak: Hanya Super Admin yang berwenang mengubah akun pengguna.');
      return;
    }
    if (!editUserData.name || !editUserData.username) {
      toast.error('Nama dan username wajib diisi.');
      return;
    }

    try {
      await authService.updateUser(editingUser.id, editUserData);
      toast.success(`Data staf "${editUserData.name}" berhasil diperbarui.`);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui data pengguna.');
    }
  };

  // User Actions: Ganti Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error('Akses Ditolak: Hanya Super Admin yang berwenang mengganti password akun pengguna.');
      return;
    }
    if (!newPasswordInput || !selectedUserForPassword) return;

    try {
      await authService.updatePassword(selectedUserForPassword.id, {
        password: newPasswordInput,
      });
      toast.success(`Password untuk "${selectedUserForPassword.name}" berhasil diperbarui.`);
      setSelectedUserForPassword(null);
      setNewPasswordInput('');
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah password.');
    }
  };

  // User Actions: Hapus
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    if (!isSuperAdmin) {
      toast.error('Akses Ditolak: Hanya Super Admin yang berwenang menghapus akun pengguna.');
      setUserToDelete(null);
      return;
    }

    if (
      currentAuthUser &&
      (userToDelete.id === currentAuthUser.id ||
        userToDelete.username?.toLowerCase() === currentAuthUser.username?.toLowerCase())
    ) {
      toast.error('Anda tidak dapat menghapus akun yang sedang Anda gunakan saat ini.');
      setUserToDelete(null);
      return;
    }

    try {
      await authService.deleteUser(userToDelete.id);
      toast.success(`Akun "${userToDelete.name}" (@${userToDelete.username}) berhasil dihapus.`);
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus pengguna.');
    }
  };

  const displayedUsers = isSuperAdmin
    ? usersList
    : usersList.filter((u) => {
      const r = (u.role || '').toLowerCase().trim();
      return r === 'kasir' || r === 'cashier';
    });

  const tabs = [
    {
      id: 'users',
      label: isSuperAdmin ? '1. Akun Pengguna & Kasir' : '1. Akun Staf Kasir',
      icon: Users,
      badge: displayedUsers.length,
    },
    { id: 'kop_signatures', label: '2. Kop Surat & Tanda Tangan', icon: Building },
    { id: 'receipt', label: '3. Struk Kasir ', icon: Printer },
    { id: 'database', label: '4. Sinkronisasi Database', icon: Database },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div>
        <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>Konfigurasi Terpadu Koperasi</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Pengaturan Sistem Koperasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Kelola akun staf kasir, profil lembaga, kop surat & tanda tangan laporan, serta setelan struk kasir POS
        </p>
      </div>

      {/* Tab Navigation Menu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${isActive
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-700'
                    }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Manajemen Akun Pengguna & Kasir (Menu Utama No. 1) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      {isSuperAdmin ? '1. Manajemen Akun Pengguna & Kasir' : '1. Daftar Akun Staf Kasir'}
                    </h3>
                    {isSuperAdmin ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-purple-600" />
                        Super Admin: Full Akses & Kelola Akun
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-600" />
                        Admin: Mode Monitoring
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {isSuperAdmin
                      ? 'Kelola akun staf kasir, admin monitoring, dan penugasan hak akses sistem koperasi'
                      : 'Daftar staf kasir yang melayani operasional transaksi di kasir POS koperasi'}
                  </p>
                </div>
              </div>
              {isSuperAdmin ? (
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Pengguna Baru</span>
                </button>
              ) : (
                <div
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-500 text-xs rounded-xl font-medium cursor-not-allowed select-none"
                  title="Hanya Super Admin yang berwenang menambah akun baru"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  {/* <span>Tambah Akun (Khusus Super Admin)</span> */}
                </div>
              )}
            </div>

            {/* Banner Mode Monitoring untuk Admin Biasa */}
            {!isSuperAdmin && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5 shadow-2xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-950">Mode Monitoring Admin (Khusus Data Kasir)</p>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Anda login sebagai <strong>Admin (Monitoring)</strong>. Pada menu ini, hanya data akun <strong>Staf Kasir</strong> yang ditampilkan. Pembuatan akun baru serta pengelolaan akun staf/admin dibatasi khusus untuk <strong>Super Admin</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Tabel Daftar Pengguna */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5">{isSuperAdmin ? 'Nama Staf / Pengguna' : 'Nama Staf Kasir'}</th>
                    <th className="px-3.5 py-2.5">Username</th>
                    <th className="px-3.5 py-2.5">Hak Akses Role</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5 text-right">Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">Belum ada akun staf kasir terdaftar</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {isSuperAdmin
                            ? 'Silakan klik tombol "+ Tambah Pengguna Baru" untuk mendaftarkan akun kasir.'
                            : 'Hubungi Super Admin jika perlu mendaftarkan akun staf kasir baru.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedUsers.map((u) => {
                      const isSelf =
                        currentAuthUser &&
                        (u.id === currentAuthUser.id ||
                          u.username?.toLowerCase() === currentAuthUser.username?.toLowerCase());
                      const isUserSuperAdmin = u.role === 'super_admin' || u.role === 'superadmin' || u.role === 'super admin';
                      const isUserAdmin = u.role === 'admin';
                      return (
                        <tr key={u.id || u.username} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2.5 font-bold text-slate-900">
                            <div className="flex items-center space-x-2">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-slate-700">@{u.username}</td>
                          <td className="px-3.5 py-2.5">
                            {isUserSuperAdmin ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
                                <ShieldCheck className="w-2.5 h-2.5 text-purple-600" />
                                Super Admin
                              </span>
                            ) : isUserAdmin ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5 text-emerald-600" />
                                Admin (Monitoring)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                                <User className="w-2.5 h-2.5 text-blue-600" />
                                Kasir
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Aktif
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            {isSuperAdmin ? (
                              <div className="flex items-center justify-end space-x-1.5">
                                {/* Tombol Edit */}
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                                  title="Edit Profil & Role Pengguna"
                                >
                                  <Edit className="w-3 h-3 text-slate-500" />
                                  <span>Edit</span>
                                </button>

                                {/* Tombol Ganti Password */}
                                <button
                                  onClick={() => setSelectedUserForPassword(u)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-slate-200 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                                  title="Ganti Password Akun"
                                >
                                  <Key className="w-3 h-3 text-slate-500" />
                                  <span>Password</span>
                                </button>

                                {/* Tombol Hapus */}
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  disabled={isSelf}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors inline-flex items-center space-x-1 cursor-pointer ${isSelf
                                    ? 'opacity-40 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200'
                                    }`}
                                  title={isSelf ? 'Tidak dapat menghapus akun Anda sendiri' : 'Hapus Akun Pengguna'}
                                >
                                  <Trash2 className="w-3 h-3 text-rose-500" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end space-x-1 text-slate-400 text-[11px]" title="Aksi kelola akun hanya dapat dilakukan oleh Super Admin">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span className="italic">Read-Only</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Profil Lembaga, Kop Surat & Pejabat Penandatangan Laporan (Digabung 1 Halaman) */}
      {activeTab === 'kop_signatures' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* SECTION A: Informasi Lembaga & Kop Surat Resmi */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  A. Informasi Lembaga & Kop Surat Resmi (A4)
                </h3>
                <p className="text-xs text-slate-500">
                  Informasi ini otomatis tercetak pada header Kop Surat Laporan Bulanan (PDF & Cetak Dokumen A4)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Koperasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Slogan Lembaga <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="Full Day School • Centre of Islamic Education Service"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Izin / Nopen Koperasi
                </label>
                <input
                  type="text"
                  name="nopen"
                  value={formData.nopen}
                  onChange={handleChange}
                  placeholder="KOP-PERMATA-KITA/2026/08"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Telepon / Hotline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap Lembaga <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kota / Kabupaten <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Resmi
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Website Lembaga
                </label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Live Preview Kop Surat */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-900 text-xs font-bold">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>Pratinjau Kop Surat Resmi Dokumen:</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center pb-2">
                  <div className="w-24 shrink-0 flex items-center justify-center pr-3">
                    <PermataLogo variant="icon" size="kop" />
                  </div>
                  <div className="flex-1 text-center text-black space-y-0.5">
                    <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-900 leading-tight">
                      SEKOLAH DASAR ISLAM TERPADU (SD IT) PERMATA KITA
                    </h2>
                    <p className="text-[10px] font-semibold tracking-wide text-zinc-600 uppercase leading-tight">
                      {formData.institution || 'FULL DAY SCHOOL - CENTRE OF ISLAMIC EDUCATION SERVICE'}
                    </p>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-black pt-0.5 leading-tight">
                      {formData.name || 'KOPERASI UNIT SEKOLAH "PERMATA KITA"'}
                    </h1>
                    <p className="text-[10px] text-zinc-700 pt-0.5 leading-tight">
                      {formData.address || 'Jl SMP 21 Padang'}, {formData.city || 'Kota Padang'}
                    </p>
                    <p className="text-[10px] text-zinc-700 leading-tight">
                      Telepon / Faks. {formData.phone || '-'}
                    </p>
                    <div className="text-[9.5px] text-zinc-700 pt-0.5 flex items-center justify-center space-x-5 leading-tight">
                      <span>Laman : {formData.website || '-'}</span>
                      <span>Surel : {formData.email || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="border-b-[2.5px] border-black mt-2"></div>
                <div className="border-b-[0.8px] border-black mt-[1.5px]"></div>
              </div>
            </div>
          </div>

          {/* SECTION B: Pejabat Penandatangan & Pengesahan Dokumen Laporan */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  B. Pejabat & Pengesahan Dokumen Laporan Resmi
                </h3>
                <p className="text-xs text-slate-500">
                  Nama, Jabatan, dan NIP yang dicantumkan pada kolom tanda tangan laporan bulanan
                </p>
              </div>
            </div>

            {/* Block 1: Kepala Pengelola Koperasi */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                  Kepala Pengelola Koperasi (Pihak Utama)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Penandatangan Kanan
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    name="headName"
                    value={formData.headName}
                    onChange={handleChange}
                    placeholder="Nama Kepala Pengelola (Contoh: Nama Pejabat)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIP
                  </label>
                  <input
                    type="text"
                    name="headNip"
                    value={formData.headNip}
                    onChange={handleChange}
                    placeholder="NIP Pejabat (atau -)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jabatan Tertulis di Dokumen
                  </label>
                  <input
                    type="text"
                    name="headTitle"
                    value={formData.headTitle}
                    onChange={handleChange}
                    placeholder="Kepala Pengelola Koperasi"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Block 2: Bendahara Koperasi */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                  Bendahara Koperasi (Pihak Kedua)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Penandatangan Kiri
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    name="treasurerName"
                    value={formData.treasurerName}
                    onChange={handleChange}
                    placeholder="Nama Bendahara (Contoh: Nama Pejabat)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIP
                  </label>
                  <input
                    type="text"
                    name="treasurerNip"
                    value={formData.treasurerNip}
                    onChange={handleChange}
                    placeholder="NIP Bendahara (atau -)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jabatan Tertulis di Dokumen
                  </label>
                  <input
                    type="text"
                    name="treasurerTitle"
                    value={formData.treasurerTitle}
                    onChange={handleChange}
                    placeholder="Bendahara Koperasi"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Block 3: Kepala Sekolah (Mengetahui) */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  Kepala Sekolah SD IT Permata (Mengetahui / Penanggung Jawab)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  Pengesahan Lembaga
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    name="principalName"
                    value={formData.principalName}
                    onChange={handleChange}
                    placeholder="Nama Kepala Sekolah (Contoh: Nama Pejabat)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIP
                  </label>
                  <input
                    type="text"
                    name="principalNip"
                    value={formData.principalNip}
                    onChange={handleChange}
                    placeholder="NIP Kepala Sekolah (atau -)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jabatan Tertulis di Dokumen
                  </label>
                  <input
                    type="text"
                    name="principalTitle"
                    value={formData.principalTitle}
                    onChange={handleChange}
                    placeholder="Kepala Sekolah SD IT Permata"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Kolom Tanda Tangan */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-900 text-xs font-bold">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>Pratinjau Kolom Pengesahan Tanda Tangan Dokumen Laporan:</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
                {/* Baris 1: Pengelola Koperasi */}
                <div className="flex justify-between items-center">
                  {/* Kolom Kiri */}
                  <div className="text-center min-w-[180px]">
                    <p className="text-[11px] text-slate-500">Mengetahui / Menyetujui,</p>
                    <p className="font-bold text-slate-900">{formData.treasurerTitle || 'Bendahara Koperasi'}</p>
                    <div className="h-14 flex items-center justify-center text-slate-300 italic text-[11px] font-serif select-none">
                      ( Tanda Tangan Basah )
                    </div>
                    <p className="font-bold text-slate-900 underline">{formData.treasurerName || 'Tidak Diketahui'}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIP: {formData.treasurerNip || '-'}</p>
                  </div>

                  {/* Kolom Kanan */}
                  <div className="text-center min-w-[180px]">
                    <p className="text-[11px] text-slate-500">
                      {formData.city || 'Kota Padang'}, {formatTanggal(new Date())}
                    </p>
                    <p className="font-bold text-slate-900">{formData.headTitle || 'Kepala Pengelola Koperasi'}</p>
                    <div className="h-14 flex items-center justify-center text-slate-300 italic text-[11px] font-serif select-none">
                      ( Tanda Tangan Basah )
                    </div>
                    <p className="font-bold text-slate-900 underline">{formData.headName || 'Tidak Diketahui'}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIP: {formData.headNip || '-'}</p>
                  </div>
                </div>

                {/* Baris 2: Pengesahan Kepala Sekolah (Tengah) */}
                <div className="flex justify-center border-t border-slate-100 pt-4">
                  <div className="text-center min-w-[220px]">
                    <p className="text-[11px] text-slate-500">Mengetahui / Penanggung Jawab Lembaga,</p>
                    <p className="font-bold text-slate-900">{formData.principalTitle || 'Kepala Sekolah SD IT Permata'}</p>
                    <div className="h-14 flex items-center justify-center text-slate-300 italic text-[11px] font-serif select-none">
                      ( Tanda Tangan & Cap Lembaga )
                    </div>
                    <p className="font-bold text-slate-900 underline">{formData.principalName || 'Tidak Diketahui'}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIP: {formData.principalNip || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil, Kop Surat & Tanda Tangan</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Format Struk Kasir POS Thermal */}
      {activeTab === 'receipt' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Printer className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  3. Format & Setelan Struk Kasir POS Thermal
                </h3>
                <p className="text-xs text-slate-500">
                  Atur teks header, logo, footer doa, dan kebijakan retur belanja yang tercetak di kertas struk kasir
                </p>
              </div>
            </div>

            {/* Bagian A: Pengaturan Header Struk */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                  A. Header / Bagian Atas Struk
                </span>
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="receiptShowLogo"
                    checked={formData.receiptShowLogo}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Tampilkan Logo Sekolah</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Utama Header Struk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="receiptHeaderTitle"
                    value={formData.receiptHeaderTitle}
                    onChange={handleChange}
                    placeholder="KOPERASI PERMATA KITA"
                    required
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Nama unit usaha yang tercetak paling atas.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sub-judul / Tagline Struk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="receiptHeaderSubtitle"
                    value={formData.receiptHeaderSubtitle}
                    onChange={handleChange}
                    placeholder="Full Day School • Koperasi"
                    required
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Keterangan unit/sekolah di bawah judul utama.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Singkat pada Struk
                  </label>
                  <input
                    type="text"
                    name="receiptHeaderAddress"
                    value={formData.receiptHeaderAddress}
                    onChange={handleChange}
                    placeholder="Jl SMP 21 Padang, Kota Padang"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Telepon / Kontak Struk
                  </label>
                  <input
                    type="text"
                    name="receiptHeaderPhone"
                    value={formData.receiptHeaderPhone}
                    onChange={handleChange}
                    placeholder="-"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Bagian B: Pengaturan Footer Struk */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide block border-b border-slate-200/80 pb-2">
                B. Footer / Catatan Bawah Struk
              </span>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Footer Struk (Ucapan Penutup)
                  </label>
                  <textarea
                    name="receiptFooter"
                    rows={2}
                    value={formData.receiptFooter}
                    onChange={handleChange}
                    placeholder="*** TERIMA KASIH ***"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kebijakan Penukaran Barang (Opsional)
                  </label>
                  <textarea
                    name="receiptPolicy"
                    rows={2}
                    value={formData.receiptPolicy}
                    onChange={handleChange}
                    placeholder="Kosongkan jika tidak diperlukan."
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Live Visual Preview Struk Thermal */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                <span>Pratinjau Struk Thermal Kasir (Ukuran 58mm / 80mm)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Struk yang tercetak di kertas thermal mini kasir akan memiliki tata letak seperti berikut:
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 font-mono text-xs text-slate-900 max-w-sm mx-auto shadow-sm space-y-3">
                {/* Header Preview */}
                <div className="text-center space-y-1">
                  {formData.receiptShowLogo && (
                    <div className="flex justify-center mb-1">
                      <PermataLogo variant="icon" size="sm" />
                    </div>
                  )}
                  <h4 className="font-extrabold text-sm uppercase text-slate-900">
                    {formData.receiptHeaderTitle || 'KOPERASI PERMATA KITA'}
                  </h4>
                  <p className="text-[10px] text-slate-600 font-bold uppercase">
                    {formData.receiptHeaderSubtitle || 'Full Day School • Koperasi'}
                  </p>
                  <p className="text-[9px] text-slate-500">
                    {formData.receiptHeaderAddress || 'Jl SMP 21 Padang, Kota Padang'}
                  </p>
                  <p className="text-[9px] text-slate-500">
                    Telp: {formData.receiptHeaderPhone || '-'}
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-300"></div>

                <div className="text-[10px] space-y-0.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>No. Faktur:</span>
                    <span className="font-bold text-slate-900">INV-20260825-0001</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>25/08/2026 15:11</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>aman bin amanah</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300"></div>

                {/* Items Dummy Preview */}
                <div className="text-[10px] space-y-1 text-slate-800">
                  <div>
                    <p className="font-bold">Buku Tulis Permata 38 Lembar</p>
                    <div className="flex justify-between text-slate-500">
                      <span>2 x Rp 4.500</span>
                      <span className="font-bold text-slate-900">Rp 9.000</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300"></div>

                {/* Summary Dummy Preview */}
                <div className="text-[10px] space-y-0.5">
                  <div className="flex justify-between text-xs font-black text-slate-900 pt-0.5">
                    <span>TOTAL:</span>
                    <span>Rp 9.000</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Bayar (Cash):</span>
                    <span>Rp 10.000</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Kembalian:</span>
                    <span>Rp 1.000</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300"></div>

                {/* Footer Preview */}
                <div className="text-center space-y-1 text-[10px] text-slate-600">
                  <p className="font-extrabold text-slate-900">
                    {formData.receiptFooter || '*** TERIMA KASIH ***'}
                  </p>
                  {formData.receiptPolicy && (
                    <p className="text-[9px] text-slate-400">
                      {formData.receiptPolicy}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Struk Kasir</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: DATABASE & SINKRONISASI CACHE */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>Sinkronisasi Data & Cache Database</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Gunakan fitur ini untuk menyinkronkan data antara database MySQL dengan antarmuka frontend, atau membersihkan sisa cache offline browser setelah Anda menghapus data di database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opsi 1: Tarik Ulang Data Database */}
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  1. Tarik Ulang Database MySQL
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Mengambil data paling baru langsung dari server REST API MySQL (produk, mutasi stok, transaksi, kategori).
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (refreshProducts) await refreshProducts();
                    toast.success('Data berhasil ditarik ulang dari database MySQL!');
                  } catch (e) {
                    toast.error('Gagal menarik data dari server.');
                  }
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tarik Ulang Data Database</span>
              </button>
            </div>

            {/* Opsi 2: Bersihkan Cache Browser */}
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  2. Kosongkan Cache Lokal Browser
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Menghapus seluruh cache offline di browser. Sangat direkomendasikan jika Anda baru saja mengosongkan/TRUNCATE tabel database MySQL.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    storageService.clearAllData();
                    if (refreshProducts) await refreshProducts();
                    toast.success('Cache browser berhasil dibersihkan! Tampilan kini 100% mengikuti database MySQL.');
                  } catch (e) {
                    toast.error('Gagal membersihkan cache.');
                  }
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Cache Lokal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Tambah Pengguna Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Buat akun pengguna baru dengan hak akses yang sesuai
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap Staf <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) =>
                    setNewUserData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Budi Santoso"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Username Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.username}
                  onChange={(e) =>
                    setNewUserData((prev) => ({ ...prev, username: e.target.value.toLowerCase() }))
                  }
                  placeholder="kasir_budi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) =>
                    setNewUserData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Hak Akses (Role)
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) =>
                    setNewUserData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="kasir">Kasir POS (Layanan Transaksi POS & Riwayat Shift)</option>
                  <option value="admin">Admin (Monitoring Penuh Sistem, Tanpa Kelola Akun)</option>
                  <option value="super_admin">Super Admin (Full Monitoring Sistem & Kelola Akun)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Edit Akun Pengguna
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbarui identitas pengguna atau hak akses login akun @{editingUser.username}
            </p>

            <form onSubmit={handleSaveEditUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap Staf <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editUserData.name}
                  onChange={(e) =>
                    setEditUserData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Username Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editUserData.username}
                  onChange={(e) =>
                    setEditUserData((prev) => ({ ...prev, username: e.target.value.toLowerCase() }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Hak Akses (Role)
                </label>
                <select
                  value={editUserData.role}
                  onChange={(e) =>
                    setEditUserData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="kasir">Kasir POS (Layanan Transaksi POS & Riwayat Shift)</option>
                  <option value="admin">Admin (Monitoring Penuh Sistem, Tanpa Kelola Akun)</option>
                  <option value="super_admin">Super Admin (Full Monitoring Sistem & Kelola Akun)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ganti Password */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Ganti Password @{selectedUserForPassword.username}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan kata sandi baru untuk pengguna <strong>{selectedUserForPassword.name}</strong>
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Password baru"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPassword(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Ubah Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus User */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Hapus Akun Pengguna?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun staf <strong>"{userToDelete.name}"</strong> (<code className="font-mono text-rose-700">@{userToDelete.username}</code>)? Tindakan ini akan menghapus akses login pengguna secara permanen.
            </p>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
