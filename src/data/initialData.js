const getRealtimeNopen = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `KOP-PERMATA-KITA/${year}/${month}`;
};

export const INITIAL_USERS = [];

export const INITIAL_COOP_PROFILE = {
  name: 'KOPERASI PERMATA KITA',
  institution: 'Full Day School • Centre of Islamic Education Service',
  nopen: getRealtimeNopen(),
  address: 'Jl SMP 21 Padang',
  city: 'Kota Padang',
  postalCode: '25164',
  phone: '-',
  email: '-',
  website: '-',
  headName: 'Tidak Diketahui',
  headTitle: 'Kepala Pengelola Koperasi',
  headNip: '-',
  treasurerName: 'Tidak Diketahui',
  treasurerTitle: 'Bendahara Koperasi',
  treasurerNip: '-',
  principalName: 'Tidak Diketahui',
  principalTitle: 'Kepala Sekolah SD IT Permata',
  principalNip: '-',
  receiptHeaderTitle: 'KOPERASI PERMATA KITA',
  receiptHeaderSubtitle: 'Full Day School • Koperasi',
  receiptHeaderAddress: 'Jl SMP 21 Padang, Kota Padang',
  receiptHeaderPhone: '-',
  receiptShowLogo: true,
  receiptFooter: '*** TERIMA KASIH ***',
  receiptPolicy: '',
};

export { getRealtimeNopen };
