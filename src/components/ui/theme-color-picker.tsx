'use client';

import { useTheme, ColorTheme } from '@/contexts/theme-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeColorPicker() {
  const { colorTheme, setColorTheme } = useTheme();

  const themes: { name: ColorTheme; label: string; color: string }[] = [
    { name: 'blue', label: 'Mavi', color: 'bg-blue-500' },
    { name: 'green', label: 'Yeşil', color: 'bg-emerald-500' },
    { name: 'violet', label: 'Mor', color: 'bg-violet-500' },
    { name: 'orange', label: 'Turuncu', color: 'bg-orange-500' },
    { name: 'rose', label: 'Gül', color: 'bg-rose-500' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
          <Palette className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
          <span className="sr-only">Renk Teması Seç</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => setColorTheme(theme.name)}
            className="cursor-pointer gap-2"
          >
            <div className={cn("h-4 w-4 rounded-full", theme.color, colorTheme === theme.name && "ring-2 ring-offset-2 ring-primary")} />
            <span className={cn(colorTheme === theme.name && "font-semibold")}>
              {theme.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
