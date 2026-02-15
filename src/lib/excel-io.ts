/**
 * Excel içe/dışa aktarma – tek merkez
 * Şablonlar, export, sütun eşleme, import doğrulama.
 */

// xlsx-js-style: xlsx ile uyumlu, stil desteği eklenmiş versiyon
import * as XLSX from 'xlsx-js-style';
import { FACULTIES, DEPARTMENTS } from '@/constants/faculties';
import { getEmptyHours, stringifyAvailableHours } from '@/lib/time-utils';
import type { Teacher, Course, Classroom, Schedule } from '@/types';

const TITLES = ['Prof. Dr.', 'Doç. Dr.', 'Dr. Öğr. Üyesi', 'Öğr. Gör.', 'Öğr. Gör. Dr.', 'Arş. Gör.', 'Arş. Gör. Dr.'] as const;
const FACULTY_IDS = new Set(FACULTIES.map((f) => f.id));

// Başlık stili - koyu mavi arka plan, beyaz kalın yazı
const HEADER_STYLE = {
  fill: { fgColor: { rgb: '4472C4' } },
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: '2F5496' } },
    bottom: { style: 'thin', color: { rgb: '2F5496' } },
    left: { style: 'thin', color: { rgb: '2F5496' } },
    right: { style: 'thin', color: { rgb: '2F5496' } },
  },
};

// Referans sayfa başlık stili - yeşil
const REF_HEADER_STYLE = {
  fill: { fgColor: { rgb: '70AD47' } },
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: '507E32' } },
    bottom: { style: 'thin', color: { rgb: '507E32' } },
    left: { style: 'thin', color: { rgb: '507E32' } },
    right: { style: 'thin', color: { rgb: '507E32' } },
  },
};

function departmentExists(facultyId: string, deptId: string): boolean {
  const list = DEPARTMENTS[facultyId];
  if (!list) return false;
  return list.some((d) => d.id === deptId);
}

function dateSuffix(): string {
  return new Date().toISOString().split('T')[0];
}

// ---------- Export ----------

export function exportToExcel(
  data: Record<string, unknown>[],
  sheetName: string,
  filename: string
): void {
  const wb = XLSX.utils.book_new();
  if (data.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['(Veri yok)']]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  } else {
    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0]).map((k) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wch: Math.min(50, Math.max(k.length, ...data.map((r) => String((r as any)[k] ?? '').length)) + 2),
    }));
    ws['!cols'] = colWidths;
    
    // Başlık satırını dondur
    ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };
    
    // Auto filter ekle
    const numCols = Object.keys(data[0]).length;
    if (numCols > 0) {
      const endCol = XLSX.utils.encode_col(numCols - 1);
      ws['!autofilter'] = { ref: `A1:${endCol}1` };
      
      // Başlık stillerini uygula
      for (let C = 0; C < numCols; C++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[addr]) ws[addr].s = HEADER_STYLE;
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }
  XLSX.writeFile(wb, `${filename}_${dateSuffix()}.xlsx`);
}

export function mapTeachersForExport(rows: Teacher[]): Record<string, unknown>[] {
  return rows.map((t) => ({
    'ID': t.id,
    'Ad Soyad': t.name,
    'E-posta': t.email,
    'Ünvan': t.title || 'Öğr. Gör.',
    'Fakülte': t.faculty,
    'Bölüm': t.department,
    'Aktif': t.is_active !== false ? 'Evet' : 'Hayır',
  }));
}

export function mapCoursesForExport(rows: Course[]): Record<string, unknown>[] {
  return rows.map((c) => {
    const totalHours = c.total_hours ?? c.sessions?.reduce((s, x) => s + x.hours, 0) ?? 0;
    const dept = c.departments?.[0];
    const sessions = c.sessions || [];
    return {
      'ID': c.id,
      'Ders Kodu': c.code,
      'Ders Adı': c.name,
      'Fakülte': c.faculty,
      'Öğretim Elemanı ID': c.teacher_id ?? '',
      'Öğretim Elemanı': c.teacher?.name ?? '',
      'Seviye': c.level,
      'Kategori': c.category,
      'Dönem': c.semester,
      'AKTS': c.ects,
      'Haftalık Saat': totalHours,
      'Kapasite Marjı (%)': c.capacity_margin ?? 0,
      'Oturum 1 Tür': sessions[0]?.type === 'lab' ? 'Laboratuvar' : sessions[0] ? 'Teorik' : '',
      'Oturum 1 Süre': sessions[0]?.hours ?? '',
      'Oturum 2 Tür': sessions[1]?.type === 'lab' ? 'Laboratuvar' : sessions[1] ? 'Teorik' : '',
      'Oturum 2 Süre': sessions[1]?.hours ?? '',
      'Oturum 3 Tür': sessions[2]?.type === 'lab' ? 'Laboratuvar' : sessions[2] ? 'Teorik' : '',
      'Oturum 3 Süre': sessions[2]?.hours ?? '',
      'Bölüm': dept?.department ?? '',
      'Öğrenci Sayısı': dept?.student_count ?? 0,
      'Aktif': c.is_active ? 'Evet' : 'Hayır',
    };
  });
}

