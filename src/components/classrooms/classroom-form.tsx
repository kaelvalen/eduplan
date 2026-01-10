'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { classroomsApi } from '@/lib/api';
import { FACULTIES, getDepartmentsByFaculty } from '@/constants/faculties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClassroomCreate } from '@/types';

interface ClassroomFormProps {
  classroomId?: number;
}

export function ClassroomForm({ classroomId }: ClassroomFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!classroomId);

  const [formData, setFormData] = useState<ClassroomCreate>({
    name: '',
    capacity: 30,
    type: 'teorik' as 'teorik' | 'lab' | 'hibrit',
    faculty: '',
    department: '',
  });

  const departments = formData.faculty ? getDepartmentsByFaculty(formData.faculty) : [];

  useEffect(() => {
    if (classroomId) {
      const fetchClassroom = async () => {
        try {
          const classroom = await classroomsApi.getById(classroomId);
          setFormData({
            name: classroom.name,
            capacity: classroom.capacity,
            type: classroom.type,
            faculty: classroom.faculty,
            department: classroom.department,
          });
        } catch (error) {
          toast.error('Derslik bilgileri yüklenirken bir hata oluştu');
          router.push('/classrooms');
        } finally {
          setIsFetching(false);
        }
      };
      fetchClassroom();
    }
  }, [classroomId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (classroomId) {
        await classroomsApi.update(classroomId, formData);
        toast.success('Derslik başarıyla güncellendi');
      } else {
        await classroomsApi.create(formData);
        toast.success('Derslik başarıyla eklendi');
      }
      router.push('/classrooms');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bir hata oluştu';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
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
          <CardTitle>Derslik Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Derslik Adı/Numarası</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="A101"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Kapasite</Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tür</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'teorik' | 'lab' | 'hibrit') => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teorik">Teorik</SelectItem>
                <SelectItem value="lab">Laboratuvar</SelectItem>
                <SelectItem value="hibrit">Hibrit</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="space-y-2 md:col-span-2">
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
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {classroomId ? 'Güncelle' : 'Kaydet'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/classrooms')}>
          İptal
        </Button>
      </div>
    </form>
  );
}
