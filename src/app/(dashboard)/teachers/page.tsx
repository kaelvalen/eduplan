'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  ChevronRight, 
  Pencil, 
  Trash2, 
  Users, 
  Building2, 
  GraduationCap, 
  MoreHorizontal 
} from 'lucide-react';
import { useTeachers, useDeleteTeacher } from '@/hooks/use-teachers';
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
import { TeachersTableSkeleton } from '@/components/teachers/teachers-skeleton';
import { TeacherProfileModal } from '@/components/teachers/teacher-profile-modal';
import type { Teacher } from '@/types';

type ViewLevel = 'faculties' | 'departments' | 'teachers';

export default function TeachersPage() {
  const { data: teachers = [], isLoading } = useTeachers();
  const { mutateAsync: deleteTeacher } = useDeleteTeacher();
  const { isAdmin } = useAuth();
  
  // Local State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; teacher: Teacher | null }>({
    show: false,
    teacher: null,
  });
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Determine current view level
  const viewLevel: ViewLevel = selectedDepartment
    ? 'teachers'
    : selectedFaculty
      ? 'departments'
      : 'faculties';

  // Memoized Grouping Logic
  const groupedData = useMemo(() => {
    const grouped: Record<string, Record<string, Teacher[]>> = {};

    teachers.forEach((teacher) => {
      const facultyName = getFacultyName(teacher.faculty);
      const deptName = getDepartmentName(teacher.faculty, teacher.department);

      if (!grouped[facultyName]) grouped[facultyName] = {};
      if (!grouped[facultyName][deptName]) grouped[facultyName][deptName] = [];
      
      grouped[facultyName][deptName].push(teacher);
    });

    return grouped;
  }, [teachers]);

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

    // Teachers view
    if (!selectedFaculty || !selectedDepartment) return [];
    const deptTeachers = groupedData[selectedFaculty]?.[selectedDepartment] || [];
    
    if (!searchTerm) return deptTeachers.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    
    return deptTeachers
      .filter(t => 
        t.name.toLowerCase().includes(lowerSearch) || 
        t.email.toLowerCase().includes(lowerSearch)
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [groupedData, searchTerm, viewLevel, selectedFaculty, selectedDepartment]);

  // Handlers
  const handleDeleteClick = (teacher: Teacher) => {
    setDeleteConfirm({ show: true, teacher });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.teacher) return;
    
    try {
      await deleteTeacher(deleteConfirm.teacher.id);
      setDeleteConfirm({ show: false, teacher: null });
      // Optimistic UI handles the immediate removal visually
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
        <TeachersTableSkeleton />
      </Shell>
    );
  }

  return (
    <Shell>
      <ShellHeader
        heading="Öğretim Elemanları"
        text={`${teachers.length} kayıtlı öğretim elemanı sistemde mevcut.`}
      >
        {isAdmin && (
          <div className="flex gap-2">
            <Link href="/teachers/bulk">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Toplu Ekle
              </Button>
            </Link>
            <Link href="/teachers/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Öğretim Elemanı
              </Button>
            </Link>
          </div>
        )}
      </ShellHeader>

      <ShellContent>
        {/* Breadcrumb Navigation */}
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
                <Users className="h-4 w-4" />
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
              'İsim veya e-posta ile ara...'
            }
          />
        </div>

        {/* Dynamic Content */}
        {viewLevel === 'faculties' && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fakülte Adı</TableHead>
                  <TableHead>Bölüm Sayısı</TableHead>
                  <TableHead>Öğretim Elemanı Sayısı</TableHead>
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
                  (filteredData as string[]).map((faculty) => {
                    const departments = groupedData[faculty] || {};
                    const deptCount = Object.keys(departments).length;
                    const teacherCount = Object.values(departments).flat().length;

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
                        <TableCell>{teacherCount}</TableCell>
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
                  <TableHead>Öğretim Elemanı Sayısı</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Sonuç bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  (filteredData as string[]).map((department) => {
                    const teacherCount = groupedData[selectedFaculty!]?.[department]?.length || 0;

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
                        <TableCell>{teacherCount}</TableCell>
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

        {viewLevel === 'teachers' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(filteredData as Teacher[]).map((teacher) => (
              <Card
                key={teacher.id}
                className="cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                onClick={() => {
                  setSelectedTeacher(teacher);
                  setIsProfileModalOpen(true);
                }}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${teacher.is_active !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
                <CardHeader className="pb-3 pl-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {teacher.title}
                      </span>
                      <CardTitle className="text-lg mt-0.5">{teacher.name}</CardTitle>
                    </div>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/teachers/${teacher.id}/edit`}>
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(teacher);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pl-5">
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <span className="truncate">{teacher.email}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-auto">
                    <Badge variant="outline" className="text-xs font-normal">
                      {teacher.working_hours ? 'Program Girilmiş' : 'Program Yok'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredData.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Aranan kriterlere uygun öğretim elemanı bulunamadı.</p>
              </div>
            )}
          </div>
        )}
      </ShellContent>

      {/* Modals */}
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, teacher: null })}>
        <DialogContent>
          <DialogHeader>
<DialogTitle>Öğretim Elemanını Sil</DialogTitle>
              <DialogDescription>
              Bu işlem geri alınamaz. <strong>{deleteConfirm.teacher?.name}</strong> isimli öğretim elemanını silmek istediğinize emin misiniz?
              Varsa atanmış dersleri boşa çıkacaktır.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ show: false, teacher: null })}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TeacherProfileModal
        teacher={selectedTeacher}
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
    </Shell>
  );
}