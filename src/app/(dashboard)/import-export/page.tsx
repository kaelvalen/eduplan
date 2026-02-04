'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  BookOpen,
  Building2,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { teachersApi, coursesApi, classroomsApi, schedulesApi } from '@/lib/api';
import {
  exportToExcel,
  mapTeachersForExport,
  mapCoursesForExport,
  mapClassroomsForExport,
  mapSchedulesForExport,
  downloadTeacherTemplate,
  downloadCourseTemplate,
  downloadClassroomTemplate,
  readExcelFile,
  validateAndMapTeachers,
  validateAndMapCourses,
  validateAndMapClassrooms,
  type RowResult,
} from '@/lib/excel-io';
import { styles } from '@/lib/design-tokens';
import { getEntityColors, type EntityKey } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import type { Teacher, Course, Classroom } from '@/types';

const EXPORT_OPTIONS = [
  { id: 'teachers', label: 'Öğretmenler', icon: Users, entity: 'teachers' as EntityKey, description: 'Tüm öğretmenleri Excel\'e aktar' },
  { id: 'courses', label: 'Dersler', icon: BookOpen, entity: 'courses' as EntityKey, description: 'Tüm dersleri Excel\'e aktar' },
  { id: 'classrooms', label: 'Derslikler', icon: Building2, entity: 'classrooms' as EntityKey, description: 'Tüm derslikleri Excel\'e aktar' },
  { id: 'schedules', label: 'Ders Programı', icon: Calendar, entity: 'schedules' as EntityKey, description: 'Mevcut programı Excel\'e aktar' },
];

const IMPORT_OPTIONS = [
  { id: 'teachers', label: 'Öğretmenler', icon: Users, entity: 'teachers' as EntityKey, description: 'Excel\'den öğretmen ekle' },
  { id: 'courses', label: 'Dersler', icon: BookOpen, entity: 'courses' as EntityKey, description: 'Excel\'den ders ekle' },
  { id: 'classrooms', label: 'Derslikler', icon: Building2, entity: 'classrooms' as EntityKey, description: 'Excel\'den derslik ekle' },
];

