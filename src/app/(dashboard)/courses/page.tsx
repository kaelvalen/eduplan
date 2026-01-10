'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, Pencil, Trash2, BookOpen, Building2, GraduationCap } from 'lucide-react';
import { useCourses } from '@/hooks/use-courses';
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
import type { Course } from '@/types';

type ViewLevel = 'faculties' | 'departments' | 'courses';

export default function CoursesPage() {
  const { courses, isLoading, deleteCourse } = useCourses();
  const { isAdmin } = useAuth();
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

  // Group courses by faculty and department
  const groupedData = useMemo(() => {
    const grouped: Record<string, Record<string, Course[]>> = {};

    courses.forEach((course) => {
      const facultyName = getFacultyName(course.faculty);

      // Handle multiple departments per course
      if (course.departments && course.departments.length > 0) {
        course.departments.forEach((dept) => {
          const deptName = getDepartmentName(course.faculty, dept.department);

          if (!grouped[facultyName]) {
            grouped[facultyName] = {};
          }
          if (!grouped[facultyName][deptName]) {
            grouped[facultyName][deptName] = [];
          }

          // Add course with department-specific info
          grouped[facultyName][deptName].push({
            ...course,
            student_count: dept.student_count,
          });
        });
      } else {
        // Handle courses with no departments
        const deptName = 'Bölümsüz Dersler';

        if (!grouped[facultyName]) {
          grouped[facultyName] = {};
        }
        if (!grouped[facultyName][deptName]) {
          grouped[facultyName][deptName] = [];
        }

        grouped[facultyName][deptName].push({
          ...course,
          student_count: 0,
        });
      }
    });

    return grouped;
  }, [courses]);

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

  const filteredCourses = useMemo(() => {
    if (!selectedFaculty || !selectedDepartment) return [];
    const deptCourses = groupedData[selectedFaculty]?.[selectedDepartment] || [];

    // Remove duplicates by course code
    const uniqueCourses = Array.from(
      new Map(deptCourses.map((c) => [c.code, c])).values()
    );

    if (!searchTerm) return uniqueCourses.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    return uniqueCourses
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [groupedData, selectedFaculty, selectedDepartment, searchTerm]);

  const handleDeleteClick = (course: Course) => {
    setDeleteConfirm({ show: true, course });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.course) {
      await deleteCourse(deleteConfirm.course.id);
      setDeleteConfirm({ show: false, course: null });
    }
  };

  const getPlaceholder = () => {
    switch (viewLevel) {
      case 'faculties':
        return 'Fakülte ara...';
      case 'departments':
        return 'Bölüm ara...';
      case 'courses':
        return 'Ders ara...';
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
        title="Dersler"
        description={`${courses.length} ders kayıtlı`}
        icon={BookOpen}
        entity="courses"
        action={isAdmin ? (
          <Link href="/courses/new">
            <Button size="lg" className={styles.buttonPrimary}>
              <Plus className="mr-2 h-5 w-5" />
              Yeni Ders
            </Button>
          </Link>
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
                <BookOpen className="h-4 w-4" />
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
                <TableHead>Ders Sayısı</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaculties.map((faculty) => {
                const departments = groupedData[faculty] || {};
                const deptCount = Object.keys(departments).length;
                const courseCount = new Set(
                  Object.values(departments).flat().map((c) => c.code)
                ).size;

                return (
                  <TableRow key={faculty}>
                    <TableCell className="font-medium">{faculty}</TableCell>
                    <TableCell>{deptCount}</TableCell>
                    <TableCell>{courseCount}</TableCell>
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
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
                <TableHead>Ders Sayısı</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((department) => {
                const deptCourses = groupedData[selectedFaculty!]?.[department] || [];
                const courseCount = new Set(deptCourses.map((c) => c.code)).size;

                return (
                  <TableRow key={department}>
                    <TableCell className="font-medium">{department}</TableCell>
                    <TableCell>{courseCount}</TableCell>
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
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Bölüm bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {viewLevel === 'courses' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{course.code}</p>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                  </div>
                  <Badge variant={course.is_active ? 'success' : 'secondary'}>
                    {course.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {course.teacher && (
                    <p className="text-muted-foreground">{course.teacher.name}</p>
                  )}
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {course.category === 'zorunlu' ? 'Zorunlu' : 'Seçmeli'}
                    </Badge>
                    <Badge variant="outline">{course.ects} AKTS</Badge>
                  </div>
                </div>
                {isAdmin && (
                  <div className="mt-4 flex gap-2">
                    <Link href={`/courses/${course.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Pencil className="mr-2 h-4 w-4" />
                        Düzenle
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(course)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filteredCourses.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">
              Ders bulunamadı
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, course: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Silme Onayı</DialogTitle>
            <DialogDescription>
              <strong>{deleteConfirm.course?.name}</strong> adlı dersi silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ show: false, course: null })}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
