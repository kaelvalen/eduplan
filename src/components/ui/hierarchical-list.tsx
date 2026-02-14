'use client';

import React, { useMemo, ReactNode } from 'react';
import { ChevronRight, GraduationCap, Building2, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SearchBar } from '@/components/ui/search-bar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useHierarchicalNavigation } from '@/hooks/use-hierarchical-navigation';

// Generic grouped data structure
export type GroupedData<T> = Record<string, Record<string, T[]>>;

// Props for the hierarchical list component
export interface HierarchicalListProps<T> {
  // Data
  items: T[];
  isLoading: boolean;

  // Grouping functions
  getFaculty: (item: T) => string;
  getDepartment: (item: T) => string | string[];

  // Rendering functions for different views
  renderFacultyRow?: (
    faculty: string,
    departments: Record<string, T[]>,
    onClick: () => void
  ) => ReactNode;
  renderDepartmentRow?: (
    department: string,
    items: T[],
    onClick: () => void
  ) => ReactNode;
  renderItemCard: (item: T) => ReactNode;

  // Configuration
  entityConfig: {
    entityName: string; // e.g., "courses", "teachers", "classrooms"
    entityNameSingular: string; // e.g., "course", "teacher", "classroom"
    entityIcon: LucideIcon;
    facultyTableHeaders: string[];
    departmentTableHeaders: string[];
  };

  // Search
  searchPlaceholders: {
    faculties: string;
    departments: string;
    items: string;
  };

  // Item filtering (for search at item level)
  filterItems?: (item: T, searchTerm: string) => boolean;

  // Loading skeleton
  loadingSkeleton: ReactNode;

  // Empty state
  emptyState?: ReactNode;

  // Process items before grouping (e.g., for courses with multiple departments)
  processItemsForGrouping?: (items: T[]) => Array<T & { groupKey?: string }>;
}

