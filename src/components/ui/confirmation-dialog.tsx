'use client';

import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  warnings: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  warnings,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Uyarılar:
            </p>
            <ul className="space-y-2">
              {warnings.map((warning, idx) => (
                <li
                  key={idx}
                  className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2"
                >
                  <span className="text-amber-500 mt-0.5">⚠️</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Bu uyarıları göz ardı ederek devam etmek istiyor musun?
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Yine de Devam Et
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
