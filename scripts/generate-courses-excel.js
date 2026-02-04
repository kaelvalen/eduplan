/**
 * Yazılım Mühendisliği 2025-2026 Bahar dersleri için Excel oluşturur.
 * Oluşan dosyayı Uygulama → İçe Aktar → Dersler ile yükleyebilirsiniz.
 * Önce öğretmenleri içe aktarın; Öğretmen ID'leri Öğretmenler sayfasından alınır.
 * Çalıştırma: node scripts/generate-courses-excel.js
 */

const XLSX = require('xlsx');
const path = require('path');

const COURSE_HEADERS = [
  'Ders Kodu',
  'Ders Adı',
  'Fakülte',
  'Öğretmen ID',
  'Öğretmen E-posta',
  'Seviye',
  'Kategori',
  'Dönem',
  'AKTS',
  'Haftalık Saat',
  'Oturum 1 Tür',
  'Oturum 1 Süre',
  'Oturum 2 Tür',
  'Oturum 2 Süre',
  'Oturum 3 Tür',
  'Oturum 3 Süre',
  'Bölüm',
  'Öğrenci Sayısı',
  'Aktif',
];

const FACULTY = 'muhendislik';
const DEPARTMENT = 'yazilim';
const SEMESTER = 'bahar';

/** Öğretmen e-posta → Excel'de kullanılan sıra (1 tabanlı). Önce öğretmenleri içe aktarın, sonra Öğretmenler sayfasındaki ID ile eşleyin. */
const TEACHER_BY_EMAIL = {
  'mrtkarakus@ankara.edu.tr': 1,
  'mccatalbas@ankara.edu.tr': 2,
  'umitertem@ankara.edu.tr': 3,
  'zkadirhan@ankara.edu.tr': 4,
  'rukiyekiziltepe@ankara.edu.tr': 5,
  'dtopalli@ankara.edu.tr': 6,
  'inankazanci@ankara.edu.tr': 7,
  'easana@ankara.edu.tr': 8,
  'hhsaricicek@ankara.edu.tr': 9,
  'bakavuncuoglu@ankara.edu.tr': 10,
};

const TEACHER_NAMES = {
  'mrtkarakus@ankara.edu.tr': 'Murat KARAKUŞ',
  'mccatalbas@ankara.edu.tr': 'Mehmet Cem ÇATALBAŞ',
  'umitertem@ankara.edu.tr': 'Ümit ERTEM',
  'zkadirhan@ankara.edu.tr': 'Zafer KADIRHAN',
  'rukiyekiziltepe@ankara.edu.tr': 'Rukiye SAVRAN KIZILTEPE',
  'dtopalli@ankara.edu.tr': 'Damla TOPALLI',
  'inankazanci@ankara.edu.tr': 'İnan KAZANCI',
  'easana@ankara.edu.tr': 'Enes ASANA',
  'hhsaricicek@ankara.edu.tr': 'Halil Hakan SARIÇİÇEK',
  'bakavuncuoglu@ankara.edu.tr': 'Berat Alp KAVUNCUOĞLU',
};

/** [ Ders Kodu, Ders Adı, Öğretmen E-posta, Seviye, AKTS, Oturumlar [{tür, süre}], Öğrenci ] */
const COURSES = [
  ['YMH116', 'Algoritma ve Programlamaya Giriş II', 'zkadirhan@ankara.edu.tr', '1', 6, [{ tür: 'Teorik', süre: 3 }, { tür: 'Laboratuvar', süre: 2 }], 80],
  ['MAT0144', 'Matematik II', 'umitertem@ankara.edu.tr', '1', 6, [{ tür: 'Teorik', süre: 3 }], 80],
  ['YMH118', 'Yazılım Mühendisliği Prensipleri', 'dtopalli@ankara.edu.tr', '1', 5, [{ tür: 'Teorik', süre: 3 }], 80],
  ['YMH212', 'Yazılım Gereksinimleri Analizi', 'rukiyekiziltepe@ankara.edu.tr', '2', 5, [{ tür: 'Teorik', süre: 3 }, { tür: 'Laboratuvar', süre: 2 }], 70],
  ['MAT210', 'Diferansiyel Denklemler', 'umitertem@ankara.edu.tr', '2', 5, [{ tür: 'Teorik', süre: 4 }], 70],
  ['YMH224', 'İleri Düzey Programlama', 'zkadirhan@ankara.edu.tr', '2', 5, [{ tür: 'Teorik', süre: 4 }], 70],
  ['YMH218', 'Veri Yapıları', 'mrtkarakus@ankara.edu.tr', '2', 5, [{ tür: 'Teorik', süre: 4 }], 70],
  ['YMH216', 'Yazılım Ekonomisi', 'rukiyekiziltepe@ankara.edu.tr', '2', 5, [{ tür: 'Teorik', süre: 3 }], 70],
  ['YMH336', 'Optimizasyon Teknikleri', 'umitertem@ankara.edu.tr', '3', 5, [{ tür: 'Teorik', süre: 3 }], 60],
  ['YMH334', 'Fonksiyon Temelli Programlama', 'mccatalbas@ankara.edu.tr', '3', 5, [{ tür: 'Teorik', süre: 4 }], 60],
  ['YMH354', 'Web Tasarımı ve Programlama', 'rukiyekiziltepe@ankara.edu.tr', '3', 5, [{ tür: 'Teorik', süre: 3 }, { tür: 'Laboratuvar', süre: 2 }], 60],
  ['YMH348', 'Java Programlama', 'inankazanci@ankara.edu.tr', '3', 5, [{ tür: 'Teorik', süre: 3 }, { tür: 'Laboratuvar', süre: 2 }], 60],
  ['YMH340', 'Veri Madenciliği', 'dtopalli@ankara.edu.tr', '3', 5, [{ tür: 'Teorik', süre: 4 }], 60],
  ['YMH352', 'Formal Dil ve Otomata Kuramı', 'dtopalli@ankara.edu.tr', '3', 5, [{ tür: 'Teorik', süre: 3 }, { tür: 'Laboratuvar', süre: 2 }], 60],
  ['YMH316', 'İş Kanunu', 'mrtkarakus@ankara.edu.tr', '3', 3, [{ tür: 'Teorik', süre: 2 }], 60],
  ['YMH422', 'Yapay Zeka ve Uzman Sistemler', 'inankazanci@ankara.edu.tr', '4', 5, [{ tür: 'Teorik', süre: 3 }, { tür: 'Laboratuvar', süre: 1 }], 50],
  ['YMH426', 'Mobil Yazılım Geliştirme', 'inankazanci@ankara.edu.tr', '4', 5, [{ tür: 'Teorik', süre: 3 }, { tür: 'Laboratuvar', süre: 2 }], 50],
  ['YMH424', 'Oyun Tasarımı ve Programlama', 'mccatalbas@ankara.edu.tr', '4', 5, [{ tür: 'Teorik', süre: 3 }, { tür: 'Laboratuvar', süre: 2 }], 50],
  ['YMH430', 'Robot Programlama', 'mccatalbas@ankara.edu.tr', '4', 5, [{ tür: 'Teorik', süre: 3 }, { tür: 'Laboratuvar', süre: 2 }], 50],
];