export function mapClassroomsForExport(rows: Classroom[]): Record<string, unknown>[] {
  return rows.map((c) => ({
    'ID': c.id,
    'Derslik Adı': c.name,
    'Kapasite': c.capacity,
    'Tür': c.type === 'teorik' ? 'Teorik' : c.type === 'lab' ? 'Laboratuvar' : 'Hibrit',
    'Fakülte': c.faculty,
    'Bölüm': c.department,
    'Öncelikli Bölüm': c.priority_dept ?? '',
    'Aktif': c.is_active !== false ? 'Evet' : 'Hayır',
  }));
}

export function mapSchedulesForExport(rows: Schedule[]): Record<string, unknown>[] {
  const dayMap: Record<string, string> = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
  };
  return rows.map((s) => ({
    'ID': s.id,
    'Gün': dayMap[(s.day || '').toLowerCase()] || s.day,
    'Saat': s.time_range,
    'Ders Kodu': s.course?.code ?? '',
    'Ders Adı': s.course?.name ?? '',
    'Derslik': s.classroom?.name ?? '',
    'Öğretim Elemanı': s.course?.teacher?.name ?? '',
  }));
}

// ---------- Templates (Veri + Açıklama) ----------

const TEACHER_HEADERS = ['Ad Soyad', 'E-posta', 'Ünvan', 'Fakülte', 'Bölüm', 'Aktif'];
const COURSE_HEADERS = [
  'Ders Kodu',
  'Ders Adı',
  'Fakülte',
  'Öğretim Elemanı ID',
  'Öğretim Elemanı E-posta',
  'Seviye',
  'Kategori',
  'Dönem',
  'AKTS',
  'Haftalık Saat',
  'Kapasite Marjı (%)',
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
const CLASSROOM_HEADERS = [
  'Derslik Adı',
  'Kapasite',
  'Tür',
  'Fakülte',
  'Bölüm',
  'Öncelikli Bölüm',
  'Aktif',
];

// Fakülte ve bölüm referans listesi oluştur
function buildFacultyReferenceSheet(): string[][] {
  const rows: string[][] = [['Fakülte ID', 'Fakülte Adı', 'Bölüm ID', 'Bölüm Adı']];
  for (const faculty of FACULTIES) {
    const depts = DEPARTMENTS[faculty.id] || [];
    if (depts.length === 0) {
      rows.push([faculty.id, faculty.name, '-', '-']);
    } else {
      for (const dept of depts) {
        rows.push([faculty.id, faculty.name, dept.id, dept.name]);
      }
    }
  }
  return rows;
}

// Ünvanlar ve diğer referans değerleri
function buildReferenceValuesSheet(): string[][] {
  return [
    ['Referans Değerler', '', '', ''],
    ['', '', '', ''],
    ['Ünvanlar', 'Seviye', 'Kategori', 'Dönem'],
    ['Prof. Dr.', '1', 'zorunlu', 'güz'],
    ['Doç. Dr.', '2', 'secmeli', 'bahar'],
    ['Dr. Öğr. Üyesi', '3', '', ''],
    ['Öğr. Gör.', '4', '', ''],
    ['Öğr. Gör. Dr.', '', '', ''],
    ['Arş. Gör.', '', '', ''],
    ['Arş. Gör. Dr.', '', '', ''],
    ['', '', '', ''],
    ['Derslik Türleri', 'Aktif Durumu', '', ''],
    ['Teorik', 'Evet', '', ''],
    ['Laboratuvar', 'Hayır', '', ''],
  ];
}

// Hücre stillerini ayarla (başlık satırı için)
function applyHeaderStyles(ws: XLSX.WorkSheet, numCols: number, headerStyle = HEADER_STYLE): void {
  // Başlık satırını dondur (freeze)
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };
  
  // Auto filter ekle
  if (numCols > 0) {
    const endCol = XLSX.utils.encode_col(numCols - 1);
    ws['!autofilter'] = { ref: `A1:${endCol}1` };
  }
  
  // Başlık hücrelerine stil uygula (koruma yok - veri girişi serbest)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; C++) {
    const headerAddr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[headerAddr]) {
      ws[headerAddr].s = headerStyle;
    }
  }
}

// Data validation (dropdown) listesi oluştur
function addDataValidation(
  ws: XLSX.WorkSheet, 
  col: number, 
  startRow: number, 
  endRow: number, 
  options: string[]
): void {
  if (!ws['!dataValidation']) ws['!dataValidation'] = [];
  
  const startCell = XLSX.utils.encode_cell({ r: startRow, c: col });
  const endCell = XLSX.utils.encode_cell({ r: endRow, c: col });
  
  (ws['!dataValidation'] as unknown[]).push({
    type: 'list',
    allowBlank: true,
    sqref: `${startCell}:${endCell}`,
    formula1: `"${options.join(',')}"`,
    showDropDown: true,
    showErrorMessage: true,
    errorTitle: 'Geçersiz Değer',
    error: `Lütfen listeden bir değer seçin: ${options.slice(0, 3).join(', ')}...`,
  });
}

