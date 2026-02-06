'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { classroomsApi } from '@/lib/api';
import { FACULTIES, getDepartmentsByFaculty } from '@/constants/faculties';
import { BulkTableEditor, type ColumnDef } from '@/components/ui/bulk-table-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';

type ClassroomRow = {
  id?: number; // For edit mode - if set, row will be updated instead of created
  name: string;
  capacity: number;
  type: string;
  faculty: string;
  department: string;
  is_active: boolean;
};

const CLASSROOM_TYPES = [
  { value: 'teorik', label: 'Teorik' },
  { value: 'lab', label: 'Laboratuvar' },
  { value: 'hibrit', label: 'Hibrit' },
];

export default function BulkClassroomsPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<ClassroomRow[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/classrooms');
    }
  }, [isAdmin, router]);

  const columns: ColumnDef<ClassroomRow>[] = [
    {
      key: 'name',
      header: 'Derslik Adı',
      type: 'text',
      required: true,
      placeholder: 'Örn: A101',
    },
    {
      key: 'capacity',
      header: 'Kapasite',
      type: 'number',
      required: true,
      placeholder: '30',
      validate: (value) => {
        if (!value || value < 1) return 'Kapasite en az 1 olmalıdır';
        if (value > 1000) return 'Kapasite en fazla 1000 olabilir';
        return null;
      },
    },
    {
      key: 'type',
      header: 'Tür',
      type: 'select',
      options: CLASSROOM_TYPES,
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
      options: FACULTIES.flatMap((faculty) =>
        getDepartmentsByFaculty(faculty.id).map((dept) => ({
          value: dept.id,
          label: `${faculty.name} - ${dept.name}`,
        }))
      ),
      required: true,
    },
    {
      key: 'is_active',
      header: 'Aktif',
      type: 'checkbox',
    },
  ];

  const defaultRow = (): ClassroomRow => ({
    id: undefined, // No id means new row
    name: '',
    capacity: 30,
    type: 'teorik',
    faculty: '',
    department: '',
    is_active: true,
  });

  // Update row data and auto-fill when name+department changes
  const updateRowData = (newRows: ClassroomRow[]) => {
    // Store previous rows for comparison
    const prevRows = [...rows];
    
    setRows(newRows);
    
    // Check for name+department changes and auto-fill (async operation after state update)
    newRows.forEach(async (row, idx) => {
      const prevRow = prevRows[idx];
      
      // If name or department changed and both are not empty and doesn't have id yet, try to fetch existing classroom
      if (
        prevRow &&
        (prevRow.name !== row.name || prevRow.department !== row.department) &&
        row.name &&
        row.department &&
        !row.id
      ) {
        try {
          const allClassrooms = await classroomsApi.getAll();
          const existingClassroom = allClassrooms.find(
            c => c.name.toLowerCase() === row.name.toLowerCase() && 
                 c.department === row.department
          );
          
          if (existingClassroom) {
            // Auto-fill the row with existing classroom data
            const updatedRow: ClassroomRow = {
              id: existingClassroom.id, // Set id to mark as edit mode
              name: existingClassroom.name,
              capacity: existingClassroom.capacity,
              type: existingClassroom.type,
              faculty: existingClassroom.faculty,
              department: existingClassroom.department,
              is_active: existingClassroom.is_active ?? true,
            };
            
            // Update the specific row using functional setState to avoid stale closure
            setRows(currentRows => {
              const newUpdatedRows = [...currentRows];
              newUpdatedRows[idx] = updatedRow;
              return newUpdatedRows;
            });
            
            toast.success(`"${existingClassroom.name}" dersliği bulundu ve otomatik dolduruldu. Düzenleme modunda.`);
          }
        } catch (error) {
          console.error('Error fetching classroom by name and department:', error);
          // Continue with normal row if fetch fails
        }
      }
    });
  };

  const handleSave = async (data: ClassroomRow[]) => {
    const errors: Array<{ row: number; error: string }> = [];
    let successCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const classroomData = {
          name: row.name,
          capacity: row.capacity,
          type: row.type as 'teorik' | 'lab' | 'hibrit',
          faculty: row.faculty,
          department: row.department,
          is_active: row.is_active,
        };

        // If row has id, update existing classroom; otherwise create new
        if (row.id) {
          await classroomsApi.update(row.id, classroomData);
        } else {
          await classroomsApi.create(classroomData);
        }
        successCount++;
      } catch (error: any) {
        const message = error?.response?.data?.detail || error?.message || 'Bilinmeyen hata';
        errors.push({ row: i, error: message });
      }
    }

    if (successCount > 0) {
      const updateCount = data.filter(row => row.id).length;
      const createCount = successCount - updateCount;
      if (updateCount > 0 && createCount > 0) {
        toast.success(`${createCount} derslik eklendi, ${updateCount} derslik güncellendi`);
      } else if (updateCount > 0) {
        toast.success(`${updateCount} derslik başarıyla güncellendi`);
      } else {
        toast.success(`${createCount} derslik başarıyla eklendi`);
      }
    }

    return { success: successCount, errors };
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Derslik Toplu Ekleme"
        description="Birden fazla dersliği tek seferde ekleyin. Satır ekleyerek doldurun ve toplu kaydedin."
        icon={Building2}
      />

      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" onClick={() => router.push('/classrooms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Derslik Listesi</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Aşağıdaki tabloda derslik bilgilerini girebilirsiniz. * işaretli alanlar zorunludur.
            <br />
            <strong>Otomatik Doldurma:</strong> Mevcut bir derslik adı ve bölümünü girdiğinizde, diğer tüm alanlar otomatik olarak doldurulur ve satır düzenleme moduna geçer.
            <br />
            Satır numarası ile işlem yapabilir, istediğiniz kadar satır ekleyebilirsiniz.
          </p>
        </CardHeader>
        <CardContent>
          <BulkTableEditor
            columns={columns}
            data={rows}
            onDataChange={updateRowData}
            onSave={handleSave}
            defaultRow={defaultRow}
            emptyMessage="Henüz derslik eklenmemiş. 'Satır Ekle' butonuna tıklayarak başlayın."
          />
        </CardContent>
      </Card>
    </div>
  );
}
