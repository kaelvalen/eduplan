'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { coursesApi, teachersApi } from '@/lib/api';
import { FACULTIES, getDepartmentsByFaculty } from '@/constants/faculties';
import { BulkTableEditor, type ColumnDef } from '@/components/ui/bulk-table-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Teacher } from '@/types';

type CourseSessionRow = {
  type: 'teorik' | 'lab';
  hours: number;
};

// CourseDepartmentRow uses same structure as CourseDepartment

type CourseRow = {
  id?: number; // For edit mode - if set, row will be updated instead of created
  code: string;
  name: string;
  teacher_id: number | null;
  faculty: string;
  level: string;
  category: string;
  semester: string;
  ects: number;
  sessions: CourseSessionRow[]; // Sessions array - total_hours calculated from this
  departments: Array<{ department: string; student_count: number }>; // Multiple departments with individual student counts
  capacity_margin: number | string; // Can be number or empty string from input
  is_active: boolean;
};

const LEVELS = [
  { value: '1', label: '1. Sınıf' },
  { value: '2', label: '2. Sınıf' },
  { value: '3', label: '3. Sınıf' },
  { value: '4', label: '4. Sınıf' },
];

const CATEGORIES = [
  { value: 'zorunlu', label: 'Zorunlu' },
  { value: 'secmeli', label: 'Seçmeli' },
];

const SEMESTERS = [
  { value: 'güz', label: 'Güz' },
  { value: 'bahar', label: 'Bahar' },
  { value: 'yaz', label: 'Yaz' },
];

