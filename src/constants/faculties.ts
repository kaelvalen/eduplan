import type { Faculty, Department } from '@/types';

export const FACULTIES: Faculty[] = [
  { id: 'dil-tarih', name: 'Dil ve Tarih Coğrafya Fakültesi' },
  { id: 'fen', name: 'Fen Fakültesi' },
  { id: 'muhendislik', name: 'Mühendislik Fakültesi' },
  { id: 'ziraat', name: 'Ziraat Fakültesi' },
  { id: 'siyasal', name: 'Siyasal Bilgiler Fakültesi' },
  { id: 'saglik', name: 'Sağlık Bilimleri Fakültesi' },
  { id: 'tip', name: 'Tıp Fakültesi' },
  { id: 'dis', name: 'Diş Hekimliği Fakültesi' },
  { id: 'eczacilik', name: 'Eczacılık Fakültesi' },
  { id: 'ilahiyat', name: 'İlahiyat Fakültesi' },
  { id: 'veteriner', name: 'Veteriner Fakültesi' },
  { id: 'hukuk', name: 'Hukuk Fakültesi' },
  { id: 'egitim', name: 'Eğitim Bilimleri Fakültesi' },
  { id: 'hemsirelik', name: 'Hemşirelik Fakültesi' },
  { id: 'gsf', name: 'Güzel Sanatlar Fakültesi' },
  { id: 'iletisim', name: 'İletişim Fakültesi' },
  { id: 'aue', name: 'Açık ve Uzaktan Eğitim Fakültesi' },
  { id: 'uygulamali', name: 'Uygulamalı Bilimler Fakültesi' },
];

