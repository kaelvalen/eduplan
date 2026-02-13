/**
 * Excel içe/dışa aktarma – tek merkez
 * Şablonlar, export, sütun eşleme, import doğrulama.
 */

import * as XLSX from 'xlsx';
import { FACULTIES, DEPARTMENTS } from '@/constants/faculties';
import { getEmptyHours, stringifyAvailableHours } from '@/lib/time-utils';
import type { Teacher, Course, Classroom, Schedule } from '@/types';

const TITLES = ['Prof. Dr.', 'Doç. Dr.', 'Dr. Öğr. Üyesi', 'Öğr. Gör.', 'Öğr. Gör. Dr.', 'Arş. Gör.', 'Arş. Gör. Dr.'] as const;
const FACULTY_IDS = new Set(FACULTIES.map((f) => f.id));

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
      wch: Math.min(50, Math.max(k.length, ...data.map((r) => String((r as any)[k] ?? '').length)) + 2),
    }));
    ws['!cols'] = colWidths;
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

function workbookWithDataAndDescription(
  dataRows: unknown[][],
  descLines: string[],
  baseName: string
): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  const numCols = Array.isArray(dataRows[0]) ? dataRows[0].length : 0;
  ws['!cols'] = Array.from({ length: Math.max(numCols, 1) }, () => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Veri');
  const desc = [['Açıklama'], [''], ...descLines.map((l) => [l])];
  const wsDesc = XLSX.utils.aoa_to_sheet(desc);
  wsDesc['!cols'] = [{ wch: 72 }];
  XLSX.utils.book_append_sheet(wb, wsDesc, 'Açıklama');
  XLSX.writeFile(wb, `${baseName}.xlsx`);
}

export function downloadTeacherTemplate(): void {
  const rows = [
    TEACHER_HEADERS,
    ['Örnek Öğretim Elemanı', 'ornek@ankara.edu.tr', 'Öğr. Gör.', 'muhendislik', 'bilgisayar', 'Evet'],
  ];
  const desc = [
    'Fakülte: muhendislik, fen, dil-tarih, ... (sistemdeki ID)',
    'Bölüm: ilgili fakülteye ait bölüm ID (örn. bilgisayar, matematik)',
    'Ünvan: Prof. Dr., Doç. Dr., Dr. Öğr. Üyesi, Öğr. Gör., Öğr. Gör. Dr., Arş. Gör., Arş. Gör. Dr.',
    'Aktif: Evet / Hayır',
  ];
  workbookWithDataAndDescription(rows, desc, 'ogretmen_sablonu');
}

export function downloadCourseTemplate(): void {
  const rows = [
    COURSE_HEADERS,
    ['BIL101', 'Programlamaya Giriş', 'muhendislik', 1, 'ornek@ankara.edu.tr', '1', 'zorunlu', 'güz', 5, 4, 'Teorik', 3, 'Laboratuvar', 2, '', '', 'bilgisayar', 80, 'Evet'],
  ];
  const desc = [
    'Ders Kodu: BIL101, CENG1001 gibi (büyük harf + rakam)',
    'Öğretim Elemanı ID veya Öğretim Elemanı E-posta: ID geçerliyse kullanılır; yoksa e-posta ile sistemdeki öğretim elemanı eşlenir.',
    'Oturum 1–3 Tür / Süre: Her oturum için Tür (Teorik / Laboratuvar) ve Süre (saat). Toplam = Haftalık Saat. Oturum yoksa yalnızca Haftalık Saat kullanılır.',
    'Seviye: 1, 2, 3 veya 4. Kategori: zorunlu / secmeli. Dönem: güz / bahar.',
    'Bölüm + Öğrenci Sayısı: dersin verildiği bölüm ve öğrenci sayısı.',
  ];
  workbookWithDataAndDescription(rows, desc, 'ders_sablonu');
}

