'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  ChevronRight,
  Pencil,
  Trash2,
  BookOpen,
  Building2,
  GraduationCap,
  MoreHorizontal,
  Users
} from 'lucide-react';
import { useCourses, useDeleteCourse } from '@/hooks/use-courses';
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
import { CoursesTableSkeleton } from '@/components/courses/courses-skeleton';
import type { Course } from '@/types';

type ViewLevel = 'faculties' | 'departments' | 'courses';

export default function CoursesPage() {
  const { data: courses = [], isLoading } = useCourses();
  const { mutateAsync: deleteCourse } = useDeleteCourse();
  const { isAdmin } = useAuth();
  
  // Local State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; course: Course | null }>({
    show: false,
    course: null,
  });

  const viewLevel: ViewLevel = selectedDepartment
    ? 'courses'
    : selectedFaculty
      ? 'departments'
      : 'faculties';

  // Memoized Grouping Logic
  const groupedData = useMemo(() => {
    const grouped: Record<string, Record<string, Course[]>> = {};

    courses.forEach((course) => {
      const facultyName = getFacultyName(course.faculty);

      // Handle multiple departments per course or no department
      const departmentsToProcess = 
        course.departments && course.departments.length > 0
          ? course.departments.map(d => ({ 
              name: getDepartmentName(course.faculty, d.department), 
              studentCount: d.student_count 
            }))
          : [{ name: 'Bölümsüz Dersler', studentCount: 0 }];

      departmentsToProcess.forEach(dept => {
        if (!grouped[facultyName]) grouped[facultyName] = {};
        if (!grouped[facultyName][dept.name]) grouped[facultyName][dept.name] = [];

        grouped[facultyName][dept.name].push({
          ...course,
          student_count: dept.studentCount,
        });
      });
    });

    return grouped;
  }, [courses]);

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

    // Courses view
    if (!selectedFaculty || !selectedDepartment) return [];
    const deptCourses = groupedData[selectedFaculty]?.[selectedDepartment] || [];

    // Remove duplicates (same course code might appear if logic allows, ensuring uniqueness)
    const uniqueCourses = Array.from(
      new Map(deptCourses.map((c) => [c.code, c])).values()
    );

    if (!searchTerm) return uniqueCourses.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    return uniqueCourses
      .filter(c => 
        c.name.toLowerCase().includes(lowerSearch) || 
        c.code.toLowerCase().includes(lowerSearch) ||
        c.teacher?.name?.toLowerCase().includes(lowerSearch)
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [groupedData, searchTerm, viewLevel, selectedFaculty, selectedDepartment]);

  // Handlers
  const handleDeleteClick = (course: Course) => {
    setDeleteConfirm({ show: true, course });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.course) return;
    try {
      await deleteCourse(deleteConfirm.course.id);
      setDeleteConfirm({ show: false, course: null });
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
        <CoursesTableSkeleton />
      </Shell>
    );
  }

  return (
    <Shell>
      <ShellHeader
        heading="Dersler"
        text={`${courses.length} ders sistemde kayıtlı.`}
      >
        {isAdmin && (
          <div className="flex gap-2">
            <Link href="/courses/bulk">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Toplu Ekle
              </Button>
            </Link>
            <Link href="/courses/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Ders
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
                <BookOpen className="h-4 w-4" />
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
              'Ders adı, kodu veya öğretim elemanı ara...'
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
                  <TableHead>Ders Sayısı</TableHead>
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
                    const courseCount = new Set(
                      Object.values(departments).flat().map((c) => c.code)
                    ).size;

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
                        <TableCell>{courseCount}</TableCell>
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
                  <TableHead>Ders Sayısı</TableHead>
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
                    const deptCourses = groupedData[selectedFaculty!]?.[department] || [];
                    const courseCount = new Set(deptCourses.map((c) => c.code)).size;

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
                        <TableCell>{courseCount}</TableCell>
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

        {viewLevel === 'courses' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(filteredData as Course[]).map((course) => (
              <Card key={course.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                <div className={`absolute top-0 left-0 w-1 h-full ${course.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                <CardHeader className="pb-3 pl-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{course.code}</p>
                      <CardTitle className="text-lg mt-0.5 leading-snug">{course.name}</CardTitle>
                    </div>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/courses/${course.id}/edit`}>
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(course)}
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
                  <div className="space-y-3">
                    {course.teacher && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="truncate">{course.teacher.name}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="font-normal text-xs">
                        {course.category === 'zorunlu' ? 'Zorunlu' : 'Seçmeli'}
                      </Badge>
                      <Badge variant="outline" className="font-normal text-xs">
                        {course.ects} AKTS
                      </Badge>
                      <Badge variant="outline" className="font-normal text-xs">
                         {course.total_hours} Saat
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredData.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Aranan kriterlere uygun ders bulunamadı.</p>
              </div>
            )}
          </div>
        )}
      </ShellContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, course: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dersi Sil</DialogTitle>
            <DialogDescription>
              <strong>{deleteConfirm.course?.name}</strong> adlı dersi silmek istediğinize emin misiniz? 
              Bu işlem geri alınamaz ve varsa programdaki yerleşimini silecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ show: false, course: null })}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}