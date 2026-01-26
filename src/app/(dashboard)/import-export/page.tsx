'use client';

import { useEffect, useState, useRef } from 'react';
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
import { Progress } from '@/components/ui/progress';

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
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => {
    if (!isAdmin) router.push('/');
  }, [isAdmin, router]);

  useEffect(() => {
    if (importType === 'courses') {
      setTeachersLoading(true);
      teachersApi
        .getAll()
        .then((teachers) => setTeacherIds(new Set(teachers.map((t) => t.id))))
        .finally(() => setTeachersLoading(false));
    } else {
      setTeacherIds(new Set());
      setTeachersLoading(false);
    }
  }, [importType]);

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
        results = validateAndMapCourses(nonEmpty, teacherIds);
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
    const toAdd = validationResults.filter((r): r is RowResult & { ok: true; data: unknown } => r.ok && !!r.data);
    if (toAdd.length === 0) {
      toast.error('İçe aktarılacak geçerli satır yok.');
      return;
    }
    setIsImporting(true);
    setImportProgress(0);
    let success = 0;
    let failed = 0;
    const total = toAdd.length;
    try {
      for (let i = 0; i < toAdd.length; i++) {
        try {
          const d = toAdd[i].data as any;
          if (importType === 'teachers') {
            await teachersApi.create(d);
          } else if (importType === 'courses') {
            await coursesApi.create(d);
          } else if (importType === 'classrooms') {
            await classroomsApi.create(d);
          }
          success++;
        } catch {
          failed++;
        }
        setImportProgress(Math.round(((i + 1) / total) * 100));
      }
      if (failed > 0) {
        toast.warning(`${success} kayıt eklendi, ${failed} kayıt eklenemedi.`);
      } else {
        toast.success(`${success} kayıt başarıyla eklendi.`);
      }
      setImportStep('choose');
      setImportType(null);
      setSelectedFile(null);
      setRawRows([]);
      setValidationResults([]);
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
                  {importType === 'courses' && teachersLoading && (
                    <span className="block mt-2 text-amber-600 dark:text-amber-400">
                      Öğretmen listesi yükleniyor…
                    </span>
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
                  disabled={importType === 'courses' && teachersLoading}
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
              {okCount} satır eklenecek {errCount > 0 && `· ${errCount} satır hatalı (atlanacak)`}
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