export function HierarchicalList<T extends { id: string | number }>({
  items,
  isLoading,
  getFaculty,
  getDepartment,
  renderFacultyRow,
  renderDepartmentRow,
  renderItemCard,
  entityConfig,
  searchPlaceholders,
  filterItems,
  loadingSkeleton,
  emptyState,
  processItemsForGrouping,
}: HierarchicalListProps<T>) {
  const navigation = useHierarchicalNavigation();
  const {
    searchTerm,
    setSearchTerm,
    selectedFaculty,
    selectedDepartment,
    viewLevel,
    handleResetBreadcrumb,
    handleFacultyClick,
    handleDepartmentClick,
  } = navigation;

  // Memoized Grouping Logic
  const groupedData = useMemo(() => {
    const grouped: GroupedData<T> = {};

    // Use custom processing if provided (e.g., for courses with multiple departments)
    const itemsToProcess = processItemsForGrouping ? processItemsForGrouping(items) : items;

    itemsToProcess.forEach((item) => {
      const facultyName = getFaculty(item);
      const deptResult = getDepartment(item);

      // Handle single or multiple departments
      const departments = Array.isArray(deptResult) ? deptResult : [deptResult];

      departments.forEach((deptName) => {
        if (!grouped[facultyName]) grouped[facultyName] = {};
        if (!grouped[facultyName][deptName]) grouped[facultyName][deptName] = [];
        grouped[facultyName][deptName].push(item);
      });
    });

    return grouped;
  }, [items, getFaculty, getDepartment, processItemsForGrouping]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    // Faculty level
    if (viewLevel === 'faculties') {
      const faculties = Object.keys(groupedData);
      if (!searchTerm) return faculties.sort();
      return faculties.filter(f => f.toLowerCase().includes(lowerSearch)).sort();
    }

    // Department level
    if (viewLevel === 'departments') {
      if (!selectedFaculty || !groupedData[selectedFaculty]) return [];
      const departments = Object.keys(groupedData[selectedFaculty]);
      if (!searchTerm) return departments.sort();
      return departments.filter(d => d.toLowerCase().includes(lowerSearch)).sort();
    }

    // Items level
    if (!selectedFaculty || !selectedDepartment) return [];
    const deptItems = groupedData[selectedFaculty]?.[selectedDepartment] || [];

    // Remove duplicates (same item might appear if logic allows)
    const uniqueItems = Array.from(
      new Map(deptItems.map((item) => [item.id, item])).values()
    );

    if (!searchTerm) return uniqueItems;

    // Use custom filter if provided, otherwise return all
    if (filterItems) {
      return uniqueItems.filter(item => filterItems(item, lowerSearch));
    }

    return uniqueItems;
  }, [
    groupedData,
    searchTerm,
    viewLevel,
    selectedFaculty,
    selectedDepartment,
    filterItems,
  ]);

  // Loading state
  if (isLoading) {
    return loadingSkeleton;
  }

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border">
        <button
          onClick={() => handleResetBreadcrumb('root')}
          className={`flex items-center gap-1 hover:text-foreground transition-colors ${
            !selectedFaculty ? 'font-semibold text-foreground' : ''
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Fakülteler
        </button>

        {selectedFaculty && (
          <>
            <ChevronRight className="h-4 w-4 opacity-50" />
            <button
              onClick={() => handleResetBreadcrumb('faculty')}
              className={`flex items-center gap-1 hover:text-foreground transition-colors ${
                !selectedDepartment ? 'font-semibold text-foreground' : ''
              }`}
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
              {React.createElement(entityConfig.entityIcon, { className: 'h-4 w-4' })}
              {selectedDepartment}
            </span>
          </>
        )}
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={
            viewLevel === 'faculties'
              ? searchPlaceholders.faculties
              : viewLevel === 'departments'
                ? searchPlaceholders.departments
                : searchPlaceholders.items
          }
        />
      </div>

      {/* Content Views */}
      {viewLevel === 'faculties' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {entityConfig.facultyTableHeaders.map((header, index) => (
                  <TableHead
                    key={index}
                    className={index === entityConfig.facultyTableHeaders.length - 1 ? 'text-right' : ''}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={entityConfig.facultyTableHeaders.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Sonuç bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                (filteredData as string[]).map((faculty) => {
                  const departments = groupedData[faculty] || {};

                  // Default rendering if no custom renderer provided
                  if (renderFacultyRow) {
                    return (
                      <TableRow
                        key={faculty}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleFacultyClick(faculty)}
                      >
                        {renderFacultyRow(faculty, departments, () => handleFacultyClick(faculty))}
                      </TableRow>
                    );
                  }

                  // Fallback default row
                  const deptCount = Object.keys(departments).length;
                  const itemCount = Object.values(departments).flat().length;

                  return (
                    <TableRow
                      key={faculty}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleFacultyClick(faculty)}
                    >
                      <TableCell className="font-medium">{faculty}</TableCell>
                      <TableCell>{deptCount}</TableCell>
                      <TableCell>{itemCount}</TableCell>
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
                {entityConfig.departmentTableHeaders.map((header, index) => (
                  <TableHead
                    key={index}
                    className={index === entityConfig.departmentTableHeaders.length - 1 ? 'text-right' : ''}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={entityConfig.departmentTableHeaders.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Sonuç bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                (filteredData as string[]).map((department) => {
                  const deptItems = groupedData[selectedFaculty!]?.[department] || [];

                  // Custom rendering if provided
                  if (renderDepartmentRow) {
                    return (
                      <TableRow
                        key={department}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleDepartmentClick(department)}
                      >
                        {renderDepartmentRow(department, deptItems, () =>
                          handleDepartmentClick(department)
                        )}
                      </TableRow>
                    );
                  }

                  // Fallback default row
                  return (
                    <TableRow
                      key={department}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleDepartmentClick(department)}
                    >
                      <TableCell className="font-medium">{department}</TableCell>
                      <TableCell>{deptItems.length}</TableCell>
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

      {viewLevel === 'items' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(filteredData as T[]).map((item) => (
            <div key={item.id}>{renderItemCard(item)}</div>
          ))}
          {filteredData.length === 0 && (
            emptyState || (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                {React.createElement(entityConfig.entityIcon, {
                  className: 'h-10 w-10 mx-auto mb-3 opacity-20',
                })}
                <p>Aranan kriterlere uygun {entityConfig.entityName} bulunamadı.</p>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}

