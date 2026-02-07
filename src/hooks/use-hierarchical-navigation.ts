import { useState, useMemo } from 'react';

export type ViewLevel = 'faculties' | 'departments' | 'items';

export interface UseHierarchicalNavigationOptions {
  onNavigate?: () => void;
}

export function useHierarchicalNavigation(options?: UseHierarchicalNavigationOptions) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const viewLevel: ViewLevel = useMemo(() => {
    if (selectedDepartment) return 'items';
    if (selectedFaculty) return 'departments';
    return 'faculties';
  }, [selectedFaculty, selectedDepartment]);

  const handleResetBreadcrumb = (level: 'root' | 'faculty') => {
    setSearchTerm('');
    if (level === 'root') {
      setSelectedFaculty(null);
      setSelectedDepartment(null);
    } else {
      setSelectedDepartment(null);
    }
    options?.onNavigate?.();
  };

  const handleFacultyClick = (faculty: string) => {
    setSelectedFaculty(faculty);
    setSearchTerm('');
    options?.onNavigate?.();
  };

  const handleDepartmentClick = (department: string) => {
    setSelectedDepartment(department);
    setSearchTerm('');
    options?.onNavigate?.();
  };

  return {
    // State
    searchTerm,
    selectedFaculty,
    selectedDepartment,
    viewLevel,

    // Setters
    setSearchTerm,
    setSelectedFaculty,
    setSelectedDepartment,

    // Actions
    handleResetBreadcrumb,
    handleFacultyClick,
    handleDepartmentClick,
  };
}
