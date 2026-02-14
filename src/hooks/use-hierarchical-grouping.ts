/**
 * Hierarchical Grouping Hook
 *
 * Generic hook for grouping and filtering hierarchical data (Faculty → Department → Items)
 * Used across courses, teachers, and classrooms pages to eliminate duplicate logic
 */

import { useMemo } from 'react';
import { getFacultyName, getDepartmentName } from '@/constants/faculties';

export interface HierarchicalItem {
  id: number;
  faculty: string;
  departments?: Array<{ department: string; student_count?: number }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface GroupedData<T> {
  [faculty: string]: {
    [department: string]: T[];
  };
}

export interface UseHierarchicalGroupingOptions<T extends HierarchicalItem> {
  items: T[];
  searchTerm: string;
  selectedFaculty: string | null;
  selectedDepartment: string | null;
  searchFields?: (item: T) => string[]; // Fields to search in at item level
}

export function useHierarchicalGrouping<T extends HierarchicalItem>({
  items,
  searchTerm,
  selectedFaculty,
  selectedDepartment,
  searchFields,
}: UseHierarchicalGroupingOptions<T>) {
  // Determine view level
  const viewLevel = selectedDepartment
    ? 'items'
    : selectedFaculty
      ? 'departments'
      : 'faculties';

  // Group items by faculty and department
  const groupedData = useMemo<GroupedData<T>>(() => {
    const grouped: GroupedData<T> = {};

    items.forEach((item) => {
      const facultyName = getFacultyName(item.faculty);

      // Handle items with departments array (courses)
      if (item.departments && item.departments.length > 0) {
        item.departments.forEach((dept) => {
          const departmentName = getDepartmentName(item.faculty, dept.department);

          if (!grouped[facultyName]) grouped[facultyName] = {};
          if (!grouped[facultyName][departmentName]) grouped[facultyName][departmentName] = [];

          grouped[facultyName][departmentName].push({
            ...item,
            student_count: dept.student_count,
          });
        });
      } else {
        // Handle items without departments (teachers, classrooms with single department)
        const departmentName = 'department' in item && typeof item.department === 'string'
          ? getDepartmentName(item.faculty, item.department)
          : 'Bölümsüz';

        if (!grouped[facultyName]) grouped[facultyName] = {};
        if (!grouped[facultyName][departmentName]) grouped[facultyName][departmentName] = [];

        grouped[facultyName][departmentName].push(item);
      }
    });

    return grouped;
  }, [items]);

  // Filter data based on current view level and search term
  const filteredData = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    // Faculty level
    if (viewLevel === 'faculties') {
      const faculties = Object.keys(groupedData);
      if (!searchTerm) return faculties.sort();
      return faculties.filter((f) => f.toLowerCase().includes(lowerSearch)).sort();
    }

    // Department level
    if (viewLevel === 'departments') {
      if (!selectedFaculty || !groupedData[selectedFaculty]) return [];
      const departments = Object.keys(groupedData[selectedFaculty]);
      if (!searchTerm) return departments.sort();
      return departments.filter((d) => d.toLowerCase().includes(lowerSearch)).sort();
    }

    // Items level
    if (!selectedFaculty || !selectedDepartment) return [];
    const deptItems = groupedData[selectedFaculty]?.[selectedDepartment] || [];

    // Remove duplicates based on ID
    const uniqueItems = Array.from(
      new Map(deptItems.map((item) => [item.id, item])).values()
    );

    // No search term - return all sorted by name
    if (!searchTerm) {
      return uniqueItems.sort((a, b) => {
        const aName = 'name' in a ? String(a.name) : '';
        const bName = 'name' in b ? String(b.name) : '';
        return aName.localeCompare(bName, 'tr');
      });
    }

    // Apply search to custom fields if provided
    if (searchFields) {
      return uniqueItems
        .filter((item) => {
          const fields = searchFields(item);
          return fields.some((field) => field.toLowerCase().includes(lowerSearch));
        })
        .sort((a, b) => {
          const aName = 'name' in a ? String(a.name) : '';
          const bName = 'name' in b ? String(b.name) : '';
          return aName.localeCompare(bName, 'tr');
        });
    }

    // Default: search by name
    return uniqueItems
      .filter((item) => {
        const name = 'name' in item ? String(item.name).toLowerCase() : '';
        return name.includes(lowerSearch);
      })
      .sort((a, b) => {
        const aName = 'name' in a ? String(a.name) : '';
        const bName = 'name' in b ? String(b.name) : '';
        return aName.localeCompare(bName, 'tr');
      });
  }, [groupedData, searchTerm, viewLevel, selectedFaculty, selectedDepartment, searchFields]);

  // Get statistics for current level
  const statistics = useMemo(() => {
    if (viewLevel === 'faculties') {
      return Object.entries(groupedData).map(([faculty, departments]) => {
        const deptCount = Object.keys(departments).length;
        const itemCount = Object.values(departments).flat().length;
        // Get unique item count (e.g., unique course codes)
        const uniqueItemCount = new Set(
          Object.values(departments).flat().map((item) => item.id)
        ).size;

        return {
          name: faculty,
          departmentCount: deptCount,
          itemCount: uniqueItemCount || itemCount,
        };
      });
    }

    if (viewLevel === 'departments' && selectedFaculty) {
      const departments = groupedData[selectedFaculty] || {};
      return Object.entries(departments).map(([department, items]) => {
        const uniqueItemCount = new Set(items.map((item) => item.id)).size;

        return {
          name: department,
          itemCount: uniqueItemCount,
        };
      });
    }

    return [];
  }, [groupedData, viewLevel, selectedFaculty]);

  return {
    viewLevel,
    groupedData,
    filteredData,
    statistics,
  };
}