export const DEPARTMENTS: Record<string, Department[]> = {
  'dil-tarih': [
    { id: 'alman', name: 'Alman Dili ve Edebiyatı (Almanca)' },
    { id: 'amerikan', name: 'Amerikan Kültürü ve Edebiyatı (İngilizce)' },
    { id: 'antropoloji', name: 'Antropoloji' },
    { id: 'arap', name: 'Arap Dili ve Edebiyatı' },
    { id: 'arkeoloji-ing', name: 'Arkeoloji (İngilizce)' },
    { id: 'bilgi-belge', name: 'Bilgi ve Belge Yönetimi' },
    { id: 'cografya', name: 'Coğrafya' },
    { id: 'dilbilimi', name: 'Dilbilimi' },
    { id: 'felsefe', name: 'Felsefe' },
    { id: 'fransiz', name: 'Fransız Dili ve Edebiyatı (Fransızca)' },
    { id: 'halkbilim', name: 'Halkbilimi' },
    { id: 'ingiliz', name: 'İngiliz Dili ve Edebiyatı (İngilizce)' },
    { id: 'japon', name: 'Japon Dili ve Edebiyatı' },
    { id: 'psikoloji', name: 'Psikoloji' },
    { id: 'rus', name: 'Rus Dili ve Edebiyatı (Rusça)' },
    { id: 'sanat', name: 'Sanat Tarihi' },
    { id: 'sosyoloji', name: 'Sosyoloji' },
    { id: 'tarih', name: 'Tarih' },
    { id: 'turk-edebiyat', name: 'Türk Dili ve Edebiyatı' },
  ],
  'fen': [
    { id: 'astronomi', name: 'Astronomi ve Uzay Bilimleri' },
    { id: 'bilgisayar-bilim', name: 'Bilgisayar Bilimleri' },
    { id: 'biyoloji', name: 'Biyoloji' },
    { id: 'biyoloji-ing', name: 'Biyoloji (İngilizce)' },
    { id: 'fizik', name: 'Fizik' },
    { id: 'istatistik', name: 'İstatistik' },
    { id: 'kimya', name: 'Kimya' },
    { id: 'kimya-ing', name: 'Kimya (İngilizce)' },
    { id: 'matematik', name: 'Matematik' },
    { id: 'matematik-ing', name: 'Matematik (İngilizce)' },
  ],
  'muhendislik': [
    { id: 'bilgisayar', name: 'Bilgisayar Mühendisliği' },
    { id: 'bilgisayar-ing', name: 'Bilgisayar Mühendisliği (İngilizce)' },
    { id: 'biyomedikal', name: 'Biyomedikal Mühendisliği (İngilizce)' },
    { id: 'elektrik-elektronik', name: 'Elektrik-Elektronik Mühendisliği (İngilizce)' },
    { id: 'fizik-muh', name: 'Fizik Mühendisliği (İngilizce)' },
    { id: 'gida', name: 'Gıda Mühendisliği (İngilizce)' },
    { id: 'insaat', name: 'İnşaat Mühendisliği' },
    { id: 'jeofizik', name: 'Jeofizik Mühendisliği (İngilizce)' },
    { id: 'jeoloji', name: 'Jeoloji Mühendisliği (İngilizce)' },
    { id: 'kimya-muh', name: 'Kimya Mühendisliği (İngilizce)' },
    { id: 'yapay-zeka', name: 'Yapay Zeka ve Veri Mühendisliği' },
    { id: 'yazilim', name: 'Yazılım Mühendisliği' },
  ],
  'ziraat': [
    { id: 'bahce', name: 'Bahçe Bitkileri' },
    { id: 'bitki-koruma', name: 'Bitki Koruma' },
    { id: 'peyzaj', name: 'Peyzaj Mimarlığı' },
    { id: 'su-urunleri', name: 'Su Ürünleri Mühendisliği' },
    { id: 'sut', name: 'Süt Teknolojisi' },
    { id: 'tarim-ekonomi', name: 'Tarım Ekonomisi' },
    { id: 'tarim-makine', name: 'Tarım Makineleri ve Teknolojileri Mühendisliği' },
    { id: 'tarla', name: 'Tarla Bitkileri' },
    { id: 'toprak', name: 'Toprak Bilimi ve Bitki Besleme' },
    { id: 'zootekni', name: 'Zootekni' },
  ],
  'siyasal': [
    { id: 'calisma', name: 'Çalışma Ekonomisi ve Endüstri İlişkileri' },
    { id: 'iktisat', name: 'İktisat' },
    { id: 'isletme', name: 'İşletme' },
    { id: 'isletme-ing', name: 'İşletme (İngilizce)' },
    { id: 'maliye', name: 'Maliye' },
    { id: 'politika', name: 'Politika ve Ekonomi (İngilizce)' },
    { id: 'siyaset', name: 'Siyaset Bilimi ve Kamu Yönetimi' },
    { id: 'uluslararasi', name: 'Uluslararası İlişkiler' },
  ],
  'saglik': [
    { id: 'beslenme', name: 'Beslenme ve Diyetetik' },
    { id: 'cocuk', name: 'Çocuk Gelişimi' },
    { id: 'odyoloji', name: 'Odyoloji' },
    { id: 'ortez', name: 'Ortez ve Protez' },
    { id: 'saglik-yonetim', name: 'Sağlık Yönetimi' },
    { id: 'sosyal-hizmet', name: 'Sosyal Hizmet' },
  ],
  'tip': [
    { id: 'tip', name: 'Tıp' },
    { id: 'tip-ing', name: 'Tıp (İngilizce)' },
  ],
  'dis': [
    { id: 'dis', name: 'Diş Hekimliği' },
    { id: 'dis-ing', name: 'Diş Hekimliği (İngilizce)' },
  ],
  'eczacilik': [
    { id: 'eczacilik', name: 'Eczacılık' },
    { id: 'eczacilik-ing', name: 'Eczacılık (İngilizce)' },
  ],
  'ilahiyat': [
    { id: 'ilahiyat', name: 'İlahiyat' },
    { id: 'ilahiyat-ing', name: 'İlahiyat (İngilizce)' },
  ],
  'veteriner': [
    { id: 'veterinerlik', name: 'Veterinerlik' },
    { id: 'veterinerlik-ing', name: 'Veterinerlik (İngilizce)' },
  ],
  'hukuk': [
    { id: 'hukuk', name: 'Hukuk' },
  ],
  'egitim': [
    { id: 'bilgisayar-egitim', name: 'Bilgisayar ve Öğretim Teknolojileri Öğretmenliği' },
    { id: 'okul-oncesi', name: 'Okul Öncesi Öğretmenliği' },
    { id: 'ozel-egitim', name: 'Özel Eğitim Öğretmenliği' },
    { id: 'rehberlik', name: 'Rehberlik ve Psikolojik Danışmanlık' },
    { id: 'sinif', name: 'Sınıf Öğretmenliği' },
    { id: 'sosyal-bilgiler', name: 'Sosyal Bilgiler Öğretmenliği' },
  ],
  'hemsirelik': [
    { id: 'ebelik', name: 'Ebelik' },
    { id: 'hemsirelik', name: 'Hemşirelik' },
  ],
  'gsf': [
    { id: 'kultur-koruma', name: 'Kültür Varlıklarını Koruma ve Onarım' },
  ],
  'iletisim': [
    { id: 'gazetecilik', name: 'Gazetecilik' },
    { id: 'halkla-iliskiler', name: 'Halkla İlişkiler ve Tanıtım' },
    { id: 'radyo', name: 'Radyo, Televizyon ve Sinema' },
    { id: 'yeni-medya', name: 'Yeni Medya ve İletişim' },
  ],
  'aue': [
    { id: 'elektronik-ticaret', name: 'Elektronik Ticaret ve Yönetimi (Açıköğretim)' },
    { id: 'yonetim-bilisim', name: 'Yönetim Bilişim Sistemleri (Açıköğretim)' },
  ],
  'uygulamali': [
    { id: 'aktuerya', name: 'Aktüerya Bilimleri' },
    { id: 'gayrimenkul', name: 'Gayrimenkul Geliştirme ve Yönetimi' },
  ],
};

export function getFacultyName(facultyId: string): string {
  const faculty = FACULTIES.find((f) => f.id === facultyId);
  return faculty?.name || facultyId;
}

export function getDepartmentName(facultyId: string, departmentId: string): string {
  const departments = DEPARTMENTS[facultyId] || [];
  const department = departments.find((d) => d.id === departmentId);
  return department?.name || departmentId;
}

export function getDepartmentsByFaculty(facultyId: string): Department[] {
  return DEPARTMENTS[facultyId] || [];
}