export default function BulkCoursesPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/courses');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const data = await teachersApi.getAll();
        setTeachers(data);
      } catch (error) {
        console.error('Failed to load teachers:', error);
      }
    };
    loadTeachers();
  }, []);

  const columns: ColumnDef<CourseRow>[] = [
    {
      key: 'code',
      header: 'Ders Kodu',
      type: 'text',
      required: true,
      placeholder: 'Örn: CSE101',
      validate: (value) => {
        if (!value) return null;
        const codeRegex = /^[A-Z]{2,4}\d{3,4}$/;
        return codeRegex.test(value) ? null : 'Geçersiz kod formatı (örn: CSE101)';
      },
    },
    {
      key: 'name',
      header: 'Ders Adı',
      type: 'text',
      required: true,
      placeholder: 'Örn: Programlamaya Giriş',
    },
    {
      key: 'teacher_id',
      header: 'Öğretim Elemanı',
      type: 'select',
      options: [
        { value: '', label: 'Öğretim Elemanı Seçilmedi' },
        ...teachers.map((t) => ({
          value: String(t.id),
          label: `${t.title} ${t.name}`,
        })),
      ],
      placeholder: 'Öğretim elemanı seçin',
    },
    {
      key: 'faculty',
      header: 'Fakülte',
      type: 'select',
      options: FACULTIES.map((f) => ({ value: f.id, label: f.name })),
      required: true,
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      key: 'departments' as any,
      header: 'Bölümler ve Kontenjanlar',
      type: 'custom' as const,
      width: '400px',
      required: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customRender: (row: CourseRow, rowIndex: number, updateCell: (key: any, value: any) => void) => {
        const departments = row.departments || [];
        const facultyId = row.faculty;
        const availableDepts = facultyId ? getDepartmentsByFaculty(facultyId) : [];

        const toggleDepartment = (deptId: string) => {
          const existing = departments.find(d => d.department === deptId);
          if (existing) {
            // Remove
            const newDepts = departments.filter(d => d.department !== deptId);
            updateCell('departments', newDepts);
          } else {
            // Add with default student count
            const newDepts = [...departments, { department: deptId, student_count: 30 }];
            updateCell('departments', newDepts);
          }
        };

        const updateDepartmentCount = (deptId: string, count: number) => {
          const newDepts = departments.map(d => 
            d.department === deptId 
              ? { ...d, student_count: count } 
              : d
          );
          updateCell('departments', newDepts);
        };

        const totalStudents = departments.reduce((sum, d) => sum + d.student_count, 0);

        if (!facultyId) {
          return (
            <div className="w-[400px] text-xs text-muted-foreground italic p-2">
              Önce fakülte seçin
            </div>
          );
        }

        return (
          <div className="space-y-2 w-[400px] border-l-2 border-primary/20 pl-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {departments.length} bölüm
                </span>
                {totalStudents > 0 && (
                  <Badge variant="secondary" className="text-xs font-semibold">
                    Toplam: {totalStudents} öğrenci
                  </Badge>
                )}
              </div>
            </div>
            {availableDepts.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-2">
                Bu fakülte için bölüm bulunamadı
              </p>
            )}
            {availableDepts.length > 0 && departments.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-2">
                Bölüm seçmek için checkbox&apos;ları işaretleyin
              </p>
            )}
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
              {availableDepts.map((dept) => {
                const selected = departments.find(d => d.department === dept.id);
                return (
                  <div 
                    key={dept.id} 
                    className={`flex items-center gap-2 p-1.5 rounded-md border transition-colors ${
                      selected ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={!!selected}
                      onCheckedChange={() => toggleDepartment(dept.id)}
                      className="h-4 w-4"
                    />
                    <span className="flex-1 text-xs font-medium truncate">
                      {dept.name}
                    </span>
                    {selected && (
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          value={selected.student_count}
                          onChange={(e) => updateDepartmentCount(dept.id, parseInt(e.target.value) || 0)}
                          className="h-7 text-xs w-[70px] text-center font-medium"
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground min-w-10">öğrenci</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {departments.length === 0 && facultyId && (
              <p className="text-xs text-destructive mt-1">
                En az bir bölüm seçmelisiniz
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'level',
      header: 'Sınıf',
      type: 'select',
      options: LEVELS,
      required: true,
    },
    {
      key: 'category',
      header: 'Kategori',
      type: 'select',
      options: CATEGORIES,
      required: true,
    },
    {
      key: 'semester',
      header: 'Dönem',
      type: 'select',
      options: SEMESTERS,
      required: true,
    },
    {
      key: 'ects',
      header: 'AKTS',
      type: 'number',
      required: true,
      placeholder: '5',
      validate: (value) => {
        if (!value || value < 0) return 'AKTS en az 0 olmalıdır';
        if (value > 30) return 'AKTS en fazla 30 olabilir';
        return null;
      },
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      key: 'sessions' as any,
      header: 'Oturumlar (Toplam saat otomatik hesaplanır)',
      type: 'custom' as const,
      width: '350px',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customRender: (row: CourseRow, rowIndex: number, updateCell: (key: any, value: any) => void) => {
        const sessions = row.sessions || [];
        const totalHours = sessions.reduce((sum, s) => sum + s.hours, 0);
        
        const addSession = () => {
          const newSessions = [...sessions, { type: 'teorik' as const, hours: 2 }];
          updateCell('sessions', newSessions);
        };

        const removeSession = (index: number) => {
          const newSessions = sessions.filter((_, i) => i !== index);
          updateCell('sessions', newSessions);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateSession = (index: number, field: 'type' | 'hours', value: any) => {
          const newSessions = [...sessions];
          newSessions[index] = { ...newSessions[index], [field]: value };
          updateCell('sessions', newSessions);
        };

        return (
          <div className="space-y-2 w-[350px] border-l-2 border-primary/20 pl-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {sessions.length} oturum
                </span>
                {totalHours > 0 && (
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {totalHours} saat
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSession}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Ekle
              </Button>
            </div>
            {sessions.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-2">Henüz oturum eklenmemiş. &quot;Ekle&quot; butonuna tıklayın.</p>
            )}
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
              {sessions.map((session, sessIndex) => (
                <div key={sessIndex} className="flex items-center gap-1.5 p-1.5 bg-muted/40 rounded-md border hover:bg-muted/60 transition-colors">
                  <Select
                    value={session.type}
                    onValueChange={(value) => updateSession(sessIndex, 'type', value as 'teorik' | 'lab')}
                  >
                    <SelectTrigger className="h-7 text-xs w-[110px] font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teorik">Teorik</SelectItem>
                      <SelectItem value="lab">Laboratuvar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={session.hours}
                    onChange={(e) => updateSession(sessIndex, 'hours', parseInt(e.target.value) || 1)}
                    className="h-7 text-xs w-[65px] text-center font-medium"
                    placeholder="Saat"
                  />
                  <span className="text-xs text-muted-foreground min-w-[35px]">saat</span>
                  {sessions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSession(sessIndex)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                      title="Oturumu sil"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                  {sessions.length === 1 && (
                    <div className="w-7" /> // Spacer when only one session
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      key: 'capacity_margin',
      header: 'Kapasite Marjı (%)',
      type: 'number',
      placeholder: '0',
      validate: (value) => {
        if (value && (value < 0 || value > 30)) {
          return 'Kapasite marjı 0-30 arasında olmalıdır';
        }
        return null;
      },
    },
    {
      key: 'is_active',
      header: 'Aktif',
      type: 'checkbox',
    },
  ];

  const defaultRow = (): CourseRow => ({
    id: undefined, // No id means new row
    code: '',
    name: '',
    teacher_id: null,
    faculty: '',
    level: '1',
    category: 'zorunlu',
    semester: 'güz',
    ects: 5,
    sessions: [{ type: 'teorik', hours: 3 }], // Default session
    departments: [], // Will be filled by user
    capacity_margin: 0,
    is_active: true,
  });

  // Update departments when faculty changes
  const updateRowData = (newRows: CourseRow[]) => {
    // Store previous rows for comparison
    const prevRows = [...rows];
    
    const updatedRows = newRows.map((row, idx) => {
      const prevRow = prevRows[idx];
      
      // If faculty changed, clear departments
      if (prevRow && prevRow.faculty !== row.faculty) {
        return { ...row, departments: [] };
      }
      
      return row;
    });
    
    setRows(updatedRows);
    
    // Check for code changes and auto-fill (async operation after state update)
    newRows.forEach(async (row, idx) => {
      const prevRow = prevRows[idx];
      
      // If code changed and code is not empty and doesn't have id yet, try to fetch existing course
      if (prevRow && prevRow.code !== row.code && row.code && !row.id) {
        try {
          const allCourses = await coursesApi.getAll();
          const existingCourse = allCourses.find(c => c.code.toLowerCase() === row.code.toLowerCase());
          
          if (existingCourse) {
            // Auto-fill the row with existing course data
            const updatedRow: CourseRow = {
              id: existingCourse.id, // Set id to mark as edit mode
              code: existingCourse.code,
              name: existingCourse.name,
              teacher_id: existingCourse.teacher_id || null,
              faculty: existingCourse.faculty,
              level: existingCourse.level,
              category: existingCourse.category,
              semester: existingCourse.semester,
              ects: existingCourse.ects,
              sessions: existingCourse.sessions?.map(s => ({
                type: s.type as 'teorik' | 'lab',
                hours: s.hours,
              })) || [{ type: 'teorik' as const, hours: 3 }],
              departments: existingCourse.departments?.map(d => ({
                department: d.department,
                student_count: d.student_count,
              })) || [],
              capacity_margin: existingCourse.capacity_margin || 0,
              is_active: existingCourse.is_active ?? true,
            };
            
            // Update the specific row using functional setState to avoid stale closure
            setRows(currentRows => {
              const newUpdatedRows = [...currentRows];
              newUpdatedRows[idx] = updatedRow;
              return newUpdatedRows;
            });
            
            toast.success(`"${existingCourse.code}" dersi bulundu ve otomatik dolduruldu. Düzenleme modunda.`);
          }
        } catch (error) {
          console.error('Error fetching course by code:', error);
          // Continue with normal row if fetch fails
        }
      }
    });
  };

  const handleSave = async (data: CourseRow[]) => {
    const errors: Array<{ row: number; error: string }> = [];
    let successCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Use sessions array directly, or default if empty
        const sessions = row.sessions && row.sessions.length > 0 
          ? row.sessions 
          : [{ type: 'teorik' as const, hours: 3 }];

        // Calculate total_hours from sessions
        const total_hours = sessions.reduce((sum, session) => sum + session.hours, 0);

        if (total_hours === 0) {
          errors.push({ row: i, error: 'En az bir oturum eklemelisiniz' });
          continue;
        }

        if (!row.departments || row.departments.length === 0) {
          errors.push({ row: i, error: 'En az bir bölüm seçmelisiniz' });
          continue;
        }

        // Handle capacity_margin: preserve 0, but use 0 as default if undefined/null/empty string
        const capacityMargin = 
          row.capacity_margin === undefined || 
          row.capacity_margin === null || 
          row.capacity_margin === ''
            ? 0 
            : typeof row.capacity_margin === 'string' 
              ? (row.capacity_margin.trim() === '' ? 0 : parseFloat(row.capacity_margin))
              : Number(row.capacity_margin);
        
        // Ensure it's a valid number (NaN check)
        const finalCapacityMargin = isNaN(capacityMargin) ? 0 : capacityMargin;

        const courseData = {
          code: row.code,
          name: row.name,
          teacher_id: row.teacher_id ? parseInt(String(row.teacher_id)) : null,
          faculty: row.faculty,
          level: row.level,
          category: row.category as 'zorunlu' | 'secmeli',
          semester: row.semester,
          ects: row.ects,
          total_hours: total_hours, // Calculated from sessions
          capacity_margin: finalCapacityMargin,
          is_active: row.is_active,
          sessions: sessions,
          departments: row.departments.map(d => ({
            department: d.department,
            student_count: d.student_count,
          })),
        };

        // If row has id, update existing course; otherwise create new
        if (row.id) {
          await coursesApi.update(row.id, courseData);
        } else {
          await coursesApi.create(courseData);
        }
        successCount++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const message = error?.response?.data?.detail || error?.message || 'Bilinmeyen hata';
        errors.push({ row: i, error: message });
      }
    }

    if (successCount > 0) {
      const updateCount = data.filter(row => row.id).length;
      const createCount = successCount - updateCount;
      if (updateCount > 0 && createCount > 0) {
        toast.success(`${createCount} ders eklendi, ${updateCount} ders güncellendi`);
      } else if (updateCount > 0) {
        toast.success(`${updateCount} ders başarıyla güncellendi`);
      } else {
        toast.success(`${createCount} ders başarıyla eklendi`);
      }
    }

    return { success: successCount, errors };
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Ders Toplu Ekleme"
        description="Birden fazla dersi tek seferde ekleyin. Satır ekleyerek doldurun ve toplu kaydedin."
        icon={BookOpen}
      />

      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" onClick={() => router.push('/courses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ders Listesi</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Aşağıdaki tabloda ders bilgilerini girebilirsiniz. * işaretli alanlar zorunludur.
            <br />
            <strong>Otomatik Doldurma:</strong> Mevcut bir ders kodunu girdiğinizde, diğer tüm alanlar otomatik olarak doldurulur ve satır düzenleme moduna geçer.
            <br />
            <strong>Oturumlar:</strong> Her satırda &quot;Ekle&quot; butonuyla yeni oturum ekleyebilirsiniz. Toplam saat otomatik olarak oturumların saatlerinin toplamından hesaplanır.
            <br />
            <strong>Bölümler:</strong> Fakülte seçtikten sonra, o fakültenin bölümlerinden istediğiniz kadar seçip her bölüm için öğrenci sayısını girebilirsiniz.
          </p>
        </CardHeader>
        <CardContent>
          <BulkTableEditor
            columns={columns}
            data={rows}
            onDataChange={updateRowData}
            onSave={handleSave}
            defaultRow={defaultRow}
            emptyMessage="Henüz ders eklenmemiş. 'Satır Ekle' butonuna tıklayarak başlayın."
          />
        </CardContent>
      </Card>
    </div>
  );
}
