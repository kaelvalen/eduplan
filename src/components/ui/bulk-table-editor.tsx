'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export type ColumnDef<T = any> = {
  key: keyof T;
  header: string;
  type?: 'text' | 'number' | 'select' | 'checkbox' | 'custom';
  options?: { value: string; label: string }[];
  required?: boolean;
  validate?: (value: any, row: T) => string | null;
  placeholder?: string;
  width?: string;
  customRender?: (row: T, rowIndex: number, updateCell: (key: keyof T, value: any) => void) => React.ReactNode;
};

interface BulkTableEditorProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onDataChange: (data: T[]) => void;
  onSave: (data: T[]) => Promise<{ success: number; errors: Array<{ row: number; error: string }> }>;
  defaultRow: () => T;
  getRowId?: (row: T, index: number) => string | number;
  emptyMessage?: string;
  maxRows?: number;
}

export function BulkTableEditor<T extends Record<string, any>>({
  columns,
  data,
  onDataChange,
  onSave,
  defaultRow,
  getRowId = (_, index) => index,
  emptyMessage = 'Henüz satır eklenmemiş',
  maxRows,
}: BulkTableEditorProps<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: number; errors: Array<{ row: number; error: string }> } | null>(null);

  const updateCell = useCallback((rowIndex: number, key: keyof T, value: any) => {
    const newData = [...data];
    const row = { ...newData[rowIndex] };
    row[key] = value;
    newData[rowIndex] = row;

    // Clear error for this cell
    const errorKey = `${rowIndex}-${String(key)}`;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });

    // Validate if column has validator
    const column = columns.find((col) => col.key === key);
    if (column?.validate) {
      const error = column.validate(value, row);
      if (error) {
        setErrors((prev) => ({ ...prev, [errorKey]: error }));
      }
    }

    onDataChange(newData);
  }, [data, columns, onDataChange]);

  const addRow = useCallback(() => {
    if (maxRows && data.length >= maxRows) {
      return;
    }
    onDataChange([...data, defaultRow()]);
    setSaveResult(null);
  }, [data, defaultRow, onDataChange, maxRows]);

  const removeRow = useCallback((index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onDataChange(newData);
    
    // Clear errors for removed row
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${index}-`)) {
          delete next[key];
        } else {
          // Adjust row indices for rows after removed one
          const [rowIdx, colKey] = key.split('-');
          const rowIndex = parseInt(rowIdx);
          if (rowIndex > index) {
            const newKey = `${rowIndex - 1}-${colKey}`;
            next[newKey] = next[key];
            delete next[key];
          }
        }
      });
      return next;
    });
    
    setSaveResult(null);
  }, [data, onDataChange]);

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    data.forEach((row, rowIndex) => {
      columns.forEach((column) => {
        const value = row[column.key];
        const errorKey = `${rowIndex}-${String(column.key)}`;
        
        // Required check
        if (column.required && (value === undefined || value === null || value === '')) {
          newErrors[errorKey] = 'Bu alan zorunludur';
          return;
        }
        
        // Custom validation
        if (column.validate) {
          const error = column.validate(value, row);
          if (error) {
            newErrors[errorKey] = error;
          }
        }
      });
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data, columns]);

  const handleSave = useCallback(async () => {
    if (data.length === 0) {
      return;
    }

    if (!validateAll()) {
      return;
    }

    setIsSaving(true);
    setSaveResult(null);
    
    try {
      const result = await onSave(data);
      setSaveResult(result);
      
      if (result.errors.length === 0) {
        // Clear data on successful save
        onDataChange([]);
        setErrors({});
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kayıt sırasında bir hata oluştu';
      setSaveResult({
        success: 0,
        errors: [{ row: 0, error: message }],
      });
    } finally {
      setIsSaving(false);
    }
  }, [data, validateAll, onSave, onDataChange]);

  const renderCell = (row: T, rowIndex: number, column: ColumnDef<T>) => {
    const value = row[column.key];
    const errorKey = `${rowIndex}-${String(column.key)}`;
    const error = errors[errorKey];

    // Custom render
    if (column.type === 'custom' && column.customRender) {
      const updateCellWrapper = (key: keyof T, value: any) => {
        updateCell(rowIndex, key, value);
      };
      return column.customRender(row, rowIndex, updateCellWrapper);
    }

    if (column.type === 'checkbox') {
      return (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => updateCell(rowIndex, column.key, e.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
        </div>
      );
    }

    if (column.type === 'select' && column.options) {
      return (
        <select
          value={value || ''}
          onChange={(e) => updateCell(rowIndex, column.key, e.target.value)}
          className={`w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            error ? 'border-destructive' : 'hover:border-primary/50'
          }`}
        >
          <option value="">{column.placeholder || 'Seçiniz...'}</option>
          {column.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (column.type === 'number') {
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => {
            const numValue = e.target.value === '' ? '' : Number(e.target.value);
            updateCell(rowIndex, column.key, numValue);
          }}
          placeholder={column.placeholder}
          className={error ? 'border-destructive' : ''}
        />
      );
    }

    // Default: text input
    return (
      <Input
        value={value || ''}
        onChange={(e) => updateCell(rowIndex, column.key, e.target.value)}
        placeholder={column.placeholder}
        className={error ? 'border-destructive' : ''}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button 
            onClick={addRow} 
            variant="outline" 
            size="sm" 
            disabled={maxRows ? data.length >= maxRows : false}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Satır Ekle
          </Button>
          {data.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {data.length} satır
              </Badge>
              {maxRows && (
                <span className="text-sm text-muted-foreground">
                  / {maxRows} maksimum
                </span>
              )}
            </div>
          )}
        </div>
        {data.length > 0 && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="lg"
            className="gap-2"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Tümünü Kaydet ({data.length})
              </>
            )}
          </Button>
        )}
      </div>

      {saveResult && (
        <Alert variant={saveResult.errors.length === 0 ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <div>
              <strong className="font-semibold">
                {saveResult.success > 0 
                  ? `✅ ${saveResult.success} kayıt başarıyla eklendi.` 
                  : '❌ Hiçbir kayıt eklenemedi.'}
              </strong>
            </div>
            {saveResult.errors.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <strong className="font-semibold">Hatalar ({saveResult.errors.length}):</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {saveResult.errors.map((err, idx) => (
                    <li key={idx} className="text-sm">
                      <strong>Satır {err.row + 1}:</strong> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="mb-4">{emptyMessage}</p>
          <Button onClick={addRow} variant="outline" size="lg">
            <Plus className="h-4 w-4 mr-2" />
            İlk Satırı Ekle
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[40px] text-center">#</TableHead>
                  {columns.map((column) => (
                    <TableHead key={String(column.key)} style={{ width: column.width }} className="min-w-[120px]">
                      <div className="flex items-center gap-1">
                        {column.header}
                        {column.required && <span className="text-destructive">*</span>}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-[60px] text-center">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow 
                    key={getRowId(row, rowIndex)}
                    className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                  >
                    <TableCell className="text-center text-muted-foreground font-medium">
                      {rowIndex + 1}
                    </TableCell>
                    {columns.map((column) => {
                      const errorKey = `${rowIndex}-${String(column.key)}`;
                      const error = errors[errorKey];
                      return (
                        <TableCell key={String(column.key)} className="p-2">
                          <div className="min-w-[120px]">
                            {renderCell(row, rowIndex, column)}
                            {error && (
                              <p className="text-xs text-destructive mt-1">{error}</p>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(rowIndex)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Satırı sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
