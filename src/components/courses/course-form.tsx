'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { coursesApi, teachersApi, classroomsApi } from '@/lib/api';
import { FACULTIES, getDepartmentsByFaculty } from '@/constants/faculties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HardcodedScheduleForm } from './hardcoded-schedule-form';
import type { CourseCreate, CourseSession, CourseDepartment, Teacher, Classroom, HardcodedSchedule } from '@/types';

interface CourseFormProps {
  courseId?: number;
}

export function CourseForm({ courseId: initialCourseId }: CourseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentCourseId, setCurrentCourseId] = useState<number | undefined>(initialCourseId);
  const [isFetching, setIsFetching] = useState(!!initialCourseId);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [hardcodedSchedules, setHardcodedSchedules] = useState<HardcodedSchedule[]>([]);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const codeCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacher_id: 0,
    faculty: '',
    level: '1',
    category: 'zorunlu' as 'zorunlu' | 'secmeli',
    semester: 'güz',
    ects: 3,
    capacity_margin: 0, // Added capacity margin
    is_active: true,
  });

  const [sessions, setSessions] = useState<Omit<CourseSession, 'id'>[]>([
    { type: 'teorik', hours: 2 },
  ]);

  const [departments, setDepartments] = useState<Omit<CourseDepartment, 'id'>[]>([]);

  const availableDepartments = formData.faculty ? getDepartmentsByFaculty(formData.faculty) : [];

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await teachersApi.getAll();
        setTeachers(data);
      } catch {
        toast.error('Öğretim elemanları yüklenirken bir hata oluştu');
      }
    };
    const fetchClassrooms = async () => {
      try {
        const data = await classroomsApi.getAll();
        setClassrooms(data);
      } catch {
        toast.error('Derslikler yüklenirken bir hata oluştu');
      }
    };
    fetchTeachers();
    fetchClassrooms();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (codeCheckTimeoutRef.current) {
        clearTimeout(codeCheckTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentCourseId) {
      const fetchCourse = async () => {
        setIsFetching(true);
        try {
          const course = await coursesApi.getById(currentCourseId);
          // Only update if the code matches (to avoid resetting user input)
          setFormData(prev => {
            // If user is typing and code doesn't match fetched course, don't update
            if (prev.code && prev.code.toUpperCase() !== course.code.toUpperCase()) {
              return prev;
            }
            return {
              name: course.name,
              code: course.code,
              teacher_id: course.teacher_id || 0,
              faculty: course.faculty,
              level: course.level,
              category: course.category,
              semester: course.semester,
              ects: course.ects,
              capacity_margin: course.capacity_margin || 0,
              is_active: course.is_active,
            };
          });
          setSessions(course.sessions.map((s) => ({ type: s.type, hours: s.hours })));
          setDepartments(course.departments.map((d) => ({ department: d.department, student_count: d.student_count })));
          
          // Fetch hardcoded schedules for this course
          if (course.hardcoded_schedules) {
            setHardcodedSchedules(course.hardcoded_schedules);
          } else {
            try {
              const schedules = await coursesApi.getHardcodedSchedules(currentCourseId);
              setHardcodedSchedules(schedules);
            } catch {
              // Hardcoded schedules might not be available
              setHardcodedSchedules([]);
            }
          }
        } catch {
          toast.error('Ders bilgileri yüklenirken bir hata oluştu');
          router.push('/courses');
        } finally {
          setIsFetching(false);
        }
      };
      fetchCourse();
    }
  }, [currentCourseId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data: CourseCreate = {
        ...formData,
        sessions,
        departments,
      };

      if (currentCourseId) {
        await coursesApi.update(currentCourseId, data);
        toast.success('Ders başarıyla güncellendi');
      } else {
        await coursesApi.create(data);
        toast.success('Ders başarıyla eklendi');
      }
      router.push('/courses');
      router.refresh(); // Force refresh to update the page
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bir hata oluştu';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const addSession = () => {
    setSessions([...sessions, { type: 'teorik', hours: 2 }]);
  };

  const removeSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const updateSession = (index: number, field: keyof CourseSession, value: string | number) => {
    setSessions(sessions.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const toggleDepartment = (deptId: string) => {
    const exists = departments.find((d) => d.department === deptId);
    if (exists) {
      setDepartments(departments.filter((d) => d.department !== deptId));
    } else {
      setDepartments([...departments, { department: deptId, student_count: 0 }]);
    }
  };

  const updateDepartmentCount = (deptId: string, count: number) => {
    setDepartments(departments.map((d) => (d.department === deptId ? { ...d, student_count: count } : d)));
  };

  if (isFetching) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">Ders Kodu</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => {
                const newCode = e.target.value.toUpperCase();
                setFormData(prev => ({ ...prev, code: newCode }));
                
                // Clear existing timeout
                if (codeCheckTimeoutRef.current) {
                  clearTimeout(codeCheckTimeoutRef.current);
                }
                
                // Clear courseId if code is being changed manually
                if (currentCourseId && newCode.toUpperCase() !== formData.code.toUpperCase()) {
                  setCurrentCourseId(undefined);
                  router.replace('/courses/new');
                }
                
                // Debounce: Check for existing course after user stops typing (800ms)
                if (newCode && newCode.length >= 3 && !currentCourseId) {
                  codeCheckTimeoutRef.current = setTimeout(async () => {
                    setIsCheckingCode(true);
                    try {
                      const allCourses = await coursesApi.getAll();
                      const existingCourse = allCourses.find(
                        c => c.code.toUpperCase() === newCode.toUpperCase()
                      );
                      
                      if (existingCourse) {
                        setCurrentCourseId(existingCourse.id);
                        router.replace(`/courses/${existingCourse.id}/edit`);
                        toast.success(`"${existingCourse.code}" dersi bulundu ve otomatik dolduruldu. Düzenleme modunda.`);
                      }
                    } catch (error) {
                      console.error('Error checking course code:', error);
                    } finally {
                      setIsCheckingCode(false);
                    }
                  }, 800);
                }
              }}
              onBlur={async () => {
                // Check on blur as well, but only if code is valid and not already editing
                if (formData.code && formData.code.length >= 3 && !currentCourseId && !isCheckingCode) {
                  setIsCheckingCode(true);
                  try {
                    const allCourses = await coursesApi.getAll();
                    const existingCourse = allCourses.find(
                      c => c.code.toUpperCase() === formData.code.toUpperCase()
                    );
                    
                    if (existingCourse) {
                      setCurrentCourseId(existingCourse.id);
                      router.replace(`/courses/${existingCourse.id}`);
                      toast.success(`"${existingCourse.code}" dersi bulundu ve otomatik dolduruldu. Düzenleme modunda.`);
                    }
                  } catch (error) {
                    console.error('Error checking course code:', error);
                  } finally {
                    setIsCheckingCode(false);
                  }
                }
              }}
              placeholder="BIL101"
              required
              disabled={isCheckingCode}
            />
            {isCheckingCode && (
              <p className="text-xs text-muted-foreground">Kod kontrol ediliyor...</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Ders Adı</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Programlamaya Giriş"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">Öğretim Elemanı</Label>
            <Select
              value={formData.teacher_id.toString()}
              onValueChange={(value) => setFormData({ ...formData, teacher_id: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Öğretim elemanı seçin" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="faculty">Fakülte</Label>
            <Select
              value={formData.faculty}
              onValueChange={(value) => {
                setFormData({ ...formData, faculty: value });
                setDepartments([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Fakülte seçin" />
              </SelectTrigger>
              <SelectContent>
                {FACULTIES.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Sınıf</Label>
            <Select
              value={formData.level}
              onValueChange={(value) => setFormData({ ...formData, level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sınıf seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1. Sınıf</SelectItem>
                <SelectItem value="2">2. Sınıf</SelectItem>
                <SelectItem value="3">3. Sınıf</SelectItem>
                <SelectItem value="4">4. Sınıf</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select
              value={formData.category}
              onValueChange={(value: 'zorunlu' | 'secmeli') => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zorunlu">Zorunlu</SelectItem>
                <SelectItem value="secmeli">Seçmeli</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester">Dönem</Label>
            <Select
              value={formData.semester}
              onValueChange={(value) => setFormData({ ...formData, semester: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Dönem seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="güz">Güz</SelectItem>
                <SelectItem value="bahar">Bahar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ects">AKTS</Label>
            <Input
              id="ects"
              type="number"
              min={1}
              max={30}
              value={formData.ects}
              onChange={(e) => setFormData({ ...formData, ects: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity_margin">Kapasite Marjı (%)</Label>
            <Input
              id="capacity_margin"
              type="number"
              min={0}
              max={30}
              value={formData.capacity_margin}
              onChange={(e) => setFormData({ ...formData, capacity_margin: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">0-30 arası değer</p>
          </div>

          <div className="flex items-center space-x-2 md:col-span-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
            />
            <Label htmlFor="is_active">Aktif</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ders Oturumları</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addSession}>
            <Plus className="mr-2 h-4 w-4" />
            Oturum Ekle
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session, index) => (
            <div key={index} className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>Tür</Label>
                <Select
                  value={session.type}
                  onValueChange={(value) => updateSession(index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teorik">Teorik</SelectItem>
                    <SelectItem value="lab">Laboratuvar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Saat</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={session.hours}
                  onChange={(e) => updateSession(index, 'hours', parseInt(e.target.value) || 0)}
                />
              </div>
              {sessions.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeSession(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bölümler</CardTitle>
        </CardHeader>
        <CardContent>
          {!formData.faculty ? (
            <p className="text-sm text-muted-foreground">Önce fakülte seçin</p>
          ) : (
            <div className="space-y-4">
              {availableDepartments.map((dept) => {
                const selected = departments.find((d) => d.department === dept.id);
                return (
                  <div key={dept.id} className="flex items-center gap-4">
                    <Checkbox
                      checked={!!selected}
                      onCheckedChange={() => toggleDepartment(dept.id)}
                    />
                    <span className="flex-1">{dept.name}</span>
                    {selected && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Öğrenci:</Label>
                        <Input
                          type="number"
                          min={0}
                          className="w-20"
                          value={selected.student_count}
                          onChange={(e) => updateDepartmentCount(dept.id, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hardcoded Schedules - Only shown for existing courses */}
      {currentCourseId && (
        <HardcodedScheduleForm
          courseId={currentCourseId}
          schedules={hardcodedSchedules}
          classrooms={classrooms}
          onScheduleAdded={(schedule) => setHardcodedSchedules([...hardcodedSchedules, schedule])}
          onScheduleRemoved={(scheduleId) => setHardcodedSchedules(hardcodedSchedules.filter(s => s.id !== scheduleId))}
          disabled={isLoading}
        />
      )}
      {!currentCourseId && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground text-center">
              💡 Sabit program eklemek için önce dersi kaydedin
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading || isCheckingCode}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {currentCourseId ? 'Güncelle' : 'Kaydet'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/courses')}>
          İptal
        </Button>
      </div>
    </form>
  );
}