export default function ImportExportPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState<string | null>(null);
  const [importStep, setImportStep] = useState<'choose' | 'file' | 'preview'>('choose');
  const [importType, setImportType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [validationResults, setValidationResults] = useState<RowResult[]>([]);
  const [teacherIds, setTeacherIds] = useState<Set<number>>(new Set());
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [classroomsList, setClassroomsList] = useState<Classroom[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [classroomsLoading, setClassroomsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [overwriteChoices, setOverwriteChoices] = useState<Record<string, 'overwrite' | 'skip'>>({});

  useEffect(() => {
    if (!isAdmin) router.push('/');
  }, [isAdmin, router]);

  useEffect(() => {
    if (importType === 'teachers' || importType === 'courses') {
      setTeachersLoading(true);
      teachersApi
        .getAll()
        .then((teachers) => {
          setTeachersList(teachers);
          setTeacherIds(new Set(teachers.map((t) => t.id)));
        })
        .finally(() => setTeachersLoading(false));
    } else {
      setTeachersList([]);
      setTeacherIds(new Set());
      setTeachersLoading(false);
    }
  }, [importType]);

  useEffect(() => {
    if (importType === 'courses') {
      setCoursesLoading(true);
      coursesApi
        .getAll()
        .then(setCoursesList)
        .finally(() => setCoursesLoading(false));
    } else {
      setCoursesList([]);
      setCoursesLoading(false);
    }
  }, [importType]);

  useEffect(() => {
    if (importType === 'classrooms') {
      setClassroomsLoading(true);
      classroomsApi
        .getAll()
        .then(setClassroomsList)
        .finally(() => setClassroomsLoading(false));
    } else {
      setClassroomsList([]);
      setClassroomsLoading(false);
    }
  }, [importType]);

  const existingTeachersMap = useMemo(() => {
    const m = new Map<string, { id: number }>();
    for (const t of teachersList) m.set(t.email.toLowerCase(), { id: t.id });
    return m;
  }, [teachersList]);

  const existingCoursesMap = useMemo(() => {
    const m = new Map<string, { id: number }>();
    for (const c of coursesList) m.set(c.code, { id: c.id });
    return m;
  }, [coursesList]);

  const existingClassroomsMap = useMemo(() => {
    const m = new Map<string, { id: number }>();
    for (const c of classroomsList) m.set(`${c.name}|${c.department}`, { id: c.id });
    return m;
  }, [classroomsList]);

  const toAdd = useMemo(
    () => validationResults.filter((r): r is RowResult & { ok: true; data: unknown } => r.ok && !!r.data),
    [validationResults]
  );

  type DuplicateRow = { key: string; rowIndex: number; data: unknown; existingId: number; col1: string; col2: string };

  const duplicateRows = useMemo((): DuplicateRow[] => {
    if (toAdd.length === 0) return [];
    if (importType === 'teachers') {
      return toAdd
        .map((r) => {
          const d = r.data as { email?: string; name?: string };
          const email = (d?.email ?? '').trim().toLowerCase();
          const existing = email ? existingTeachersMap.get(email) : undefined;
          if (!existing) return null;
          return { key: email, rowIndex: r.rowIndex, data: d, existingId: existing.id, col1: d?.name ?? '', col2: email };
        })
        .filter((x): x is DuplicateRow => x != null);
    }
    if (importType === 'courses') {
      return toAdd
        .map((r) => {
          const d = r.data as { code?: string; name?: string };
          const code = (d?.code ?? '').trim().toUpperCase();
          const existing = code ? existingCoursesMap.get(code) : undefined;
          if (!existing) return null;
          return { key: code, rowIndex: r.rowIndex, data: d, existingId: existing.id, col1: code, col2: d?.name ?? '' };
        })
        .filter((x): x is DuplicateRow => x != null);
    }
    if (importType === 'classrooms') {
      return toAdd
        .map((r) => {
          const d = r.data as { name?: string; department?: string };
          const name = (d?.name ?? '').trim();
          const department = (d?.department ?? '').trim();
          const key = `${name}|${department}`;
          const existing = key ? existingClassroomsMap.get(key) : undefined;
          if (!existing) return null;
          return { key, rowIndex: r.rowIndex, data: d, existingId: existing.id, col1: name, col2: department };
        })
        .filter((x): x is DuplicateRow => x != null);
    }
    return [];
  }, [importType, toAdd, existingTeachersMap, existingCoursesMap, existingClassroomsMap]);

  useEffect(() => {
    if (duplicateRows.length === 0) return;
    setOverwriteChoices((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const { key } of duplicateRows) {
        if (!(key in next)) {
          next[key] = 'skip';
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [duplicateRows]);

  if (!isAdmin) return null;

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      switch (type) {
        case 'teachers': {
          const data = await teachersApi.getAll();
          exportToExcel(mapTeachersForExport(data), 'Öğretmenler', 'ogretmenler');
          break;
        }
        case 'courses': {
          const data = await coursesApi.getAll();
          exportToExcel(mapCoursesForExport(data), 'Dersler', 'dersler');
          break;
        }
        case 'classrooms': {
          const data = await classroomsApi.getAll();
          exportToExcel(mapClassroomsForExport(data), 'Derslikler', 'derslikler');
          break;
        }
        case 'schedules': {
          const data = await schedulesApi.getAll();
          exportToExcel(mapSchedulesForExport(data), 'Ders Programı', 'ders_programi');
          break;
        }
      }
      toast.success('Dışa aktarma tamamlandı. Dosya indirildi.');
    } catch (e) {
      console.error(e);
      toast.error('Dışa aktarma sırasında hata oluştu.');
    } finally {
      setExporting(null);
    }
  };

  const handleSelectImportType = (type: string) => {
    setImportType(type);
    setImportStep('file');
    setSelectedFile(null);
    setRawRows([]);
    setValidationResults([]);
    setOverwriteChoices({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTemplateDownload = () => {
    if (importType === 'teachers') downloadTeacherTemplate();
    else if (importType === 'courses') downloadCourseTemplate();
    else if (importType === 'classrooms') downloadClassroomTemplate();
    toast.success('Şablon indirildi. Doldurup yeniden yükleyin.');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    try {
      const rows = await readExcelFile(file);
      const nonEmpty = rows.filter((r) => Object.values(r).some((v) => v != null && String(v).trim() !== ''));
      setRawRows(nonEmpty);
      if (nonEmpty.length === 0) {
        toast.error('Dosyada veri bulunamadı.');
        setValidationResults([]);
        return;
      }
      let results: RowResult[] = [];
      if (importType === 'teachers') {
        results = validateAndMapTeachers(nonEmpty);
      } else if (importType === 'courses') {
        const teacherEmailToId = new Map<string, number>();
        teachersList.forEach((t) => teacherEmailToId.set(t.email.trim().toLowerCase(), t.id));
        results = validateAndMapCourses(nonEmpty, teacherIds, teacherEmailToId);
      } else if (importType === 'classrooms') {
        results = validateAndMapClassrooms(nonEmpty);
      }
      setValidationResults(results);
      setImportStep('preview');
      const ok = results.filter((r) => r.ok).length;
      const err = results.filter((r) => !r.ok).length;
      if (err > 0) toast.warning(`${ok} satır uygun, ${err} satır hatalı. Önizlemede kontrol edin.`);
      else toast.success(`${ok} satır hazır. İçe aktarabilirsiniz.`);
    } catch (err) {
      toast.error('Dosya okunamadı. Geçerli bir .xlsx dosyası seçin.');
      setRawRows([]);
      setValidationResults([]);
    }
  };

  const handleImport = async () => {
    if (toAdd.length === 0) {
      toast.error('İçe aktarılacak geçerli satır yok.');
      return;
    }
    setIsImporting(true);
    setImportProgress(0);
    let success = 0;
    let failed = 0;
    let skipped = 0;
    const total = toAdd.length;
    try {
      for (let i = 0; i < toAdd.length; i++) {
        try {
          const d = toAdd[i].data as any;
          if (importType === 'teachers') {
            const emailLower = (d.email ?? '').trim().toLowerCase();
            const existing = existingTeachersMap.get(emailLower);
            if (existing) {
              const choice = overwriteChoices[emailLower] ?? 'skip';
              if (choice === 'skip') {
                skipped++;
                setImportProgress(Math.round(((i + 1) / total) * 100));
                continue;
              }
              await teachersApi.update(existing.id, d);
            } else {
              await teachersApi.create(d);
            }
          } else if (importType === 'courses') {
            const code = (d.code ?? '').trim().toUpperCase();
            const existing = existingCoursesMap.get(code);
            if (existing) {
              const choice = overwriteChoices[code] ?? 'skip';
              if (choice === 'skip') {
                skipped++;
                setImportProgress(Math.round(((i + 1) / total) * 100));
                continue;
              }
              await coursesApi.update(existing.id, d);
            } else {
              await coursesApi.create(d);
            }
          } else if (importType === 'classrooms') {
            const name = (d.name ?? '').trim();
            const department = (d.department ?? '').trim();
            const key = `${name}|${department}`;
            const existing = existingClassroomsMap.get(key);
            if (existing) {
              const choice = overwriteChoices[key] ?? 'skip';
              if (choice === 'skip') {
                skipped++;
                setImportProgress(Math.round(((i + 1) / total) * 100));
                continue;
              }
              await classroomsApi.update(existing.id, d);
            } else {
              await classroomsApi.create(d);
            }
          }
          success++;
        } catch {
          failed++;
        }
        setImportProgress(Math.round(((i + 1) / total) * 100));
      }
      if (failed > 0) {
        toast.warning(`${success} eklendi, ${skipped} atlandı, ${failed} hata.`);
      } else if (skipped > 0) {
        toast.success(`${success} kayıt eklendi / güncellendi, ${skipped} satır atlandı (çakışma).`);
      } else {
        toast.success(`${success} kayıt başarıyla eklendi.`);
      }
      setImportStep('choose');
      setImportType(null);
      setSelectedFile(null);
      setRawRows([]);
      setValidationResults([]);
      setOverwriteChoices({});
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      toast.error('İçe aktarma sırasında hata oluştu.');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handleCancelPreview = () => {
    setImportStep('file');
    setSelectedFile(null);
    setRawRows([]);
    setValidationResults([]);
    setOverwriteChoices({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const okCount = validationResults.filter((r) => r.ok).length;
  const errCount = validationResults.filter((r) => !r.ok).length;

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Excel İçe / Dışa Aktar"
        description="Verileri Excel ile aktarın. Önce şablonu indirip doldurun, sonra yükleyin."
        icon={FileSpreadsheet}
        entity="import"
      />

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Dışa Aktar
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            İçe Aktar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Dışa aktarma</AlertTitle>
            <AlertDescription>
              Veriler .xlsx formatında indirilir. Sütunlar otomatik boyutlandırılır. Öğretmen, ders veya derslik listesini düzenleyip içe aktarabilirsiniz.
            </AlertDescription>
          </Alert>
          <div className="grid gap-4 md:grid-cols-2">
            {EXPORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <Card key={opt.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={cn('h-5 w-5', getEntityColors(opt.entity).icon)} />
                      {opt.label}
                    </CardTitle>
                    <CardDescription>{opt.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={() => handleExport(opt.id)}
                      disabled={exporting === opt.id}
                    >
                      {exporting === opt.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Aktarılıyor...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Excel&apos;e Aktar
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>İçe aktarma</AlertTitle>
            <AlertDescription>
              Yeni kayıt oluşturur; mevcut verileri silmez. Önce şablonu indirip doldurun, sonra dosyayı seçin ve önizlemede kontrol edin.
            </AlertDescription>
          </Alert>

          {importStep === 'choose' && (
            <div className="grid gap-4 md:grid-cols-3">
              {IMPORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <Card
                    key={opt.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSelectImportType(opt.id)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className={cn('h-5 w-5', getEntityColors(opt.entity).icon)} />
                        {opt.label}
                      </CardTitle>
                      <CardDescription>{opt.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Şablon + dosya yükle</span>
                      <ChevronRight className="h-4 w-4" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {importStep === 'file' && importType && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {IMPORT_OPTIONS.find((o) => o.id === importType)?.label} – Dosya seçin
                </CardTitle>
                <CardDescription>
                  Önce şablonu indirip doldurun. Ardından .xlsx dosyanızı seçin.
                  {importType === 'teachers' && teachersLoading && (
                    <span className="block mt-2 text-amber-600 dark:text-amber-400">Öğretmen listesi yükleniyor…</span>
                  )}
                  {importType === 'courses' && (teachersLoading || coursesLoading) && (
                    <span className="block mt-2 text-amber-600 dark:text-amber-400">
                      Öğretmen ve ders listesi yükleniyor…
                    </span>
                  )}
                  {importType === 'classrooms' && classroomsLoading && (
                    <span className="block mt-2 text-amber-600 dark:text-amber-400">Derslik listesi yükleniyor…</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleTemplateDownload}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Şablon İndir
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    (importType === 'teachers' && teachersLoading) ||
                    (importType === 'courses' && (teachersLoading || coursesLoading)) ||
                    (importType === 'classrooms' && classroomsLoading)
                  }
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Dosya Seç
                </Button>
                <Button variant="ghost" onClick={() => { setImportStep('choose'); setImportType(null); }}>
                  Geri
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={importStep === 'preview'} onOpenChange={(open) => !open && handleCancelPreview()}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Önizleme – {selectedFile?.name}</DialogTitle>
            <DialogDescription>
              {okCount} satır işlenecek
              {duplicateRows.length > 0 &&
                ` · ${duplicateRows.length} satır çakışıyor (aşağıdan üzerine yaz/atla seçin)`}
              {errCount > 0 && ` · ${errCount} satır hatalı (atlanacak)`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 sticky top-0">
                <tr>
                  <th className="p-2 text-left w-10">#</th>
                  <th className="p-2 text-left w-12">Durum</th>
                  {rawRows[0] && Object.keys(rawRows[0]).map((k) => (
                    <th key={k} className="p-2 text-left font-medium truncate max-w-[120px]">{k}</th>
                  ))}
                  {errCount > 0 && <th className="p-2 text-left text-destructive font-medium">Hata</th>}
                </tr>
              </thead>
              <tbody>
                {validationResults.map((res, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      'border-t',
                      res.ok ? 'bg-green-50/50 dark:bg-green-950/10' : 'bg-red-50/50 dark:bg-red-950/10'
                    )}
                  >
                    <td className="p-2">{res.rowIndex}</td>
                    <td className="p-2">
                      {res.ok ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </td>
                    {rawRows[idx] && Object.values(rawRows[idx]).map((v, j) => (
                      <td key={j} className="p-2 truncate max-w-[120px]" title={String(v)}>
                        {String(v ?? '')}
                      </td>
                    ))}
                    {errCount > 0 && (
                      <td className="p-2 text-destructive text-xs">{!res.ok ? res.error : ''}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {duplicateRows.length > 0 && !isImporting && (
            <div className="space-y-2 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {importType === 'teachers' && 'E-posta çakışması'}
                  {importType === 'courses' && 'Ders kodu çakışması'}
                  {importType === 'classrooms' && 'Derslik (ad + bölüm) çakışması'}
                  {' '}({duplicateRows.length} satır) – üzerine yazılsın mı?
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next: Record<string, 'overwrite' | 'skip'> = {};
                      duplicateRows.forEach((r) => { next[r.key] = 'overwrite'; });
                      setOverwriteChoices((prev) => ({ ...prev, ...next }));
                    }}
                  >
                    Hepsini üzerine yaz
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next: Record<string, 'overwrite' | 'skip'> = {};
                      duplicateRows.forEach((r) => { next[r.key] = 'skip'; });
                      setOverwriteChoices((prev) => ({ ...prev, ...next }));
                    }}
                  >
                    Hepsini atla
                  </Button>
                </div>
              </div>
              <div className="max-h-40 overflow-auto rounded border border-amber-200/60 dark:border-amber-800/40">
                <table className="w-full text-sm">
                  <thead className="bg-amber-100/60 dark:bg-amber-900/20 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">
                        {importType === 'teachers' && 'Ad Soyad'}
                        {importType === 'courses' && 'Ders Kodu'}
                        {importType === 'classrooms' && 'Derslik Adı'}
                      </th>
                      <th className="p-2 text-left">
                        {importType === 'teachers' && 'E-posta'}
                        {importType === 'courses' && 'Ders Adı'}
                        {importType === 'classrooms' && 'Bölüm'}
                      </th>
                      <th className="p-2 text-left w-36">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicateRows.map((row) => (
                      <tr key={row.key} className="border-t border-amber-200/40 dark:border-amber-800/30">
                        <td className="p-2">{row.rowIndex}</td>
                        <td className="p-2 truncate max-w-[140px]" title={row.col1}>{row.col1}</td>
                        <td className="p-2 truncate max-w-[180px]" title={row.col2}>{row.col2}</td>
                        <td className="p-2">
                          <Select
                            value={overwriteChoices[row.key] ?? 'skip'}
                            onValueChange={(v: 'overwrite' | 'skip') =>
                              setOverwriteChoices((prev) => ({ ...prev, [row.key]: v }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="overwrite">Üzerine yaz</SelectItem>
                              <SelectItem value="skip">Atla</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {isImporting && (
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-sm text-muted-foreground text-center">İçe aktarılıyor…</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelPreview} disabled={isImporting}>
              İptal
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || okCount === 0}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aktarılıyor...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {okCount} satırı içe aktar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
