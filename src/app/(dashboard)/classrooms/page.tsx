'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  ChevronRight, 
  Pencil, 
  Trash2, 
  Building2, 
  GraduationCap,
  MoreHorizontal
} from 'lucide-react';
import { useClassrooms, useDeleteClassroom } from '@/hooks/use-classrooms';
import { useAuth } from '@/contexts/auth-context';
import { getFacultyName, getDepartmentName } from '@/constants/faculties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Shell, ShellHeader, ShellContent } from '@/components/layout/shell';
import { ClassroomsTableSkeleton } from '@/components/classrooms/classrooms-skeleton';
import { ClassroomDetailModal } from '@/components/classrooms/classroom-detail-modal';
import type { Classroom } from '@/types';

type ViewLevel = 'faculties' | 'departments' | 'classrooms';

export default function ClassroomsPage() {
  const { data: classrooms = [], isLoading } = useClassrooms();
  const { mutateAsync: deleteClassroom } = useDeleteClassroom();
  const { isAdmin } = useAuth();
  
  // Local State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; classroom: Classroom | null }>({
    show: false,
    classroom: null,
  });
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // View Level Logic
  const viewLevel: ViewLevel = selectedDepartment
    ? 'classrooms'
    : selectedFaculty
      ? 'departments'
      : 'faculties';

  // Memoized Grouping Logic
  const groupedData = useMemo(() => {
    const grouped: Record<string, Record<string, Classroom[]>> = {};

    classrooms.forEach((classroom) => {
      const facultyName = getFacultyName(classroom.faculty);
      const deptName = getDepartmentName(classroom.faculty, classroom.department);

      if (!grouped[facultyName]) grouped[facultyName] = {};
      if (!grouped[facultyName][deptName]) grouped[facultyName][deptName] = [];
      
      grouped[facultyName][deptName].push(classroom);
    });

    return grouped;
  }, [classrooms]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    if (viewLevel === 'faculties') {
      const faculties = Object.keys(groupedData);
      if (!searchTerm) return faculties.sort();
      return faculties.filter(f => f.toLowerCase().includes(lowerSearch)).sort();
    }

    if (viewLevel === 'departments') {
      if (!selectedFaculty || !groupedData[selectedFaculty]) return [];
      const departments = Object.keys(groupedData[selectedFaculty]);
      if (!searchTerm) return departments.sort();
      return departments.filter(d => d.toLowerCase().includes(lowerSearch)).sort();
    }

    // Classrooms view
    if (!selectedFaculty || !selectedDepartment) return [];
    const deptClassrooms = groupedData[selectedFaculty]?.[selectedDepartment] || [];
    
    if (!searchTerm) return deptClassrooms.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    
    return deptClassrooms
      .filter(c => 
        c.name.toLowerCase().includes(lowerSearch) || 
        c.type.toLowerCase().includes(lowerSearch)
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [groupedData, searchTerm, viewLevel, selectedFaculty, selectedDepartment]);

  // Handlers
  const handleDeleteClick = (classroom: Classroom) => {
    setDeleteConfirm({ show: true, classroom });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.classroom) return;
    try {
      await deleteClassroom(deleteConfirm.classroom.id);
      setDeleteConfirm({ show: false, classroom: null });
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleResetBreadcrumb = (level: 'root' | 'faculty') => {
    setSearchTerm('');
    if (level === 'root') {
      setSelectedFaculty(null);
      setSelectedDepartment(null);
    } else {
      setSelectedDepartment(null);
    }
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <ClassroomsTableSkeleton />
      </Shell>
    );
  }

  return (
    <Shell>
      <ShellHeader
        heading="Derslikler"
        text={`${classrooms.length} derslik sistemde kayıtlı.`}
      >
        {isAdmin && (
          <div className="flex gap-2">
            <Link href="/classrooms/bulk">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Toplu Ekle
              </Button>
            </Link>
            <Link href="/classrooms/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Derslik
              </Button>
            </Link>
          </div>
        )}
      </ShellHeader>

      <ShellContent>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border">
          <button
            onClick={() => handleResetBreadcrumb('root')}
            className={`flex items-center gap-1 hover:text-foreground transition-colors ${!selectedFaculty ? 'font-semibold text-foreground' : ''}`}
          >
            <GraduationCap className="h-4 w-4" />
            Fakülteler
          </button>
          
          {selectedFaculty && (
            <>
              <ChevronRight className="h-4 w-4 opacity-50" />
              <button
                onClick={() => handleResetBreadcrumb('faculty')}
                className={`flex items-center gap-1 hover:text-foreground transition-colors ${!selectedDepartment ? 'font-semibold text-foreground' : ''}`}
              >
                <Building2 className="h-4 w-4" />
                {selectedFaculty}
              </button>
            </>
          )}
          
          {selectedDepartment && (
            <>
              <ChevronRight className="h-4 w-4 opacity-50" />
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <Building2 className="h-4 w-4" />
                {selectedDepartment}
              </span>
            </>
          )}
        </div>

        {/* Search */}
        <div className="max-w-md">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={
              viewLevel === 'faculties' ? 'Fakülte ara...' :
              viewLevel === 'departments' ? 'Bölüm ara...' :
              'Derslik adı veya türü ara...'
            }
          />
        </div>

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
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Sonuç bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  (filteredData as string[]).map((faculty) => {
                    const departments = groupedData[faculty] || {};
                    const deptCount = Object.keys(departments).length;
                    const allClassrooms = Object.values(departments).flat();
                    const classroomCount = allClassrooms.length;
                    const totalCapacity = allClassrooms.reduce((sum, c) => sum + c.capacity, 0);

                    return (
                      <TableRow 
                        key={faculty}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedFaculty(faculty);
                          setSearchTerm('');
                        }}
                      >
                        <TableCell className="font-medium">{faculty}</TableCell>
                        <TableCell>{deptCount}</TableCell>
                        <TableCell>{classroomCount}</TableCell>
                        <TableCell>{totalCapacity}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Sonuç bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  (filteredData as string[]).map((department) => {
                    const deptClassrooms = groupedData[selectedFaculty!]?.[department] || [];
                    const totalCapacity = deptClassrooms.reduce((sum, c) => sum + c.capacity, 0);

                    return (
                      <TableRow 
                        key={department}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedDepartment(department);
                          setSearchTerm('');
                        }}
                      >
                        <TableCell className="font-medium">{department}</TableCell>
                        <TableCell>{deptClassrooms.length}</TableCell>
                        <TableCell>{totalCapacity}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {viewLevel === 'classrooms' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(filteredData as Classroom[]).map((classroom) => (
              <Card
                key={classroom.id}
                className="cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                onClick={() => {
                  setSelectedClassroom(classroom);
                  setIsDetailModalOpen(true);
                }}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${classroom.is_active !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
                <CardHeader className="pb-3 pl-5">
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
                <CardContent className="pl-5">
                  <div className="text-sm text-muted-foreground">
                    Kapasite: <span className="font-semibold text-foreground">{classroom.capacity}</span> kişi
                  </div>
                  {classroom.priority_dept && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      Öncelik: {classroom.priority_dept}
                    </div>
                  )}
                  {isAdmin && (
                    <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/classrooms/${classroom.id}/edit`}>
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(classroom);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {filteredData.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Aranan kriterlere uygun derslik bulunamadı.</p>
              </div>
            )}
          </div>
        )}
      </ShellContent>

      {/* Modals */}
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, classroom: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dersliği Sil</DialogTitle>
            <DialogDescription>
              <strong>{deleteConfirm.classroom?.name}</strong> adlı dersliği silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ show: false, classroom: null })}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClassroomDetailModal
        classroom={selectedClassroom}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </Shell>
  );
}