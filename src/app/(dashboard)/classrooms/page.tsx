'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, Pencil, Trash2, Building2, GraduationCap } from 'lucide-react';
import { useClassrooms } from '@/hooks/use-classrooms';
import { useAuth } from '@/contexts/auth-context';
import { getFacultyName, getDepartmentName } from '@/constants/faculties';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { SearchBar } from '@/components/ui/search-bar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClassroomDetailModal } from '@/components/classrooms/classroom-detail-modal';
import type { Classroom } from '@/types';

type ViewLevel = 'faculties' | 'departments' | 'classrooms';

export default function ClassroomsPage() {
  const { classrooms, isLoading, deleteClassroom } = useClassrooms();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; classroom: Classroom | null }>({
    show: false,
    classroom: null,
  });
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const viewLevel: ViewLevel = selectedDepartment
    ? 'classrooms'
    : selectedFaculty
      ? 'departments'
      : 'faculties';

  // Group classrooms by faculty and department
  const groupedData = useMemo(() => {
    const grouped: Record<string, Record<string, Classroom[]>> = {};

    classrooms.forEach((classroom) => {
      const facultyName = getFacultyName(classroom.faculty);
      const deptName = getDepartmentName(classroom.faculty, classroom.department);

      if (!grouped[facultyName]) {
        grouped[facultyName] = {};
      }
      if (!grouped[facultyName][deptName]) {
        grouped[facultyName][deptName] = [];
      }
      grouped[facultyName][deptName].push(classroom);
    });

    return grouped;
  }, [classrooms]);

  // Filter based on search term
  const filteredFaculties = useMemo(() => {
    const faculties = Object.keys(groupedData);
    if (!searchTerm || viewLevel !== 'faculties') return faculties.sort();
    return faculties
      .filter((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort();
  }, [groupedData, searchTerm, viewLevel]);

  const filteredDepartments = useMemo(() => {
    if (!selectedFaculty || !groupedData[selectedFaculty]) return [];
    const departments = Object.keys(groupedData[selectedFaculty]);
    if (!searchTerm || viewLevel !== 'departments') return departments.sort();
    return departments
      .filter((d) => d.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort();
  }, [groupedData, selectedFaculty, searchTerm, viewLevel]);

  const filteredClassrooms = useMemo(() => {
    if (!selectedFaculty || !selectedDepartment) return [];
    const deptClassrooms = groupedData[selectedFaculty]?.[selectedDepartment] || [];
    if (!searchTerm) return deptClassrooms.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    return deptClassrooms
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [groupedData, selectedFaculty, selectedDepartment, searchTerm]);

  const handleDeleteClick = (classroom: Classroom) => {
    setDeleteConfirm({ show: true, classroom });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.classroom) {
      await deleteClassroom(deleteConfirm.classroom.id);
      setDeleteConfirm({ show: false, classroom: null });
    }
  };

  const getPlaceholder = () => {
    switch (viewLevel) {
      case 'faculties':
        return 'Fakülte ara...';
      case 'departments':
        return 'Bölüm ara...';
      case 'classrooms':
        return 'Derslik ara...';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <PageHeader
        title="Derslikler"
        description={`${classrooms.length} derslik kayıtlı`}
        icon={Building2}
        entity="classrooms"
        action={isAdmin ? (
          <div className="flex gap-2">
            <Link href="/classrooms/bulk">
              <Button size="lg" variant="outline" className={styles.buttonPrimary}>
                <Plus className="mr-2 h-5 w-5" />
                Toplu Ekle
              </Button>
            </Link>
            <Link href="/classrooms/new">
              <Button size="lg" className={styles.buttonPrimary}>
                <Plus className="mr-2 h-5 w-5" />
                Yeni Derslik
              </Button>
            </Link>
          </div>
        ) : undefined}
      />

      {/* Breadcrumb */}
      <Card className="p-4">
        <div className={styles.breadcrumb}>
          <button
            onClick={() => {
              setSelectedFaculty(null);
              setSelectedDepartment(null);
              setSearchTerm('');
            }}
            className={`${styles.breadcrumbItem} ${!selectedFaculty ? styles.breadcrumbItemActive : styles.breadcrumbItemInactive}`}
          >
            <GraduationCap className="h-4 w-4" />
            Fakülteler
          </button>
          {selectedFaculty && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={() => {
                  setSelectedDepartment(null);
                  setSearchTerm('');
                }}
                className={`${styles.breadcrumbItem} ${!selectedDepartment ? styles.breadcrumbItemActive : styles.breadcrumbItemInactive}`}
              >
                <Building2 className="h-4 w-4" />
                {selectedFaculty}
              </button>
            </>
          )}
          {selectedDepartment && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className={`${styles.breadcrumbItem} ${styles.breadcrumbItemActive}`}>
                <Building2 className="h-4 w-4" />
                {selectedDepartment}
              </span>
            </>
          )}
        </div>
      </Card>

      {/* Search */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder={getPlaceholder()}
      />

      {/* Content */}
      {viewLevel === 'faculties' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fakülte Adı</TableHead>
                <TableHead>Bölüm Sayısı</TableHead>
                <TableHead>Derslik Sayısı</TableHead>
                <TableHead>Toplam Kapasite</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaculties.map((faculty) => {
                const departments = groupedData[faculty] || {};
                const deptCount = Object.keys(departments).length;
                const allClassrooms = Object.values(departments).flat();
                const classroomCount = allClassrooms.length;
                const totalCapacity = allClassrooms.reduce((sum, c) => sum + c.capacity, 0);

                return (
                  <TableRow key={faculty}>
                    <TableCell className="font-medium">{faculty}</TableCell>
                    <TableCell>{deptCount}</TableCell>
                    <TableCell>{classroomCount}</TableCell>
                    <TableCell>{totalCapacity}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFaculty(faculty);
                          setSearchTerm('');
                        }}
                      >
                        Detayları Gör
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredFaculties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Fakülte bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {viewLevel === 'departments' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bölüm Adı</TableHead>
                <TableHead>Derslik Sayısı</TableHead>
                <TableHead>Toplam Kapasite</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((department) => {
                const deptClassrooms = groupedData[selectedFaculty!]?.[department] || [];
                const totalCapacity = deptClassrooms.reduce((sum, c) => sum + c.capacity, 0);

                return (
                  <TableRow key={department}>
                    <TableCell className="font-medium">{department}</TableCell>
                    <TableCell>{deptClassrooms.length}</TableCell>
                    <TableCell>{totalCapacity}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDepartment(department);
                          setSearchTerm('');
                        }}
                      >
                        Detayları Gör
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredDepartments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Bölüm bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {viewLevel === 'classrooms' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClassrooms.map((classroom) => (
            <Card
              key={classroom.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedClassroom(classroom);
                setIsDetailModalOpen(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{classroom.name}</CardTitle>
                  <div className="flex gap-1">
                    <Badge variant={
                      classroom.type === 'teorik' ? 'default' : 
                      classroom.type === 'lab' ? 'secondary' : 
                      'outline'
                    }>
                      {classroom.type === 'teorik' ? 'Teorik' : 
                       classroom.type === 'lab' ? 'Lab' : 
                       'Hibrit'}
                    </Badge>
                    <Badge variant={classroom.is_active !== false ? 'success' : 'outline'}>
                      {classroom.is_active !== false ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Kapasite: <span className="font-semibold text-foreground">{classroom.capacity}</span> kişi
                </div>
                {classroom.priority_dept && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Öncelik: {classroom.priority_dept}
                  </div>
                )}
                {isAdmin && (
                  <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/classrooms/${classroom.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Pencil className="mr-2 h-4 w-4" />
                        Düzenle
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(classroom)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filteredClassrooms.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">
              Derslik bulunamadı
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, classroom: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Silme Onayı</DialogTitle>
            <DialogDescription>
              <strong>{deleteConfirm.classroom?.name}</strong> adlı dersliği silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ show: false, classroom: null })}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Classroom Detail Modal */}
      <ClassroomDetailModal
        classroom={selectedClassroom}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </div>
  );
}