function workbookWithDataAndDescription(
  dataRows: unknown[][],
  descLines: string[],
  baseName: string,
  includeReferences = true,
  validations?: { col: number; options: string[] }[]
): void {
  const wb = XLSX.utils.book_new();
  
  // Ana veri sayfası
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  const numCols = Array.isArray(dataRows[0]) ? dataRows[0].length : 0;
  ws['!cols'] = Array.from({ length: Math.max(numCols, 1) }, () => ({ wch: 20 }));
  
  // Başlık stilleri ve koruma
  applyHeaderStyles(ws, numCols);
  
  // Data validation ekle
  if (validations && dataRows.length > 1) {
    const maxRow = Math.max(dataRows.length + 100, 500); // Yeni satırlar için alan bırak
    for (const v of validations) {
      addDataValidation(ws, v.col, 1, maxRow, v.options);
    }
  }
  
  XLSX.utils.book_append_sheet(wb, ws, 'Veri');
  
  // Açıklama sayfası
  const desc = [['AÇIKLAMA'], [''], ...descLines.map((l) => [l])];
  const wsDesc = XLSX.utils.aoa_to_sheet(desc);
  wsDesc['!cols'] = [{ wch: 80 }];
  // Başlık hücresine turuncu stil uygula
  if (wsDesc['A1']) {
    wsDesc['A1'].s = {
      fill: { fgColor: { rgb: 'ED7D31' } },
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }
  XLSX.utils.book_append_sheet(wb, wsDesc, 'Açıklama');
  
  // Referans listeleri
  if (includeReferences) {
    const refRows = buildFacultyReferenceSheet();
    const wsRef = XLSX.utils.aoa_to_sheet(refRows);
    wsRef['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 25 }, { wch: 45 }];
    wsRef['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };
    // Başlık satırına yeşil stil uygula
    for (let C = 0; C < 4; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (wsRef[addr]) wsRef[addr].s = REF_HEADER_STYLE;
    }
    XLSX.utils.book_append_sheet(wb, wsRef, 'Fakülte-Bölüm Listesi');
    
    const valRows = buildReferenceValuesSheet();
    const wsVal = XLSX.utils.aoa_to_sheet(valRows);
    wsVal['!cols'] = [{ wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    // Başlık satırına (satır 2) stil uygula
    for (let C = 0; C < 4; C++) {
      const addr = XLSX.utils.encode_cell({ r: 2, c: C });
      if (wsVal[addr]) wsVal[addr].s = REF_HEADER_STYLE;
    }
    XLSX.utils.book_append_sheet(wb, wsVal, 'Referans Değerler');
  }
  
  XLSX.writeFile(wb, `${baseName}.xlsx`);
}

export function downloadTeacherTemplate(): void {
  const rows = [
    TEACHER_HEADERS,
    ['Dr. Ahmet Yılmaz', 'ahmet.yilmaz@ankara.edu.tr', 'Dr. Öğr. Üyesi', 'muhendislik', 'bilgisayar', 'Evet'],
    ['Prof. Dr. Ayşe Demir', 'ayse.demir@ankara.edu.tr', 'Prof. Dr.', 'fen', 'matematik', 'Evet'],
    ['', '', '', '', '', ''],
    ['↓ Yukarıdaki örnekleri silin ve kendi verilerinizi girin ↓', '', '', '', '', ''],
  ];
  const desc = [
    '═══════════════════════════════════════════════════════════════════════════════',
    '                      ÖĞRETİM ELEMANI AKTARMA ŞABLONU',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    '📋 ZORUNLU ALANLAR:',
    '   • Ad Soyad: En az 2 karakter (örn: "Dr. Mehmet Kaya")',
    '   • E-posta: Geçerli e-posta adresi (örn: "mkaya@ankara.edu.tr")',
    '   • Fakülte: Fakülte ID (örn: "muhendislik", "fen", "tip")',
    '   • Bölüm: İlgili fakülteye ait bölüm ID (örn: "bilgisayar", "matematik")',
    '',
    '📋 OPSİYONEL ALANLAR:',
    '   • Ünvan: Akademik ünvan (örn: "Prof. Dr.", "Doç. Dr.", "Dr. Öğr. Üyesi")',
    '     Boş bırakılırsa "Öğr. Gör." atanır.',
    '   • Aktif: "Evet" veya "Hayır". Boş bırakılırsa "Evet" kabul edilir.',
    '',
    '⚠️  ÖNEMLİ NOTLAR:',
    '   • Fakülte ve bölüm ID\'lerini "Fakülte-Bölüm Listesi" sayfasından kontrol edin.',
    '   • Ünvanları "Referans Değerler" sayfasından seçin.',
    '   • E-posta adresleri benzersiz olmalıdır.',
    '   • Örnek satırları silmeyi unutmayın.',
    '',
    '✅ GEÇERLİ ÜNVANLAR:',
    '   Prof. Dr. | Doç. Dr. | Dr. Öğr. Üyesi | Öğr. Gör. | Öğr. Gör. Dr. | Arş. Gör. | Arş. Gör. Dr.',
    '',
    '🔹 Başlık satırı korumalıdır ve değiştirilemez.',
    '🔹 Dropdown listelerden değer seçebilirsiniz (Ünvan, Aktif).',
    '🔹 Fakülte ve Bölüm için "Fakülte-Bölüm Listesi" sayfasına bakın.',
    '',
    '═══════════════════════════════════════════════════════════════════════════════',
  ];
  
  // Fakülte ID listesi
  const facultyIds = FACULTIES.map(f => f.id);
  
  // Validations: col index -> options
  const validations = [
    { col: 2, options: [...TITLES] }, // Ünvan
    { col: 3, options: facultyIds }, // Fakülte
    { col: 5, options: ['Evet', 'Hayır'] }, // Aktif
  ];
  
  workbookWithDataAndDescription(rows, desc, 'ogretim_elemani_sablonu', true, validations);
}

export function downloadCourseTemplate(): void {
  const rows = [
    COURSE_HEADERS,
    ['BIL101', 'Programlamaya Giriş', 'muhendislik', '', 'ornek@ankara.edu.tr', '1', 'zorunlu', 'güz', 5, 4, 10, 'Teorik', 2, 'Laboratuvar', 2, '', '', 'bilgisayar', 80, 'Evet'],
    ['MAT102', 'Matematik II', 'fen', '', 'ornek@ankara.edu.tr', '1', 'zorunlu', 'bahar', 6, 3, 0, 'Teorik', 3, '', '', '', '', 'matematik', 60, 'Evet'],
    ['YMH301', 'Yazılım Mimarisi', 'muhendislik', '', 'ornek@ankara.edu.tr', '3', 'secmeli', 'güz', 5, 5, 15, 'Teorik', 3, 'Laboratuvar', 2, '', '', 'yazilim', 45, 'Evet'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['↓ Yukarıdaki örnekleri silin ve kendi verilerinizi girin ↓', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  ];
  const desc = [
    '═══════════════════════════════════════════════════════════════════════════════',
    '                           DERS AKTARMA ŞABLONU',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    '📋 ZORUNLU ALANLAR:',
    '   • Ders Kodu: 2-4 harf + 3-4 rakam (örn: "BIL101", "CENG1001", "YMH302")',
    '   • Ders Adı: En az 2 karakter',
    '   • Fakülte: Fakülte ID (örn: "muhendislik", "fen")',
    '   • Öğretim Elemanı: ID veya E-posta kullanın (sistemde kayıtlı olmalı)',
    '   • Bölüm: Dersin verildiği bölüm ID',
    '',
    '📋 OPSİYONEL ALANLAR:',
    '   • Seviye: 1, 2, 3 veya 4 (varsayılan: 1)',
    '   • Kategori: "zorunlu" veya "secmeli" (varsayılan: zorunlu)',
    '   • Dönem: "güz" veya "bahar" (varsayılan: güz)',
    '   • AKTS: 1-30 arası (varsayılan: 5)',
    '   • Haftalık Saat: Toplam ders saati (oturum belirtilmezse kullanılır)',
    '   • Kapasite Marjı (%): Dersliğin öğrenci kapasitesine eklenecek tolerans',
    '     (0-30 arası, varsayılan: 0). Örn: %10 marj = 50 öğrenci için 55 kapasiteli derslik uygun.',
    '   • Öğrenci Sayısı: Tahmini öğrenci sayısı (derslik ataması için önemli)',
    '   • Aktif: "Evet" veya "Hayır" (varsayılan: Evet)',
    '',
    '📋 OTURUM ALANLARI (İSTEĞE BAĞLI):',
    '   Bir ders birden fazla oturumdan oluşabilir (örn: 2 saat Teorik + 2 saat Lab)',
    '   • Oturum 1 Tür: "Teorik" veya "Laboratuvar"',
    '   • Oturum 1 Süre: Saat cinsinden süre',
    '   • Oturum 2 Tür/Süre ve Oturum 3 Tür/Süre: İsteğe bağlı ek oturumlar',
    '   Oturum belirtmezseniz, "Haftalık Saat" değeri tek bir Teorik oturum olarak alınır.',
    '',
    '⚠️  ÖNEMLİ NOTLAR:',
    '   • Önce öğretim elemanlarını içe aktarın. Ders için öğretmen gereklidir.',
    '   • Öğretim Elemanı E-posta: Sistemde kayıtlı e-posta ile eşleştirilir.',
    '   • Fakülte ve bölüm ID\'lerini "Fakülte-Bölüm Listesi" sayfasından kontrol edin.',
    '   • Ders kodu benzersiz olmalıdır.',
    '',
    '💡 ÖRNEK OTURUM YAPILARI:',
    '   • Sadece Teorik: Oturum 1 = Teorik/3, diğerleri boş',
    '   • Teorik + Lab: Oturum 1 = Teorik/2, Oturum 2 = Laboratuvar/2',
    '   • Çoklu Lab: Oturum 1 = Teorik/2, Oturum 2 = Lab/2, Oturum 3 = Lab/2',
    '',
    '🔹 Başlık satırı korumalıdır ve değiştirilemez.',
    '🔹 Dropdown listelerden değer seçebilirsiniz (Fakülte, Seviye, Kategori, Dönem, Oturum Türleri, Aktif).',
    '',
    '═══════════════════════════════════════════════════════════════════════════════',
  ];
  
  // Fakülte ID listesi
  const facultyIds = FACULTIES.map(f => f.id);
  const sessionTypes = ['Teorik', 'Laboratuvar'];
  
  // Validations: col index -> options (COURSE_HEADERS sırasına göre)
  const validations = [
    { col: 2, options: facultyIds }, // Fakülte
    { col: 5, options: ['1', '2', '3', '4'] }, // Seviye
    { col: 6, options: ['zorunlu', 'secmeli'] }, // Kategori
    { col: 7, options: ['güz', 'bahar'] }, // Dönem
    { col: 11, options: sessionTypes }, // Oturum 1 Tür
    { col: 13, options: sessionTypes }, // Oturum 2 Tür
    { col: 15, options: sessionTypes }, // Oturum 3 Tür
    { col: 19, options: ['Evet', 'Hayır'] }, // Aktif
  ];
  
  workbookWithDataAndDescription(rows, desc, 'ders_sablonu', true, validations);
}

export function downloadClassroomTemplate(): void {
  const rows = [
    CLASSROOM_HEADERS,
    ['D-101', 60, 'Teorik', 'muhendislik', 'bilgisayar', '', 'Evet'],
    ['Lab-A', 30, 'Laboratuvar', 'muhendislik', 'bilgisayar', 'bilgisayar', 'Evet'],
    ['Amfi-1', 150, 'Teorik', 'fen', 'matematik', '', 'Evet'],
    ['', '', '', '', '', '', ''],
    ['↓ Yukarıdaki örnekleri silin ve kendi verilerinizi girin ↓', '', '', '', '', '', ''],
  ];
  const desc = [
    '═══════════════════════════════════════════════════════════════════════════════',
    '                         DERSLİK AKTARMA ŞABLONU',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    '📋 ZORUNLU ALANLAR:',
    '   • Derslik Adı: Dersliğin adı (örn: "D-101", "Lab-A", "Amfi-1")',
    '   • Fakülte: Dersliğin bulunduğu fakülte ID',
    '   • Bölüm: Dersliğin ait olduğu bölüm ID',
    '',
    '📋 OPSİYONEL ALANLAR:',
    '   • Kapasite: Öğrenci kapasitesi, 1-1000 arası (varsayılan: 30)',
    '   • Tür: "Teorik" veya "Laboratuvar" (varsayılan: Teorik)',
    '   • Öncelikli Bölüm: Bu dersliğe öncelikli erişimi olan bölüm ID (boş olabilir)',
    '   • Aktif: "Evet" veya "Hayır" (varsayılan: Evet)',
    '',
    '⚠️  ÖNEMLİ NOTLAR:',
    '   • Aynı bölümde aynı isimli derslik benzersiz olmalıdır.',
    '   • Laboratuvar türündeki derslikler sadece Lab oturumlarına atanır.',
    '   • Öncelikli bölüm belirtilirse, o bölümün derslerine öncelik verilir.',
    '   • Fakülte ve bölüm ID\'lerini "Fakülte-Bölüm Listesi" sayfasından kontrol edin.',
    '',
    '💡 DERSLİK TÜRLERİ:',
    '   • Teorik: Normal derslik, amfi, konferans salonu',
    '   • Laboratuvar: Bilgisayar lab, fizik lab, kimya lab vb.',
    '',
    '🔹 Başlık satırı korumalıdır ve değiştirilemez.',
    '🔹 Dropdown listelerden değer seçebilirsiniz (Tür, Fakülte, Aktif).',
    '',
    '═══════════════════════════════════════════════════════════════════════════════',
  ];
  
  // Fakülte ID listesi
  const facultyIds = FACULTIES.map(f => f.id);
  
  // Validations: col index -> options (CLASSROOM_HEADERS sırasına göre)
  const validations = [
    { col: 2, options: ['Teorik', 'Laboratuvar'] }, // Tür
    { col: 3, options: facultyIds }, // Fakülte
    { col: 6, options: ['Evet', 'Hayır'] }, // Aktif
  ];
  
  workbookWithDataAndDescription(rows, desc, 'derslik_sablonu', true, validations);
}

// ---------- Read Excel ----------

export function readExcelFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const data = new Uint8Array((e.target?.result as ArrayBuffer) || []);
        const wb = XLSX.read(data, { type: 'array' });
        const name = wb.SheetNames[0];
        const ws = wb.Sheets[name];
        const json = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    r.onerror = () => reject(new Error('Dosya okunamadı'));
    r.readAsArrayBuffer(file);
  });
}

// ---------- Column mapping (flexible headers) ----------

const TEACHER_MAP: Record<string, string> = {
  'ad soyad': 'Ad Soyad',
  'adi soyadi': 'Ad Soyad',
  'ad': 'Ad Soyad',
  'e-posta': 'E-posta',
  'email': 'E-posta',
  'eposta': 'E-posta',
  'ünvan': 'Ünvan',
  'unvan': 'Ünvan',
  'fakülte': 'Fakülte',
  'fakulte': 'Fakülte',
  'bölüm': 'Bölüm',
  'bolum': 'Bölüm',
  'aktif': 'Aktif',
};

const COURSE_MAP: Record<string, string> = {
  'ders kodu': 'Ders Kodu',
  'kod': 'Ders Kodu',
  'ders adı': 'Ders Adı',
  'ders adi': 'Ders Adı',
  'ad': 'Ders Adı',
  'fakülte': 'Fakülte',
  'fakulte': 'Fakülte',
  'öğretmen id': 'Öğretim Elemanı ID',
  'ogretmen id': 'Öğretim Elemanı ID',
  'öğretim elemanı id': 'Öğretim Elemanı ID',
  'ogretim elemani id': 'Öğretim Elemanı ID',
  'öğretmen e-posta': 'Öğretim Elemanı E-posta',
  'ogretmen e-posta': 'Öğretim Elemanı E-posta',
  'öğretim elemanı e-posta': 'Öğretim Elemanı E-posta',
  'ogretim elemani e-posta': 'Öğretim Elemanı E-posta',
  'seviye': 'Seviye',
  'kategori': 'Kategori',
  'dönem': 'Dönem',
  'donem': 'Dönem',
  'akts': 'AKTS',
  'haftalık saat': 'Haftalık Saat',
  'haftalik saat': 'Haftalık Saat',
  'kapasite marjı': 'Kapasite Marjı (%)',
  'kapasite marji': 'Kapasite Marjı (%)',
  'kapasite marjı (%)': 'Kapasite Marjı (%)',
  'kapasite marji (%)': 'Kapasite Marjı (%)',
  'capacity margin': 'Kapasite Marjı (%)',
  'oturum 1 tür': 'Oturum 1 Tür',
  'oturum 1 tur': 'Oturum 1 Tür',
  'oturum 1 süre': 'Oturum 1 Süre',
  'oturum 1 sure': 'Oturum 1 Süre',
  'oturum 2 tür': 'Oturum 2 Tür',
  'oturum 2 tur': 'Oturum 2 Tür',
  'oturum 2 süre': 'Oturum 2 Süre',
  'oturum 2 sure': 'Oturum 2 Süre',
  'oturum 3 tür': 'Oturum 3 Tür',
  'oturum 3 tur': 'Oturum 3 Tür',
  'oturum 3 süre': 'Oturum 3 Süre',
  'oturum 3 sure': 'Oturum 3 Süre',
  'bölüm': 'Bölüm',
  'bolum': 'Bölüm',
  'öğrenci sayısı': 'Öğrenci Sayısı',
  'ogrenci sayisi': 'Öğrenci Sayısı',
  'aktif': 'Aktif',
};

const CLASSROOM_MAP: Record<string, string> = {
  'derslik adı': 'Derslik Adı',
  'derslik adi': 'Derslik Adı',
  'ad': 'Derslik Adı',
  'kapasite': 'Kapasite',
  'tür': 'Tür',
  'tur': 'Tür',
  'fakülte': 'Fakülte',
  'fakulte': 'Fakülte',
  'bölüm': 'Bölüm',
  'bolum': 'Bölüm',
  'öncelikli bölüm': 'Öncelikli Bölüm',
  'oncelikli bolum': 'Öncelikli Bölüm',
  'aktif': 'Aktif',
};

function normalizeHeaders(
  row: Record<string, unknown>,
  map: Record<string, string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const n = String(k).trim().toLowerCase().replace(/\s+/g, ' ');
    const canonical = map[n] || k;
    out[canonical] = v;
  }
  return out;
}

// ---------- Import validation & mapping ----------

export interface RowResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  hint?: string;
  rowIndex: number;
}

// Yardımcı fonksiyon: Fakülte önerileri 
function getSimilarFaculties(input: string): string {
  const normalized = input.toLowerCase();
  const matches = FACULTIES.filter(f => 
    f.id.includes(normalized) || f.name.toLowerCase().includes(normalized)
  ).slice(0, 3);
  if (matches.length > 0) {
    return `Belki şunlardan birini mi kastedtiniz: ${matches.map(f => `"${f.id}" (${f.name})`).join(', ')}`;
  }
  return `Geçerli fakülteler: ${FACULTIES.slice(0, 5).map(f => f.id).join(', ')}...`;
}

// Yardımcı fonksiyon: Bölüm önerileri
function getSimilarDepartments(facultyId: string, input: string): string {
  const depts = DEPARTMENTS[facultyId] || [];
  if (depts.length === 0) return '';
  const normalized = input.toLowerCase();
  const matches = depts.filter(d => 
    d.id.includes(normalized) || d.name.toLowerCase().includes(normalized)
  ).slice(0, 3);
  if (matches.length > 0) {
    return `Belki şunlardan birini mi kastedtiniz: ${matches.map(d => `"${d.id}"`).join(', ')}`;
  }
  return `Bu fakültedeki bölümler: ${depts.slice(0, 5).map(d => d.id).join(', ')}${depts.length > 5 ? '...' : ''}`;
}

export function validateAndMapTeachers(
  rows: Record<string, unknown>[]
): RowResult<{ name: string; email: string; title: string; faculty: string; department: string; is_active: boolean; working_hours: string }>[] {
  const emptyHours = stringifyAvailableHours(getEmptyHours());
  return rows.map((raw, i) => {
    const r = normalizeHeaders(raw, TEACHER_MAP);
    const name = String(r['Ad Soyad'] ?? '').trim();
    const email = String(r['E-posta'] ?? '').trim().toLowerCase();
    const title = String(r['Ünvan'] ?? 'Öğr. Gör.').trim() || 'Öğr. Gör.';
    const faculty = String(r['Fakülte'] ?? '').trim();
    const department = String(r['Bölüm'] ?? '').trim();
    const active = (r['Aktif'] ?? 'Evet');
    const is_active = String(active).toLowerCase() !== 'hayır' && String(active).toLowerCase() !== 'hayir';

    if (!name || name.length < 2) {
      return { ok: false, error: '❌ "Ad Soyad" alanı boş veya çok kısa', hint: 'En az 2 karakter giriniz (örn: "Dr. Ahmet Yılmaz")', rowIndex: i + 1 };
    }
    if (!email) {
      return { ok: false, error: '❌ "E-posta" alanı boş', hint: 'Geçerli bir e-posta adresi giriniz (örn: "ahmet@ankara.edu.tr")', rowIndex: i + 1 };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: `❌ Geçersiz e-posta formatı: "${email}"`, hint: 'Doğru format: kullanici@domain.com', rowIndex: i + 1 };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!TITLES.includes(title as any)) {
      return { ok: false, error: `❌ Geçersiz ünvan: "${title}"`, hint: `Geçerli ünvanlar: ${TITLES.join(', ')}`, rowIndex: i + 1 };
    }
    if (!faculty) {
      return { ok: false, error: '❌ "Fakülte" alanı boş', hint: 'Şablondaki "Fakülte-Bölüm Listesi" sayfasından fakülte ID seçiniz', rowIndex: i + 1 };
    }
    if (!FACULTY_IDS.has(faculty)) {
      return { ok: false, error: `❌ Bilinmeyen fakülte: "${faculty}"`, hint: getSimilarFaculties(faculty), rowIndex: i + 1 };
    }
    if (!department) {
      return { ok: false, error: '❌ "Bölüm" alanı boş', hint: 'Şablondaki "Fakülte-Bölüm Listesi" sayfasından bölüm ID seçiniz', rowIndex: i + 1 };
    }
    if (!departmentExists(faculty, department)) {
      const hint = getSimilarDepartments(faculty, department);
      return { ok: false, error: `❌ "${faculty}" fakültesinde "${department}" bölümü yok`, hint, rowIndex: i + 1 };
    }

    return {
      ok: true,
      data: {
        name,
        email,
        title,
        faculty,
        department,
        is_active,
        working_hours: emptyHours,
      },
      rowIndex: i + 1,
    };
  });
}

export function validateAndMapCourses(
  rows: Record<string, unknown>[],
  existingTeacherIds: Set<number>,
  teacherEmailToId?: Map<string, number>
): RowResult<{
  code: string;
  name: string;
  faculty: string;
  teacher_id: number;
  level: string;
  category: 'zorunlu' | 'secmeli';
  semester: string;
  ects: number;
  total_hours: number;
  capacity_margin: number;
  departments: { department: string; student_count: number }[];
  is_active: boolean;
  sessions: { type: 'teorik' | 'lab'; hours: number }[];
}>[] {
  return rows.map((r, i) => {
    const row = normalizeHeaders(r, COURSE_MAP);
    const code = String(row['Ders Kodu'] ?? '').trim().toUpperCase();
    const name = String(row['Ders Adı'] ?? '').trim();
    const faculty = String(row['Fakülte'] ?? '').trim();
    const teacherIdRaw = row['Öğretim Elemanı ID'];
    let teacher_id = typeof teacherIdRaw === 'number' ? teacherIdRaw : parseInt(String(teacherIdRaw || ''), 10);
    const emailRaw = String(row['Öğretim Elemanı E-posta'] ?? '').trim().toLowerCase();

    if (isNaN(teacher_id) || !existingTeacherIds.has(teacher_id)) {
      if (emailRaw && teacherEmailToId?.has(emailRaw)) {
        teacher_id = teacherEmailToId.get(emailRaw)!;
      } else {
        const hint = emailRaw 
          ? `"${emailRaw}" sistemde kayıtlı değil. Önce öğretim elemanlarını içe aktarın.`
          : 'ID veya E-posta alanlarından birini doldurunuz.';
        return { ok: false, error: '❌ Öğretim elemanı bulunamadı', hint, rowIndex: i + 1 };
      }
    }

    const level = String(row['Seviye'] ?? '1').trim();
    const cat = String(row['Kategori'] ?? 'zorunlu').toLowerCase();
    const category = (cat === 'secmeli' || cat === 'seçmeli') ? 'secmeli' : 'zorunlu';
    const semester = String(row['Dönem'] ?? 'güz').trim().toLowerCase();
    const ects = parseInt(String(row['AKTS'] ?? '5'), 10) || 5;
    const weeklyHoursFallback = parseInt(String(row['Haftalık Saat'] ?? '3'), 10) || 3;
    const capacityMarginRaw = parseInt(String(row['Kapasite Marjı (%)'] ?? '0'), 10);
    const capacity_margin = isNaN(capacityMarginRaw) ? 0 : Math.max(0, Math.min(30, capacityMarginRaw));
    const department = String(row['Bölüm'] ?? '').trim();
    const student_count = parseInt(String(row['Öğrenci Sayısı'] ?? '0'), 10) || 0;
    const active = row['Aktif'];
    const is_active = String(active ?? 'Evet').toLowerCase() !== 'hayır' && String(active ?? 'Evet').toLowerCase() !== 'hayir';

    if (!code || !/^[A-Z]{2,4}\d{3,4}$/.test(code)) {
      return { ok: false, error: `❌ Geçersiz ders kodu: "${code || '(boş)'}"`, hint: 'Format: 2-4 harf + 3-4 rakam (örn: BIL101, CENG1001, YMH302)', rowIndex: i + 1 };
    }
    if (!name || name.length < 2) {
      return { ok: false, error: '❌ "Ders Adı" alanı boş veya çok kısa', hint: 'En az 2 karakter giriniz', rowIndex: i + 1 };
    }
    if (!faculty) {
      return { ok: false, error: '❌ "Fakülte" alanı boş', hint: 'Şablondaki "Fakülte-Bölüm Listesi" sayfasından fakülte ID seçiniz', rowIndex: i + 1 };
    }
    if (!FACULTY_IDS.has(faculty)) {
      return { ok: false, error: `❌ Bilinmeyen fakülte: "${faculty}"`, hint: getSimilarFaculties(faculty), rowIndex: i + 1 };
    }
    if (!['1', '2', '3', '4'].includes(level)) {
      return { ok: false, error: `❌ Geçersiz seviye: "${level}"`, hint: 'Seviye 1, 2, 3 veya 4 olmalı', rowIndex: i + 1 };
    }
    if (!department) {
      return { ok: false, error: '❌ "Bölüm" alanı boş', hint: 'Dersin verildiği bölümü belirtiniz', rowIndex: i + 1 };
    }
    if (!departmentExists(faculty, department)) {
      return { ok: false, error: `❌ "${faculty}" fakültesinde "${department}" bölümü yok`, hint: getSimilarDepartments(faculty, department), rowIndex: i + 1 };
    }

    const departments = [{ department, student_count }];
    let sessions: { type: 'teorik' | 'lab'; hours: number }[] = [];
    for (let n = 1; n <= 3; n++) {
      const tur = String(row[`Oturum ${n} Tür` as keyof typeof row] ?? '').trim().toLowerCase();
      const sureRaw = row[`Oturum ${n} Süre` as keyof typeof row];
      const sure = typeof sureRaw === 'number' ? sureRaw : parseInt(String(sureRaw ?? ''), 10) || 0;
      if (sure > 0) {
        const type = (tur === 'laboratuvar' || tur === 'lab') ? 'lab' as const : 'teorik' as const;
        sessions.push({ type, hours: Math.max(1, Math.min(10, sure)) });
      }
    }
    let total_hours: number;
    if (sessions.length > 0) {
      total_hours = sessions.reduce((sum, s) => sum + s.hours, 0);
    } else {
      total_hours = Math.max(1, Math.min(100, weeklyHoursFallback));
      sessions = [{ type: 'teorik' as const, hours: total_hours }];
    }

    return {
      ok: true,
      data: {
        code,
        name,
        faculty,
        teacher_id,
        level,
        category,
        semester: semester || 'güz',
        ects: Math.max(0, Math.min(30, ects)),
        total_hours,
        capacity_margin,
        departments,
        is_active,
        sessions,
      },
      rowIndex: i + 1,
    };
  });
}

export function validateAndMapClassrooms(
  rows: Record<string, unknown>[]
): RowResult<{
  name: string;
  capacity: number;
  type: 'teorik' | 'lab';
  faculty: string;
  department: string;
  priority_dept?: string;
  is_active: boolean;
}>[] {
  return rows.map((r, i) => {
    const row = normalizeHeaders(r, CLASSROOM_MAP);
    const name = String(row['Derslik Adı'] ?? '').trim();
    const capacity = parseInt(String(row['Kapasite'] ?? '30'), 10) || 30;
    const typeRaw = String(row['Tür'] ?? 'Teorik').toLowerCase();
    const type = typeRaw === 'laboratuvar' || typeRaw === 'lab' ? 'lab' : 'teorik';
    const faculty = String(row['Fakülte'] ?? '').trim();
    const department = String(row['Bölüm'] ?? '').trim();
    const priority_dept = String(row['Öncelikli Bölüm'] ?? '').trim() || undefined;
    const active = row['Aktif'];
    const is_active = String(active ?? 'Evet').toLowerCase() !== 'hayır' && String(active ?? 'Evet').toLowerCase() !== 'hayir';

    if (!name) {
      return { ok: false, error: '❌ "Derslik Adı" alanı boş', hint: 'Derslik adı giriniz (örn: "D-101", "Lab-A")', rowIndex: i + 1 };
    }
    if (!faculty) {
      return { ok: false, error: '❌ "Fakülte" alanı boş', hint: 'Şablondaki "Fakülte-Bölüm Listesi" sayfasından fakülte ID seçiniz', rowIndex: i + 1 };
    }
    if (!FACULTY_IDS.has(faculty)) {
      return { ok: false, error: `❌ Bilinmeyen fakülte: "${faculty}"`, hint: getSimilarFaculties(faculty), rowIndex: i + 1 };
    }
    if (!department) {
      return { ok: false, error: '❌ "Bölüm" alanı boş', hint: 'Dersliğin ait olduğu bölümü belirtiniz', rowIndex: i + 1 };
    }
    if (!departmentExists(faculty, department)) {
      return { ok: false, error: `❌ "${faculty}" fakültesinde "${department}" bölümü yok`, hint: getSimilarDepartments(faculty, department), rowIndex: i + 1 };
    }

    return {
      ok: true,
      data: {
        name,
        capacity: Math.max(1, Math.min(1000, capacity)),
        type,
        faculty,
        department,
        priority_dept,
        is_active,
      },
      rowIndex: i + 1,
    };
  });
}
