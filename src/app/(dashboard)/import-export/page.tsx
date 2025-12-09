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
  CheckCircle,
  AlertCircle,
  FileUp,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/auth-context';
import { teachersApi, coursesApi, classroomsApi, schedulesApi } from '@/lib/api';
import { styles } from '@/lib/design-tokens';
import { getEntityColors, type EntityKey } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const exportOptions = [
  { 
    id: 'teachers', 
    label: 'Öğretmenler', 
    icon: Users, 
    entity: 'teachers' as EntityKey,
    description: 'Tüm öğretmen verilerini dışa aktar'
  },
  { 
    id: 'courses', 
    label: 'Dersler', 
    icon: BookOpen, 
    entity: 'courses' as EntityKey,
    description: 'Tüm ders verilerini dışa aktar'
  },
  { 
    id: 'classrooms', 
    label: 'Derslikler', 
    icon: Building2, 
    entity: 'classrooms' as EntityKey,
    description: 'Tüm derslik verilerini dışa aktar'
  },
  { 
    id: 'schedules', 
    label: 'Ders Programı', 
    icon: Calendar, 
    entity: 'schedules' as EntityKey,
    description: 'Mevcut ders programını dışa aktar'
  },
];

export default function ImportExportPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importType, setImportType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
    }
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  const handleExport = async (type: string) => {
    setIsExporting(type);
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'teachers':
          data = await teachersApi.getAll();
          filename = 'ogretmenler';
          data = data.map(t => ({
            'ID': t.id,
            'Ad Soyad': t.name,
            'E-posta': t.email,
            'Fakülte': t.faculty,
            'Bölüm': t.department,
            'Aktif': t.is_active ? 'Evet' : 'Hayır',
          }));
          break;
        case 'courses':
          data = await coursesApi.getAll();
          filename = 'dersler';
          data = data.map(c => ({
            'ID': c.id,
            'Ders Kodu': c.code,
            'Ders Adı': c.name,
            'Fakülte': c.faculty,
            'Öğretmen ID': c.teacher_id,
            'Öğretmen': c.teacher?.name || '',
            'Seviye': c.level,
            'Kategori': c.category,
            'Dönem': c.semester,
            'AKTS': c.ects,
            'Haftalık Saat': c.total_hours || c.sessions?.reduce((sum: number, s: { hours: number }) => sum + s.hours, 0) || 0,
            'Aktif': c.is_active ? 'Evet' : 'Hayır',
          }));
          break;
        case 'classrooms':
          data = await classroomsApi.getAll();
          filename = 'derslikler';
          data = data.map(c => ({
            'ID': c.id,
            'Derslik Adı': c.name,
            'Kapasite': c.capacity,
            'Tür': c.type === 'teorik' ? 'Teorik' : 'Laboratuvar',
            'Fakülte': c.faculty,
            'Bölüm': c.department,
          }));
          break;
        case 'schedules':
          data = await schedulesApi.getAll();
          filename = 'ders_programi';
          data = data.map(s => ({
            'ID': s.id,
            'Gün': s.day,
            'Saat': s.time_range,
            'Ders Kodu': s.course?.code || '',
            'Ders Adı': s.course?.name || '',
            'Derslik': s.classroom?.name || '',
            'Öğretmen': s.course?.teacher?.name || '',
          }));
          break;
      }

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Veri');

      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2
      }));
      ws['!cols'] = colWidths;

      // Download file
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Veriler başarıyla dışa aktarıldı');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Dışa aktarma sırasında bir hata oluştu');
    } finally {
      setIsExporting(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportType(type);

    // Read and preview file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setPreviewData(jsonData.slice(0, 5)); // Preview first 5 rows
        setShowPreview(true);
      } catch (error) {
        toast.error('Dosya okunamadı. Lütfen geçerli bir Excel dosyası seçin.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!selectedFile || !importType) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Process and import data based on type
          let successCount = 0;
          let errorCount = 0;

          for (const row of jsonData) {
            try {
              switch (importType) {
                case 'teachers':
                  await teachersApi.create({
                    name: (row as any)['Ad Soyad'] || '',
                    email: (row as any)['E-posta'] || '',
                    faculty: (row as any)['Fakülte'] || '',
                    department: (row as any)['Bölüm'] || '',
                    working_hours: '{}',
                  });
                  break;
                case 'courses':
                  const teacherId = parseInt((row as any)['Öğretmen ID']);
                  const weeklyHours = parseInt((row as any)['Haftalık Saat']) || 3;
                  await coursesApi.create({
                    code: (row as any)['Ders Kodu'] || '',
                    name: (row as any)['Ders Adı'] || '',
                    faculty: (row as any)['Fakülte'] || '',
                    teacher_id: isNaN(teacherId) ? 1 : teacherId,
                    level: (row as any)['Seviye'] || 'lisans',
                    category: ((row as any)['Kategori'] === 'seçmeli' || (row as any)['Kategori'] === 'secmeli') ? 'secmeli' : 'zorunlu',
                    semester: (row as any)['Dönem'] || 'güz',
                    ects: parseInt((row as any)['AKTS']) || 5,
                    is_active: (row as any)['Aktif'] !== 'Hayır',
                    sessions: [{
                      type: 'teorik' as const,
                      hours: weeklyHours,
                    }],
                    departments: [],
                  });
                  break;
                case 'classrooms':
                  await classroomsApi.create({
                    name: (row as any)['Derslik Adı'] || '',
                    capacity: parseInt((row as any)['Kapasite']) || 30,
                    type: (row as any)['Tür'] === 'Laboratuvar' ? 'lab' : 'teorik',
                    faculty: (row as any)['Fakülte'] || '',
                    department: (row as any)['Bölüm'] || '',
                  });
                  break;
              }
              successCount++;
            } catch (err) {
              errorCount++;
            }
          }

          toast.success(`${successCount} kayıt başarıyla içe aktarıldı${errorCount > 0 ? `, ${errorCount} hata` : ''}`);
          setShowPreview(false);
          setSelectedFile(null);
          setPreviewData(null);
          setImportType(null);
        } catch (error) {
          toast.error('İçe aktarma sırasında bir hata oluştu');
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = (type: string) => {
    let headers: string[] = [];
    let filename = '';

    switch (type) {
      case 'teachers':
        headers = ['Ad Soyad', 'E-posta', 'Fakülte', 'Bölüm'];
        filename = 'ogretmen_sablonu';
        break;
      case 'courses':
        headers = ['Ders Kodu', 'Ders Adı', 'Fakülte', 'Öğretmen ID', 'Seviye', 'Kategori', 'Dönem', 'AKTS', 'Haftalık Saat', 'Aktif'];
        filename = 'ders_sablonu';
        break;
      case 'classrooms':
        headers = ['Derslik Adı', 'Kapasite', 'Tür', 'Fakülte', 'Bölüm'];
        filename = 'derslik_sablonu';
        break;
    }

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Şablon');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    toast.success('Şablon indirildi');
  };

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="İçe/Dışa Aktar"
        description="Excel dosyaları ile veri aktarımı yapın"
        icon={FileSpreadsheet}
        entity="import"
      />

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList>
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
            <FileSpreadsheet className="h-4 w-4" />
            <AlertTitle>Excel Formatı</AlertTitle>
            <AlertDescription>
              Veriler .xlsx formatında dışa aktarılır. Tüm sütunlar otomatik olarak boyutlandırılır.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card key={option.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={cn('h-5 w-5', getEntityColors(option.entity).icon)} />
                      {option.label}
                    </CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={() => handleExport(option.id)}
                      disabled={isExporting === option.id}
                    >
                      {isExporting === option.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Dışa Aktarılıyor...
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
            <AlertTitle>Dikkat</AlertTitle>
            <AlertDescription>
              İçe aktarma işlemi mevcut verileri etkilemez, yeni kayıtlar oluşturur. 
              Önce şablon dosyasını indirip doldurun.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-3">
            {['teachers', 'courses', 'classrooms'].map((type) => {
              const option = exportOptions.find(o => o.id === type)!;
              const Icon = option.icon;
              return (
                <Card key={type} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={cn('h-5 w-5', getEntityColors(option.entity).icon)} />
                      {option.label}
                    </CardTitle>
                    <CardDescription>Excel dosyasından içe aktar</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => downloadTemplate(type)}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Şablon İndir
                    </Button>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleFileSelect(e, type)}
                      />
                      <Button className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Dosya Seç
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>İçe Aktarma Önizlemesi</DialogTitle>
            <DialogDescription>
              {selectedFile?.name} - İlk 5 satır gösteriliyor
            </DialogDescription>
          </DialogHeader>
          
          {previewData && previewData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {Object.keys(previewData[0]).map((key) => (
                      <th key={key} className="p-2 text-left font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i} className="border-b">
                      {Object.values(row).map((value, j) => (
                        <td key={j} className="p-2">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPreview(false);
              setSelectedFile(null);
              setPreviewData(null);
            }}>
              İptal
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İçe Aktarılıyor...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  İçe Aktar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
