/**
 * Ankara Üniversitesi öğretmenleri için Excel dosyası oluşturur.
 * Oluşan dosyayı Uygulama → İçe Aktar → Öğretmenler ile yükleyebilirsiniz.
 * Çalıştırma: node scripts/generate-teachers-excel.js
 */

const XLSX = require('xlsx');
const path = require('path');

const TEACHER_HEADERS = ['Ad Soyad', 'E-posta', 'Ünvan', 'Fakülte', 'Bölüm', 'Aktif'];
const FACULTY = 'muhendislik';
const DEPARTMENT = 'bilgisayar';

const TEACHERS = [
  ['Murat KARAKUŞ', 'mrtkarakus@ankara.edu.tr', 'Doç. Dr.', FACULTY, DEPARTMENT, 'Evet'],
  ['Mehmet Cem ÇATALBAŞ', 'mccatalbas@ankara.edu.tr', 'Doç. Dr.', FACULTY, DEPARTMENT, 'Evet'],
  ['Ümit ERTEM', 'umitertem@ankara.edu.tr', 'Doç. Dr.', FACULTY, DEPARTMENT, 'Evet'],
  ['Zafer KADIRHAN', 'zkadirhan@ankara.edu.tr', 'Dr. Öğr. Üyesi', FACULTY, DEPARTMENT, 'Evet'],
  ['Rukiye SAVRAN KIZILTEPE', 'rukiyekiziltepe@ankara.edu.tr', 'Dr. Öğr. Üyesi', FACULTY, DEPARTMENT, 'Evet'],
  ['Damla TOPALLI', 'dtopalli@ankara.edu.tr', 'Dr. Öğr. Üyesi', FACULTY, DEPARTMENT, 'Evet'],
  ['İnan KAZANCI', 'inankazanci@ankara.edu.tr', 'Dr. Öğr. Üyesi', FACULTY, DEPARTMENT, 'Evet'],
  ['Enes ASANA', 'easana@ankara.edu.tr', 'Arş. Gör.', FACULTY, DEPARTMENT, 'Evet'],
  ['Halil Hakan SARIÇİÇEK', 'hhsaricicek@ankara.edu.tr', 'Arş. Gör.', FACULTY, DEPARTMENT, 'Evet'],
  ['Berat Alp KAVUNCUOĞLU', 'bakavuncuoglu@ankara.edu.tr', 'Arş. Gör.', FACULTY, DEPARTMENT, 'Evet'],
];

const rows = [TEACHER_HEADERS, ...TEACHERS];
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(rows);
XLSX.utils.book_append_sheet(wb, ws, 'Ogretmenler');

const outPath = path.join(__dirname, 'ogretmenler-ankara.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Oluşturuldu:', outPath);
console.log('Uygulama → İçe Aktar → Öğretmenler seçip bu dosyayı yükleyin.');
