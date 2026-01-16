'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { classroomsApi } from '@/lib/api';
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
import type { ClassroomCreate } from '@/types';

interface ClassroomFormProps {
  classroomId?: number;
}

export function ClassroomForm({ classroomId: initialClassroomId }: ClassroomFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentClassroomId, setCurrentClassroomId] = useState<number | undefined>(initialClassroomId);
  const [isFetching, setIsFetching] = useState(!!initialClassroomId);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const nameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<ClassroomCreate>({
    name: '',
    capacity: 30,
    type: 'teorik' as 'teorik' | 'lab' | 'hibrit',
    faculty: '',
    department: '',
    is_active: true,
  });

  const departments = formData.faculty ? getDepartmentsByFaculty(formData.faculty) : [];

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (nameCheckTimeoutRef.current) {
        clearTimeout(nameCheckTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentClassroomId) {
      const fetchClassroom = async () => {
        setIsFetching(true);
        try {
          const classroom = await classroomsApi.getById(currentClassroomId);
          // Only update if name and department match (to avoid resetting user input)
          setFormData(prev => {
            // If user is typing and values don't match fetched classroom, don't update
            if ((prev.name && prev.name.toLowerCase() !== classroom.name.toLowerCase()) ||
                (prev.department && prev.department !== classroom.department)) {
              return prev;
            }
            return {
              name: classroom.name,
              capacity: classroom.capacity,
              type: classroom.type,
              faculty: classroom.faculty,
              department: classroom.department,
              is_active: classroom.is_active !== false,
            };
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
  }, [currentClassroomId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (currentClassroomId) {
        await classroomsApi.update(currentClassroomId, formData);
        toast.success('Derslik başarıyla güncellendi');
      } else {
        await classroomsApi.create(formData);
        toast.success('Derslik başarıyla eklendi');
      }
      router.push('/classrooms');
      router.refresh(); // Force refresh to update the page
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
              onChange={(e) => {
                const newName = e.target.value;
                setFormData(prev => {
                  // Clear existing timeout
                  if (nameCheckTimeoutRef.current) {
                    clearTimeout(nameCheckTimeoutRef.current);
                  }
                  
                  // Clear classroomId if name is being changed manually
                  if (currentClassroomId && newName.toLowerCase() !== prev.name.toLowerCase()) {
                    setCurrentClassroomId(undefined);
                    router.replace('/classrooms/new');
                  }
                  
                  // Debounce: Check for existing classroom after user stops typing (800ms)
                  if (newName && prev.department && !currentClassroomId) {
                    const department = prev.department; // Capture department value
                    nameCheckTimeoutRef.current = setTimeout(async () => {
                      setIsCheckingName(true);
                      try {
                        const allClassrooms = await classroomsApi.getAll();
                        const existingClassroom = allClassrooms.find(
                          c => c.name.toLowerCase() === newName.toLowerCase() && 
                               c.department === department
                        );
                      
                      if (existingClassroom) {
                        setCurrentClassroomId(existingClassroom.id);
                        router.replace(`/classrooms/${existingClassroom.id}/edit`);
                        toast.success(`"${existingClassroom.name}" dersliği bulundu ve otomatik dolduruldu. Düzenleme modunda.`);
                      }
                    } catch (error) {
                      console.error('Error checking classroom name:', error);
                    } finally {
                      setIsCheckingName(false);
                    }
                  }, 800);
                  }
                  
                  return { ...prev, name: newName };
                });
              }}
              onBlur={async () => {
                // Check on blur as well
                if (formData.name && formData.department && !currentClassroomId && !isCheckingName) {
                  setIsCheckingName(true);
                  try {
                    const allClassrooms = await classroomsApi.getAll();
                    const existingClassroom = allClassrooms.find(
                      c => c.name.toLowerCase() === formData.name.toLowerCase() && 
                           c.department === formData.department
                    );
                    
                    if (existingClassroom) {
                      setCurrentClassroomId(existingClassroom.id);
                      router.replace(`/classrooms/${existingClassroom.id}`);
                      toast.success(`"${existingClassroom.name}" dersliği bulundu ve otomatik dolduruldu. Düzenleme modunda.`);
                    }
                  } catch (error) {
                    console.error('Error checking classroom name:', error);
                  } finally {
                    setIsCheckingName(false);
                  }
                }
              }}
              placeholder="A101"
              required
              disabled={isCheckingName}
            />
            {isCheckingName && (
              <p className="text-xs text-muted-foreground">Derslik kontrol ediliyor...</p>
            )}
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
              onValueChange={(value) => {
                setFormData(prev => {
                  // Clear existing timeout
                  if (nameCheckTimeoutRef.current) {
                    clearTimeout(nameCheckTimeoutRef.current);
                  }
                  
                  // Clear classroomId if department is being changed manually
                  if (currentClassroomId && value !== prev.department) {
                    setCurrentClassroomId(undefined);
                    router.replace('/classrooms/new');
                  }
                  
                  // Debounce: Check for existing classroom after user stops selecting (800ms)
                  if (prev.name && value && !currentClassroomId) {
                    const name = prev.name; // Capture name value
                    nameCheckTimeoutRef.current = setTimeout(async () => {
                      setIsCheckingName(true);
                      try {
                        const allClassrooms = await classroomsApi.getAll();
                        const existingClassroom = allClassrooms.find(
                          c => c.name.toLowerCase() === name.toLowerCase() && 
                               c.department === value
                        );
                      
                      if (existingClassroom) {
                        setCurrentClassroomId(existingClassroom.id);
                        router.replace(`/classrooms/${existingClassroom.id}/edit`);
                        toast.success(`"${existingClassroom.name}" dersliği bulundu ve otomatik dolduruldu. Düzenleme modunda.`);
                      }
                    } catch (error) {
                      console.error('Error checking classroom name:', error);
                    } finally {
                      setIsCheckingName(false);
                    }
                  }, 800);
                  }
                  
                  return { ...prev, department: value };
                });
              }}
              disabled={!formData.faculty || isCheckingName}
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

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading || isCheckingName}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {currentClassroomId ? 'Güncelle' : 'Kaydet'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/classrooms')}>
          İptal
        </Button>
      </div>
    </form>
  );
}