export function downloadClassroomTemplate(): void {
  const rows = [
    CLASSROOM_HEADERS,
    ['R101', 60, 'Teorik', 'muhendislik', 'bilgisayar', '', 'Evet'],
  ];
  const desc = [
    'Tür: Teorik / Laboratuvar',
    'Öncelikli Bölüm: boş bırakılabilir',
    'Aktif: Evet / Hayır',
  ];
  workbookWithDataAndDescription(rows, desc, 'derslik_sablonu');
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
  rowIndex: number;
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

    if (!name || name.length < 2) return { ok: false, error: 'Ad Soyad gerekli (en az 2 karakter)', rowIndex: i + 1 };
    if (!email) return { ok: false, error: 'E-posta gerekli', rowIndex: i + 1 };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Geçersiz e-posta', rowIndex: i + 1 };
    if (!TITLES.includes(title as any)) return { ok: false, error: `Ünvan geçersiz. Örnek: ${TITLES.slice(0, 3).join(', ')}`, rowIndex: i + 1 };
    if (!faculty) return { ok: false, error: 'Fakülte gerekli', rowIndex: i + 1 };
    if (!FACULTY_IDS.has(faculty)) return { ok: false, error: `Bilinmeyen fakülte: ${faculty}`, rowIndex: i + 1 };
    if (!department) return { ok: false, error: 'Bölüm gerekli', rowIndex: i + 1 };
    if (!departmentExists(faculty, department)) return { ok: false, error: `Bölüm "${department}" bu fakültede yok`, rowIndex: i + 1 };

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
        return { ok: false, error: 'Geçerli Öğretim Elemanı ID veya Öğretim Elemanı E-posta gerekli (e-posta sistemde kayıtlı olmalı)', rowIndex: i + 1 };
      }
    }

    const level = String(row['Seviye'] ?? '1').trim();
    const cat = String(row['Kategori'] ?? 'zorunlu').toLowerCase();
    const category = (cat === 'secmeli' || cat === 'seçmeli') ? 'secmeli' : 'zorunlu';
    const semester = String(row['Dönem'] ?? 'güz').trim().toLowerCase();
    const ects = parseInt(String(row['AKTS'] ?? '5'), 10) || 5;
    const weeklyHoursFallback = parseInt(String(row['Haftalık Saat'] ?? '3'), 10) || 3;
    const department = String(row['Bölüm'] ?? '').trim();
    const student_count = parseInt(String(row['Öğrenci Sayısı'] ?? '0'), 10) || 0;
    const active = row['Aktif'];
    const is_active = String(active ?? 'Evet').toLowerCase() !== 'hayır' && String(active ?? 'Evet').toLowerCase() !== 'hayir';

    if (!code || !/^[A-Z]{2,4}\d{3,4}$/.test(code)) return { ok: false, error: 'Ders Kodu gerekli (örn. BIL101, CENG1001)', rowIndex: i + 1 };
    if (!name || name.length < 2) return { ok: false, error: 'Ders Adı gerekli', rowIndex: i + 1 };
    if (!faculty) return { ok: false, error: 'Fakülte gerekli', rowIndex: i + 1 };
    if (!FACULTY_IDS.has(faculty)) return { ok: false, error: `Bilinmeyen fakülte: ${faculty}`, rowIndex: i + 1 };
    if (!['1', '2', '3', '4'].includes(level)) return { ok: false, error: 'Seviye 1, 2, 3 veya 4 olmalı', rowIndex: i + 1 };
    if (!department) return { ok: false, error: 'Bölüm gerekli', rowIndex: i + 1 };
    if (!departmentExists(faculty, department)) return { ok: false, error: `Bölüm "${department}" bu fakültede yok`, rowIndex: i + 1 };

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

    if (!name) return { ok: false, error: 'Derslik Adı gerekli', rowIndex: i + 1 };
    if (!faculty) return { ok: false, error: 'Fakülte gerekli', rowIndex: i + 1 };
    if (!FACULTY_IDS.has(faculty)) return { ok: false, error: `Bilinmeyen fakülte: ${faculty}`, rowIndex: i + 1 };
    if (!department) return { ok: false, error: 'Bölüm gerekli', rowIndex: i + 1 };
    if (!departmentExists(faculty, department)) return { ok: false, error: `Bölüm "${department}" bu fakültede yok`, rowIndex: i + 1 };

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
