import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHierarchicalNavigation } from '@/hooks/use-hierarchical-navigation';

describe('useHierarchicalNavigation', () => {
  it('should start at faculties level', () => {
    const { result } = renderHook(() => useHierarchicalNavigation());
    expect(result.current.viewLevel).toBe('faculties');
    expect(result.current.selectedFaculty).toBeNull();
    expect(result.current.selectedDepartment).toBeNull();
    expect(result.current.searchTerm).toBe('');
  });

  it('should navigate to department level on faculty click', () => {
    const { result } = renderHook(() => useHierarchicalNavigation());

    act(() => {
      result.current.handleFacultyClick('Mühendislik Fakültesi');
    });

    expect(result.current.viewLevel).toBe('departments');
    expect(result.current.selectedFaculty).toBe('Mühendislik Fakültesi');
    expect(result.current.searchTerm).toBe('');
  });

  it('should navigate to items level on department click', () => {
    const { result } = renderHook(() => useHierarchicalNavigation());

    act(() => {
      result.current.handleFacultyClick('Mühendislik Fakültesi');
    });
    act(() => {
      result.current.handleDepartmentClick('Bilgisayar Mühendisliği');
    });

    expect(result.current.viewLevel).toBe('items');
    expect(result.current.selectedDepartment).toBe('Bilgisayar Mühendisliği');
  });

  it('should reset to root level', () => {
    const { result } = renderHook(() => useHierarchicalNavigation());

    act(() => {
      result.current.handleFacultyClick('Mühendislik Fakültesi');
      result.current.handleDepartmentClick('BM');
    });

    act(() => {
      result.current.handleResetBreadcrumb('root');
    });

    expect(result.current.viewLevel).toBe('faculties');
    expect(result.current.selectedFaculty).toBeNull();
    expect(result.current.selectedDepartment).toBeNull();
  });

  it('should reset to faculty level', () => {
    const { result } = renderHook(() => useHierarchicalNavigation());

    act(() => {
      result.current.handleFacultyClick('Mühendislik Fakültesi');
      result.current.handleDepartmentClick('BM');
    });

    act(() => {
      result.current.handleResetBreadcrumb('faculty');
    });

    expect(result.current.viewLevel).toBe('departments');
    expect(result.current.selectedFaculty).toBe('Mühendislik Fakültesi');
    expect(result.current.selectedDepartment).toBeNull();
  });

  it('should call onNavigate callback', () => {
    const onNavigate = vi.fn();
    const { result } = renderHook(() => useHierarchicalNavigation({ onNavigate }));

    act(() => {
      result.current.handleFacultyClick('Test');
    });

    expect(onNavigate).toHaveBeenCalled();
  });

  it('should clear search on navigation', () => {
    const { result } = renderHook(() => useHierarchicalNavigation());

    act(() => {
      result.current.setSearchTerm('test search');
    });
    expect(result.current.searchTerm).toBe('test search');

    act(() => {
      result.current.handleFacultyClick('Faculty');
    });
    expect(result.current.searchTerm).toBe('');
  });
});
