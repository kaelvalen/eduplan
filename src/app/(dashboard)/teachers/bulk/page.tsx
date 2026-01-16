'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { teachersApi } from '@/lib/api';
import { FACULTIES, getDepartmentsByFaculty } from '@/constants/faculties';
import { BulkTableEditor, type ColumnDef } from '@/components/ui/bulk-table-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import type { TeacherCreate } from '@/types';

const ACADEMIC_TITLES = [
  { value: 'Prof. Dr.', label: 'Prof. Dr.' },
  { value: 'Doç. Dr.', label: 'Doç. Dr.' },
  { value: 'Dr. Öğr. Üyesi', label: 'Dr. Öğr. Üyesi' },
  { value: 'Öğr. Gör.', label: 'Öğr. Gör.' },
  { value: 'Öğr. Gör. Dr.', label: 'Öğr. Gör. Dr.' },
  { value: 'Arş. Gör.', label: 'Arş. Gör.' },
  { value: 'Arş. Gör. Dr.', label: 'Arş. Gör. Dr.' },
];

type TeacherRow = {
  name: string;
  email: string;
  title: string;
  faculty: string;
  department: string;
  is_active: boolean;
};

export default function BulkTeachersPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [faculties, setFaculties] = useState<{ [key: string]: { value: string; label: string }[] }>({});

  useEffect(() => {
    if (!isAdmin) {
      router.push('/teachers');
    }
  }, [isAdmin, router]);

  // Preload departments for each faculty
  useEffect(() => {
    const deptMap: { [key: string]: { value: string; label: string }[] } = {};
    FACULTIES.forEach((faculty) => {
      const departments = getDepartmentsByFaculty(faculty.id);
      deptMap[faculty.id] = departments.map((dept) => ({
        value: dept.id,
        label: dept.name,
      }));
    });
    setFaculties(deptMap);
  }, []);

  // Update department options when faculty changes
  const updateRowData = (newRows: TeacherRow[]) => {
    const updated = newRows.map((row, idx) => {
      // If faculty changed, clear department
      const prevRow = rows[idx];
      if (prevRow && prevRow.faculty !== row.faculty) {
        return { ...row, department: '' };
      }
      return row;
    });
    setRows(updated);
  };

  // Get columns with dynamic department options
  const getColumns = (): ColumnDef<TeacherRow>[] => [
    {
      key: 'name',
      header: 'Ad Soyad',
      type: 'text',
      required: true,
      placeholder: 'Örn: Ahmet Yılmaz',
    },
    {
      key: 'email',
      header: 'E-posta',
      type: 'text',
      required: true,
      placeholder: 'ornek@universite.edu.tr',
      validate: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Geçerli bir e-posta adresi girin';
      },
    },
    {
      key: 'title',
      header: 'Akademik Ünvan',
      type: 'select',
      options: ACADEMIC_TITLES,
      required: true,
    },
    {
      key: 'faculty',
      header: 'Fakülte',
      type: 'select',
      options: FACULTIES.map((f) => ({ value: f.id, label: f.name })),
      required: true,
    },
    {
      key: 'department',
      header: 'Bölüm',
      type: 'select',
      // Use flat list with faculty prefix for clarity
      options: FACULTIES.flatMap((faculty) =>
        getDepartmentsByFaculty(faculty.id).map((dept) => ({
          value: dept.id,
          label: `${faculty.name} - ${dept.name}`,
        }))
      ),
      required: true,
      validate: (value, row) => {
        if (!value) return null;
        if (!row.faculty) return 'Lütfen önce fakülte seçin';
        const deptOptions = faculties[row.faculty] || [];
        const exists = deptOptions.some((opt) => opt.value === value);
        return exists ? null : 'Geçersiz bölüm seçimi';
      },
    },
    {
      key: 'is_active',
      header: 'Aktif',
      type: 'checkbox',
    },
  ];

  const defaultRow = (): TeacherRow => ({
    name: '',
    email: '',
    title: 'Öğr. Gör.',
    faculty: '',
    department: '',
    is_active: true,
  });

  const handleSave = async (data: TeacherRow[]) => {
    const errors: Array<{ row: number; error: string }> = [];
    let successCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Get department options for this row's faculty
        const deptOptions = row.faculty ? (faculties[row.faculty] || []) : [];
        
        await teachersApi.create({
          name: row.name,
          email: row.email,
          title: row.title,
          faculty: row.faculty,
          department: row.department,
          working_hours: '{}',
          is_active: row.is_active,
        });
        successCount++;
      } catch (error: any) {
        const message = error?.response?.data?.detail || error?.message || 'Bilinmeyen hata';
        errors.push({ row: i, error: message });
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} öğretmen başarıyla eklendi`);
    }

    return { success: successCount, errors };
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Öğretmen Toplu Ekleme"
        description="Birden fazla öğretmeni tek seferde ekleyin. Satır ekleyerek doldurun ve toplu kaydedin."
        icon={Users}
      />

      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" onClick={() => router.push('/teachers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Öğretmen Listesi</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Aşağıdaki tabloda öğretmen bilgilerini girebilirsiniz. * işaretli alanlar zorunludur.
            E-posta adresleri benzersiz olmalıdır. Fakülte seçtikten sonra bölüm seçebilirsiniz.
          </p>
        </CardHeader>
        <CardContent>
          <BulkTableEditor
            columns={getColumns()}
            data={rows}
            onDataChange={updateRowData}
            onSave={handleSave}
            defaultRow={defaultRow}
            emptyMessage="Henüz öğretmen eklenmemiş. 'Satır Ekle' butonuna tıklayarak başlayın."
          />
        </CardContent>
      </Card>
    </div>
  );
}
