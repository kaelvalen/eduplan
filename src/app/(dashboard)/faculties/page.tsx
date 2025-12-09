'use client';

import { useState } from 'react';
import { ChevronRight, GraduationCap, Building2 } from 'lucide-react';
import { FACULTIES, getDepartmentsByFaculty } from '@/constants/faculties';
import { styles } from '@/lib/design-tokens';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

export default function FacultiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);

  const filteredFaculties = FACULTIES.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const departments = selectedFaculty ? getDepartmentsByFaculty(selectedFaculty) : [];
  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <PageHeader
        title="Fakülteler & Programlar"
        description="Fakülte ve bölüm listesini görüntüleyin"
        icon={GraduationCap}
        entity="teachers"
      />

      {/* Breadcrumb */}
      <Card className="p-4">
        <div className={styles.breadcrumb}>
          <button
            onClick={() => {
              setSelectedFaculty(null);
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
              <span className={`${styles.breadcrumbItem} ${styles.breadcrumbItemActive}`}>
                <Building2 className="h-4 w-4" />
                {FACULTIES.find((f) => f.id === selectedFaculty)?.name}
              </span>
            </>
          )}
        </div>
      </Card>

      {/* Search */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder={selectedFaculty ? 'Bölüm ara...' : 'Fakülte ara...'}
      />

      {/* Content */}
      {!selectedFaculty ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fakülte Adı</TableHead>
                <TableHead>Bölüm Sayısı</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaculties.map((faculty) => {
                const deptCount = getDepartmentsByFaculty(faculty.id).length;
                return (
                  <TableRow key={faculty.id}>
                    <TableCell className="font-medium">{faculty.name}</TableCell>
                    <TableCell>{deptCount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFaculty(faculty.id);
                          setSearchTerm('');
                        }}
                      >
                        Bölümleri Gör
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredFaculties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Fakülte bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bölüm Adı</TableHead>
                <TableHead>Bölüm Kodu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-muted-foreground">{dept.id}</TableCell>
                </TableRow>
              ))}
              {filteredDepartments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Bölüm bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
