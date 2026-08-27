import { useState, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../../context/ToastContext';
import { formatTanggal } from '../../utils/formatters';
import PermataLogo from '../../components/common/PermataLogo';
import {
  FileSignature,
  Building,
  Save,
  Eye,
  CheckCircle2,
  FileText,
  UserCheck,
  MapPin,
  Mail,
  Phone,
  Printer,
  QrCode,
  CreditCard,
  Upload,
  Trash2,
  Wallet,
} from 'lucide-react';

export const ReportSettingsView = () => {
  const { coopProfile, updateCoopProfile } = useProducts();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: coopProfile.name || 'KOPERASI PERMATA KITA',
    institution: coopProfile.institution || 'Full Day School • Centre of Islamic Education Service',
    nopen: coopProfile.nopen || 'KOP-PERMATA-KITA/2026/08',
    address: coopProfile.address || 'Jl SMP 21 Padang',
    city: coopProfile.city || 'Padang',
    postalCode: coopProfile.postalCode || '25164',
    phone: coopProfile.phone || 'Belum ada data',
    email: coopProfile.email || 'Belum ada data',
    website: coopProfile.website || 'Belum ada data',

    // Pejabat Penandatangan Laporan Resmi
    headName: coopProfile.headName || 'Kepala Koperasi',
    headTitle: coopProfile.headTitle || 'Kepala Pengelola Koperasi',
    headNip: coopProfile.headNip || 'Belum ada data',

    treasurerName: coopProfile.treasurerName || 'Bendahara Sekolah',
    treasurerTitle: coopProfile.treasurerTitle || 'Bendahara Koperasi',
    treasurerNip: coopProfile.treasurerNip || 'Belum ada data',

    principalName: coopProfile.principalName || 'Kepala Sekolah SD IT Permata',
    principalTitle: coopProfile.principalTitle || 'Kepala Sekolah SD IT Permata',
    principalNip: coopProfile.principalNip || 'Belum ada data',

    // Format Struk Kasir POS Thermal
    receiptFooter: coopProfile.receiptFooter || '*** TERIMA KASIH ***',
    receiptPolicy: coopProfile.receiptPolicy || '',

    // QRIS Koperasi & Rekening Bank
    qrisImage: coopProfile.qrisImage || '',
    qrisMerchantName: coopProfile.qrisMerchantName || 'KOPERASI SD IT PERMATA KITA',
    qrisNmid: coopProfile.qrisNmid || 'ID1020304050607',
    qrisInstructions:
      coopProfile.qrisInstructions ||
      'Scan QRIS menggunakan BCA, Mandiri, BSI, GoPay, OVO, DANA, ShopeePay, atau aplikasi bank lainnya.',

    bankName: coopProfile.bankName || 'Bank Syariah Indonesia (BSI)',
    bankAccountNumber: coopProfile.bankAccountNumber || '7123456789',
    bankAccountHolder: coopProfile.bankAccountHolder || 'Koperasi SD IT Permata',
    bankBranch: coopProfile.bankBranch || 'KC Bandar Lampung',

    ewalletName: coopProfile.ewalletName || 'DANA / OVO / GoPay Koperasi',
    ewalletNumber: coopProfile.ewalletNumber || '0812-3456-7890',
    ewalletHolder: coopProfile.ewalletHolder || 'Koperasi SD IT Permata',
  });

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
        receiptFooter: coopProfile.receiptFooter || prev.receiptFooter,
        receiptPolicy: coopProfile.receiptPolicy || prev.receiptPolicy,
        qrisImage: coopProfile.qrisImage !== undefined ? coopProfile.qrisImage : prev.qrisImage,
        qrisMerchantName: coopProfile.qrisMerchantName || prev.qrisMerchantName,
        qrisNmid: coopProfile.qrisNmid || prev.qrisNmid,
        qrisInstructions: coopProfile.qrisInstructions || prev.qrisInstructions,
        bankName: coopProfile.bankName || prev.bankName,
        bankAccountNumber: coopProfile.bankAccountNumber || prev.bankAccountNumber,
        bankAccountHolder: coopProfile.bankAccountHolder || prev.bankAccountHolder,
        bankBranch: coopProfile.bankBranch || prev.bankBranch,
        ewalletName: coopProfile.ewalletName || prev.ewalletName,
        ewalletNumber: coopProfile.ewalletNumber || prev.ewalletNumber,
        ewalletHolder: coopProfile.ewalletHolder || prev.ewalletHolder,
      }));
    }
  }, [coopProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQrisImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (PNG, JPG, JPEG).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran gambar QRIS maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, qrisImage: event.target.result }));
      toast.success('Gambar QRIS berhasil diunggah!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQrisImage = () => {
    setFormData((prev) => ({ ...prev, qrisImage: '' }));
    toast.info('Gambar QRIS dihapus.');
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      updateCoopProfile(formData);
      toast.success('Pengaturan Format Surat, Struk & Rekening Pembayaran berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
          <FileSignature className="w-4 h-4" />
          <span>Format & Tata Naskah Dokumen</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Pengaturan Dokumen, Struk & Rekening Pembayaran
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Kelola informasi kop surat lembaga, pejabat penandatangan laporan (NIP), template struk kasir, serta QRIS & rekening bank koperasi
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Informasi Kop Surat & Lembaga */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                1. Informasi Lembaga & Kop Surat Resmi
              </h3>
              <p className="text-xs text-slate-500">
                Informasi ini otomatis tercetak pada header Kop Surat Laporan Bulanan (PDF & Cetak A4)
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
                Kota / Wilayah Penandatanganan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Bandar Lampung"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Lengkap Kantor Koperasi
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. Telepon / Hotline
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Resmi Lembaga
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Live Preview Kop Surat (Bagian Kiri: Logo, Bagian Kanan: Teks Rata Tengah) */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-900 text-xs font-bold">
              <Eye className="w-4 h-4 text-emerald-700" />
              <span>Pratinjau Kop Surat Resmi:</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center pb-2">
                <div className="w-20 shrink-0 flex items-center justify-center pr-2">
                  <PermataLogo variant="icon" size="lg" />
                </div>
                <div className="flex-1 text-center text-black space-y-0.5">
                  <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-900 leading-tight">
                    SEKOLAH DASAR ISLAM TERPADU (SD IT) PERMATA KITA
                  </h2>
                  <p className="text-[10px] font-semibold tracking-wide text-zinc-600 uppercase leading-tight">
                    FULL DAY SCHOOL - CENTRE OF ISLAMIC EDUCATION SERVICE
                  </p>
                  <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-black pt-0.5 leading-tight">
                    {formData.name || 'KOPERASI UNIT SEKOLAH "PERMATA KITA"'}
                  </h1>
                  <p className="text-[10px] text-zinc-700 pt-0.5 leading-tight">
                    {formData.address || 'Jl. Permata Madani No. 45, Kompleks Islamic Centre'}, {formData.city || 'Bandar Lampung'}
                  </p>
                  <p className="text-[10px] text-zinc-700 leading-tight">
                    Telepon / Faks. {formData.phone || '(0721) 789123 / 0812-3456-7890'}
                  </p>
                  <div className="text-[9.5px] text-zinc-700 pt-0.5 flex items-center justify-center space-x-5 leading-tight">
                    <span>Laman : {formData.website || 'https://www.permatakita.sch.id'}</span>
                    <span>Surel : {formData.email || 'koperasi@permatakita.sch.id'}</span>
                  </div>
                </div>
              </div>
              <div className="border-b-[2.5px] border-black mt-2"></div>
              <div className="border-b-[0.8px] border-black mt-[1.5px]"></div>
            </div>
          </div>
        </div>

        {/* Card 2: Pengaturan Pejabat & Penandatangan Laporan */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                2. Pejabat & Pengesahan Surat Laporan Resmi
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
                  placeholder="Fatimah, S.Pd"
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
                  placeholder="19880920 201402 2 005"
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
                  placeholder="Ustadz Ahmad Fauzi, S.E"
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
                  placeholder="19850412 201101 1 003"
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

          {/* Live Preview Kolom Tanda Tangan */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-900 text-xs font-bold">
              <Eye className="w-4 h-4 text-emerald-700" />
              <span>Live Preview Kolom Pengesahan Tanda Tangan Dokumen:</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center text-xs">
              {/* Kolom Kiri */}
              <div className="text-center min-w-[180px]">
                <p className="text-[11px] text-slate-500">Mengetahui / Menyetujui,</p>
                <p className="font-bold text-slate-900">{formData.treasurerTitle || 'Bendahara Koperasi'}</p>
                <div className="h-14 flex items-center justify-center text-slate-300 italic text-[11px] font-serif select-none">
                  ( Tanda Tangan Basah )
                </div>
                <p className="font-bold text-slate-900 underline">{formData.treasurerName || '(Nama Bendahara)'}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIP: {formData.treasurerNip || '-'}</p>
              </div>

              {/* Kolom Kanan */}
              <div className="text-center min-w-[180px]">
                <p className="text-[11px] text-slate-500">
                  {formData.city || 'Bandar Lampung'}, {formatTanggal(new Date())}
                </p>
                <p className="font-bold text-slate-900">{formData.headTitle || 'Kepala Pengelola Koperasi'}</p>
                <div className="h-14 flex items-center justify-center text-slate-300 italic text-[11px] font-serif select-none">
                  ( Tanda Tangan Basah )
                </div>
                <p className="font-bold text-slate-900 underline">{formData.headName || '(Nama Kepala)'}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIP: {formData.headNip || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Format Struk Kasir POS Thermal (Digabungkan ke sini) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Printer className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                3. Format Struk Kasir POS Thermal
              </h3>
              <p className="text-xs text-slate-500">
                Pesan doa, ucapan terima kasih, dan kebijakan penukaran barang yang tercetak di struk belanja kasir
              </p>
            </div>
          </div>

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
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kebijakan Penukaran Barang (Retur)
              </label>
              <textarea
                name="receiptPolicy"
                rows={2}
                value={formData.receiptPolicy}
                onChange={handleChange}
                placeholder="Barang yang sudah dibeli dapat ditukar maksimal 2 hari kerja dengan membawa struk ini."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Live Preview Footer Struk */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pratinjau Footer Struk Kasir (58mm / 80mm):
              </span>
              <div className="max-w-xs mx-auto p-3 bg-white border border-dashed border-slate-300 rounded-lg shadow-2xs text-[11px] text-slate-600 space-y-1 font-mono">
                <p className="font-semibold text-slate-800">
                  {formData.receiptFooter || 'Terima kasih atas kunjungan Anda.'}
                </p>
                <p className="text-[10px] text-slate-400 border-t border-slate-200 pt-1">
                  {formData.receiptPolicy}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: QRIS Koperasi & Rekening Pembayaran */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                4. QRIS Koperasi & Rekening Pembayaran Non-Tunai
              </h3>
              <p className="text-xs text-slate-500">
                Data ini akan muncul otomatis di layar kasir POS saat pelanggan memilih metode pembayaran QRIS atau Transfer Bank
              </p>
            </div>
          </div>

          {/* Sub-section A: QRIS Koperasi */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs uppercase tracking-wide">
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>Pengaturan QRIS Koperasi</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Gambar / Upload QRIS */}
              <div className="space-y-2 text-center">
                <label className="block text-xs font-bold text-slate-700 text-left">
                  Gambar / Barcode QRIS
                </label>
                <div className="w-44 h-44 mx-auto bg-white border-2 border-dashed border-emerald-300 rounded-2xl flex flex-col items-center justify-center p-2 shadow-2xs relative overflow-hidden group">
                  {formData.qrisImage ? (
                    <>
                      <img
                        src={formData.qrisImage}
                        alt="QRIS Koperasi"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveQrisImage}
                        className="absolute inset-0 bg-slate-900/70 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer"
                      >
                        <Trash2 className="w-6 h-6 text-rose-400 mb-1" />
                        <span className="text-xs font-bold">Hapus Gambar</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-3 text-slate-400 space-y-1">
                      <QrCode className="w-10 h-10 mx-auto text-emerald-600" />
                      <p className="text-[11px] font-bold text-slate-600">Belum ada QRIS</p>
                      <p className="text-[9px] text-slate-400">Format: PNG, JPG (Maks. 2MB)</p>
                    </div>
                  )}
                </div>

                <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{formData.qrisImage ? 'Ganti Gambar QRIS' : 'Upload Gambar QRIS'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrisImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Data QRIS */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Merchant QRIS
                  </label>
                  <input
                    type="text"
                    name="qrisMerchantName"
                    value={formData.qrisMerchantName}
                    onChange={handleChange}
                    placeholder="Contoh: KOPERASI SD IT PERMATA KITA"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NMID (National Merchant ID - Opsional)
                  </label>
                  <input
                    type="text"
                    name="qrisNmid"
                    value={formData.qrisNmid}
                    onChange={handleChange}
                    placeholder="Contoh: ID1020304050607"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Petunjuk Pembayaran QRIS untuk Kasir & Pembeli
                  </label>
                  <textarea
                    name="qrisInstructions"
                    rows={2}
                    value={formData.qrisInstructions}
                    onChange={handleChange}
                    placeholder="Contoh: Scan QRIS menggunakan aplikasi bank (BCA, BSI, Mandiri) atau e-wallet (GoPay, OVO, DANA, ShopeePay)."
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sub-section B: Rekening Bank Utama */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Rekening Bank Koperasi (Transfer Bank)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  placeholder="Contoh: 7123456789"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pemilik Rekening (Atas Nama)
                </label>
                <input
                  type="text"
                  name="bankAccountHolder"
                  value={formData.bankAccountHolder}
                  onChange={handleChange}
                  placeholder="Contoh: Koperasi SD IT Permata"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kantor Cabang Bank (Opsional)
                </label>
                <input
                  type="text"
                  name="bankBranch"
                  value={formData.bankBranch}
                  onChange={handleChange}
                  placeholder="Contoh: KC Bandar Lampung"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Sub-section C: E-Wallet / Akun Lainnya */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Akun E-Wallet / Pembayaran Tambahan (Opsional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Layanan
                </label>
                <input
                  type="text"
                  name="ewalletName"
                  value={formData.ewalletName}
                  onChange={handleChange}
                  placeholder="Contoh: DANA / OVO / GoPay"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Akun / No. HP
                </label>
                <input
                  type="text"
                  name="ewalletNumber"
                  value={formData.ewalletNumber}
                  onChange={handleChange}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Atas Nama E-Wallet
                </label>
                <input
                  type="text"
                  name="ewalletHolder"
                  value={formData.ewalletHolder}
                  onChange={handleChange}
                  placeholder="Contoh: Koperasi SD IT Permata"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportSettingsView;