function buildCourseRows() {
  return COURSES.map(([code, name, email, level, ects, oturumlar, students]) => {
    const teacherId = TEACHER_BY_EMAIL[email];
    if (!teacherId) throw new Error(`Öğretmen bulunamadı: ${email}`);
    const total = oturumlar.reduce((s, o) => s + o.süre, 0);
    const o1 = oturumlar[0];
    const o2 = oturumlar[1];
    const o3 = oturumlar[2];
    return [
      code,
      name,
      FACULTY,
      teacherId,
      email,
      level,
      'zorunlu',
      SEMESTER,
      ects,
      total,
      o1 ? o1.tür : '',
      o1 ? o1.süre : '',
      o2 ? o2.tür : '',
      o2 ? o2.süre : '',
      o3 ? o3.tür : '',
      o3 ? o3.süre : '',
      DEPARTMENT,
      students,
      'Evet',
    ];
  });
}

function buildTeacherMappingSheet() {
  const headers = ['Sıra', 'Ad Soyad', 'E-posta', "Excel'de kullanılan Öğretmen ID"];
  const rows = Object.entries(TEACHER_BY_EMAIL)
    .sort((a, b) => a[1] - b[1])
    .map(([email], i) => [i + 1, TEACHER_NAMES[email] ?? '', email, TEACHER_BY_EMAIL[email]]);
  return [headers, ...rows];
}

function main() {
  const courseRows = buildCourseRows();
  const dataRows = [COURSE_HEADERS, ...courseRows];

  const descLines = [
    'Ders Kodu: YMH116, MAT210 gibi (büyük harf + rakam).',
    "Öğretmen E-posta: Öğretmenler sistemde kayıtlıysa e-posta ile eşlenir; Öğretmen ID'yi güncellemeniz gerekmez.",
    'Oturum 1–3 Tür/Süre: Teorik veya Laboratuvar, saat. Program oluşturucu oturum bazlı yerleştirir.',
    'Seviye: 1, 2, 3 veya 4. Kategori: zorunlu / secmeli. Dönem: güz / bahar.',
    'Bölüm: yazilim (Yazılım Mühendisliği). Öğrenci Sayısı ve AKTS isteğe göre güncellenebilir.',
    '',
    'FZM0106, FZM0152, YMH222 gibi dersler (öğretmeni listede yok) eklenmedi. Öğretmenleri tanımladıktan sonra şablonu kullanarak ekleyebilirsiniz.',
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  ws['!cols'] = COURSE_HEADERS.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Dersler');

  const mapRows = buildTeacherMappingSheet();
  const wsMap = XLSX.utils.aoa_to_sheet(mapRows);
  wsMap['!cols'] = [6, 28, 32, 28];
  XLSX.utils.book_append_sheet(wb, wsMap, 'Öğretmen Eşleme');

  const descRows = [['Açıklama'], []].concat(descLines.map((l) => [l]));
  const wsDesc = XLSX.utils.aoa_to_sheet(descRows);
  wsDesc['!cols'] = [{ wch: 72 }];
  XLSX.utils.book_append_sheet(wb, wsDesc, 'Açıklama');

  const outPath = path.join(__dirname, 'dersler-yazilim-bahar-2026.xlsx');
  XLSX.writeFile(wb, outPath);

  console.log('Oluşturuldu:', outPath);
  console.log('1) Önce Öğretmenler → İçe Aktar ile ogretmenler-ankara.xlsx yükleyin.');
  console.log('2) İçe Aktar → Dersler ile bu dosyayı yükleyin. Öğretmen E-posta ile eşleme yapılır.');
}

main();
