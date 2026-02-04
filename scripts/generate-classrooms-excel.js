/**
 * Yazılım Mühendisliği 2025-2026 Bahar ders programındaki derslikler için Excel oluşturur.
 * Oluşan dosyayı Uygulama → İçe Aktar → Derslikler ile yükleyebilirsiniz.
 * Çalıştırma: node scripts/generate-classrooms-excel.js
 */

const XLSX = require('xlsx');
const path = require('path');

const CLASSROOM_HEADERS = [
  'Derslik Adı',
  'Kapasite',
  'Tür',
  'Fakülte',
  'Bölüm',
  'Öncelikli Bölüm',
  'Aktif',
];

const FACULTY = 'muhendislik';

/** [ Derslik Adı, Kapasite, Tür, Bölüm, Öncelikli Bölüm ] – programdan çıkarıldı */
const CLASSROOMS = [
  ['H1', 50, 'Teorik', 'jeofizik', ''],
  ['H2', 50, 'Teorik', 'jeofizik', ''],
  ['J2', 50, 'Teorik', 'yapay-zeka', ''],
  ['D2', 50, 'Teorik', 'bilgisayar', ''],
  ['D6', 50, 'Teorik', 'bilgisayar', ''],
  ['D7', 50, 'Teorik', 'bilgisayar', ''],
  ['M101', 50, 'Teorik', 'bilgisayar', ''],
  ['LAB1', 30, 'Laboratuvar', 'bilgisayar', ''],
  ['LAB2', 30, 'Laboratuvar', 'bilgisayar', ''],
  ['LAB3', 30, 'Laboratuvar', 'bilgisayar', ''],
  ['Bilgisayar Laboratuvarı - MZ08', 30, 'Laboratuvar', 'bilgisayar', ''],
];

function buildClassroomRows() {
  return CLASSROOMS.map(([name, capacity, type, department, priorityDept]) => [
    name,
    capacity,
    type,
    FACULTY,
    department,
    priorityDept || '',
    'Evet',
  ]);
}

function main() {
  const dataRows = [CLASSROOM_HEADERS, ...buildClassroomRows()];

  const descLines = [
    'Derslik Adı: Programda geçen ad (H1, D7, LAB1, MZ08 vb.).',
    'Tür: Teorik / Laboratuvar. Kapasite ve Öncelikli Bölüm isteğe göre güncellenebilir.',
    'Fakülte: muhendislik. Bölüm: bilgisayar, jeofizik, yapay-zeka (Mühendislik altı).',
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  ws['!cols'] = CLASSROOM_HEADERS.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Derslikler');

  const descRows = [['Açıklama'], []].concat(descLines.map((l) => [l]));
  const wsDesc = XLSX.utils.aoa_to_sheet(descRows);
  wsDesc['!cols'] = [{ wch: 72 }];
  XLSX.utils.book_append_sheet(wb, wsDesc, 'Açıklama');

  const outPath = path.join(__dirname, 'derslikler-yazilim-bahar-2026.xlsx');
  XLSX.writeFile(wb, outPath);

  console.log('Oluşturuldu:', outPath);
  console.log('Uygulama → İçe Aktar → Derslikler ile bu dosyayı yükleyin.');
}

main();
