'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface FilterOption {
    label: string;
    value: string;
}

interface AdvancedFiltersProps {
    filters: {
        isActive?: boolean | null;
        faculty?: string | null;
        department?: string | null;
        type?: string | null;
    };
    onFiltersChange: (filters: {
        isActive?: boolean | null;
        faculty?: string | null;
        department?: string | null;
        type?: string | null;
    }) => void;
    showActiveFilter?: boolean;
    showFacultyFilter?: boolean;
    showDepartmentFilter?: boolean;
    showTypeFilter?: boolean;
    facultyOptions?: FilterOption[];
    departmentOptions?: FilterOption[];
    typeOptions?: FilterOption[];
}

export function AdvancedFilters({
    filters,
    onFiltersChange,
    showActiveFilter = true,
    showFacultyFilter = false,
    showDepartmentFilter = false,
    showTypeFilter = false,
    facultyOptions = [],
    departmentOptions = [],
    typeOptions = [],
}: AdvancedFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const activeFiltersCount = [
        filters.isActive !== null && filters.isActive !== undefined,
        filters.faculty,
        filters.department,
        filters.type,
    ].filter(Boolean).length;

    const clearFilters = () => {
        onFiltersChange({
            isActive: null,
            faculty: null,
            department: null,
            type: null,
        });
    };

    const updateFilter = (key: keyof typeof filters, value: string | boolean | null) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtreler
                        {activeFiltersCount > 0 && (
                            <Badge
                                variant="default"
                                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                            >
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">Filtreler</h4>
                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-auto py-1 px-2 text-xs"
                                >
                                    Temizle
                                </Button>
                            )}
                        </div>

                        {showActiveFilter && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Durum</label>
                                <Select
                                    value={filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'inactive'}
                                    onValueChange={(value) => {
                                        updateFilter('isActive', value === 'all' ? null : value === 'active');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tümü" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tümü</SelectItem>
                                        <SelectItem value="active">Aktif</SelectItem>
                                        <SelectItem value="inactive">Pasif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {showFacultyFilter && facultyOptions.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fakülte</label>
                                <Select
                                    value={filters.faculty || 'all'}
                                    onValueChange={(value) => {
                                        updateFilter('faculty', value === 'all' ? null : value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tümü" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tümü</SelectItem>
                                        {facultyOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {showDepartmentFilter && departmentOptions.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bölüm</label>
                                <Select
                                    value={filters.department || 'all'}
                                    onValueChange={(value) => {
                                        updateFilter('department', value === 'all' ? null : value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tümü" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tümü</SelectItem>
                                        {departmentOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {showTypeFilter && typeOptions.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tür</label>
                                <Select
                                    value={filters.type || 'all'}
                                    onValueChange={(value) => {
                                        updateFilter('type', value === 'all' ? null : value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tümü" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tümü</SelectItem>
                                        {typeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Active Filter Badges */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-1">
                    {filters.isActive !== null && filters.isActive !== undefined && (
                        <Badge variant="secondary" className="gap-1">
                            {filters.isActive ? 'Aktif' : 'Pasif'}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => updateFilter('isActive', null)}
                            />
                        </Badge>
                    )}
                    {filters.faculty && (
                        <Badge variant="secondary" className="gap-1">
                            {facultyOptions.find((o) => o.value === filters.faculty)?.label || filters.faculty}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => updateFilter('faculty', null)}
                            />
                        </Badge>
                    )}
                    {filters.department && (
                        <Badge variant="secondary" className="gap-1">
                            {departmentOptions.find((o) => o.value === filters.department)?.label || filters.department}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => updateFilter('department', null)}
                            />
                        </Badge>
                    )}
                    {filters.type && (
                        <Badge variant="secondary" className="gap-1">
                            {typeOptions.find((o) => o.value === filters.type)?.label || filters.type}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => updateFilter('type', null)}
                            />
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
