'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { teachersApi } from '@/lib/api';
import { FACULTIES, getDepartmentsByFaculty } from '@/constants/faculties';
import { parseWorkingHours, stringifyWorkingHours, getEmptyHours, formatTimeRange } from '@/lib/time-utils';
import { DAYS_TR, TIME_BLOCKS } from '@/constants/time';
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
import type { Teacher, TeacherCreate } from '@/types';

// Akademik ünvanlar
const ACADEMIC_TITLES = [
  { value: 'Prof. Dr.', label: 'Prof. Dr.' },
  { value: 'Doç. Dr.', label: 'Doç. Dr.' },
  { value: 'Dr. Öğr. Üyesi', label: 'Dr. Öğr. Üyesi' },
  { value: 'Öğr. Gör.', label: 'Öğr. Gör.' },
  { value: 'Öğr. Gör. Dr.', label: 'Öğr. Gör. Dr.' },
  { value: 'Arş. Gör.', label: 'Arş. Gör.' },
  { value: 'Arş. Gör. Dr.', label: 'Arş. Gör. Dr.' },
] as const;

interface TeacherFormProps {
  teacherId?: number;
}

export function TeacherForm({ teacherId }: TeacherFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!teacherId);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: 'Öğr. Gör.',
    faculty: '',
    department: '',
    is_active: true,
  });

  const [workingHours, setWorkingHours] = useState<Record<string, string[]>>(() => getEmptyHours());

  const departments = formData.faculty ? getDepartmentsByFaculty(formData.faculty) : [];

  useEffect(() => {
    if (teacherId) {
      const fetchTeacher = async () => {
        try {
          const teacher = await teachersApi.getById(teacherId);
          setFormData({
            name: teacher.name,
            email: teacher.email,
            title: teacher.title || 'Öğr. Gör.',
            faculty: teacher.faculty,
            department: teacher.department,
            is_active: teacher.is_active !== false,
          });
          setWorkingHours(parseWorkingHours(teacher.working_hours ?? '{}'));
        } catch (error) {
          toast.error('Öğretmen bilgileri yüklenirken bir hata oluştu');
          router.push('/teachers');
        } finally {
          setIsFetching(false);
        }
      };
      fetchTeacher();
    }
  }, [teacherId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data: TeacherCreate = {
        name: formData.name,
        email: formData.email,
        title: formData.title,
        faculty: formData.faculty,
        department: formData.department,
        working_hours: stringifyWorkingHours(workingHours),
        is_active: formData.is_active,
      };

      if (teacherId) {
        await teachersApi.update(teacherId, data);
        toast.success('Öğretmen başarıyla güncellendi');
      } else {
        await teachersApi.create(data);
        toast.success('Öğretmen başarıyla eklendi');
      }
      router.push('/teachers');
      router.refresh(); // Force refresh to update the page
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bir hata oluştu';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const rangeStr = (b: { start: string; end: string }) => formatTimeRange(b.start, b.end);
  const allRanges = TIME_BLOCKS.map(rangeStr);

  const toggleBlock = (day: string, range: string) => {
    setWorkingHours((prev) => {
      const arr = prev[day] || [];
      if (arr.includes(range)) {
        return { ...prev, [day]: arr.filter((r) => r !== range) };
      }
      return { ...prev, [day]: [...arr, range].sort() };
    });
  };

  const selectAllDay = (day: string) => {
    setWorkingHours((prev) => ({ ...prev, [day]: [...allRanges] }));
  };

  const clearDay = (day: string) => {
    setWorkingHours((prev) => ({ ...prev, [day]: [] }));
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
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Öğretmen adı"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Akademik Ünvan</Label>
            <Select
              value={formData.title}
              onValueChange={(value) => setFormData({ ...formData, title: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ünvan seçin" />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIC_TITLES.map((title) => (
                  <SelectItem key={title.value} value={title.value}>
                    {title.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ornek@universite.edu.tr"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="faculty">Fakülte</Label>
            <Select
              value={formData.faculty}
              onValueChange={(value) =>
                setFormData({ ...formData, faculty: value, department: '' })
              }
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
            <Label htmlFor="department">Bölüm</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
              disabled={!formData.faculty}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bölüm seçin" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        <CardHeader>
          <CardTitle>Çalışma Saatleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Aralık</th>
                  {DAYS_TR.map((day) => (
                    <th key={day} className="p-2 text-center">
                      <div>{day}</div>
                      <div className="mt-1 flex justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => selectAllDay(day)}
                        >
                          Tümü
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => clearDay(day)}
                        >
                          Temizle
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_BLOCKS.map((block) => {
                  const range = rangeStr(block);
                  return (
                    <tr key={range} className="border-t">
                      <td className="p-2 font-medium">{range}</td>
                      {DAYS_TR.map((day) => (
                        <td key={`${day}-${range}`} className="p-2 text-center">
                          <Checkbox
                            checked={workingHours[day]?.includes(range) ?? false}
                            onCheckedChange={() => toggleBlock(day, range)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {teacherId ? 'Güncelle' : 'Kaydet'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/teachers')}>
          İptal
        </Button>
      </div>
    </form>
  );
}
