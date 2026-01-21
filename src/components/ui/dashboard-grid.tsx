'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { dashboardPreferencesApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import type { WidgetConfig, DashboardLayout } from '@/types';

interface DashboardGridProps {
  widgets: WidgetConfig[];
  layout: DashboardLayout;
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  onLayoutChange: (layout: DashboardLayout) => void;
  isEditMode: boolean;
  onEditModeChange: (editMode: boolean) => void;
  renderWidget: (widget: WidgetConfig) => React.ReactNode;
}

interface SortableWidgetProps {
  widget: WidgetConfig;
  isEditMode: boolean;
  children: React.ReactNode;
}

// Sortable widget wrapper
function SortableWidget({ widget, isEditMode, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-50 opacity-50",
        isEditMode && "cursor-move"
      )}
      {...attributes}
      {...(isEditMode ? listeners : {})}
    >
      {isEditMode && (
        <div className="absolute -top-2 -left-2 z-10 bg-background border rounded-full p-1 shadow-md">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      )}

      {children}
    </div>
  );
}

// Widget container component
function WidgetContainer({
  widget,
  isEditMode,
  onToggleVisibility,
  children
}: {
  widget: WidgetConfig;
  isEditMode: boolean;
  onToggleVisibility: (widgetId: string, visible: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn(
      "h-full transition-all duration-200",
      !widget.visible && "opacity-50",
      isEditMode && "ring-2 ring-primary/20"
    )}>
      {widget.title && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{widget.title}</CardTitle>
            {isEditMode && (
              <div className="flex items-center gap-2">
                <Label htmlFor={`widget-${widget.id}-visible`} className="text-xs">
                  Görünür
                </Label>
                <Switch
                  id={`widget-${widget.id}-visible`}
                  checked={widget.visible}
                  onCheckedChange={(checked) => onToggleVisibility(widget.id, checked)}
                />
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={widget.title ? "pt-0" : "pt-6"}>
        {children}
      </CardContent>
    </Card>
  );
}

// Main dashboard grid component
export function DashboardGrid({
  widgets,
  layout,
  onWidgetsChange,
  onLayoutChange,
  isEditMode,
  onEditModeChange,
  renderWidget
}: DashboardGridProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate grid columns based on layout
  const gridCols = `grid-cols-${layout.columns}`;

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((widget) => widget.id === active.id);
      const newIndex = widgets.findIndex((widget) => widget.id === over.id);

      const newWidgets = arrayMove(widgets, oldIndex, newIndex);
      onWidgetsChange(newWidgets);
    }
  }

  // Toggle widget visibility
  function handleToggleVisibility(widgetId: string, visible: boolean) {
    const newWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, visible } : widget
    );
    onWidgetsChange(newWidgets);
  }

  // Save preferences
  const savePreferences = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await dashboardPreferencesApi.update({
        widgets,
        layout
      });
      onEditModeChange(false);
    } catch (error) {
      console.error('Failed to save dashboard preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Edit mode controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => onEditModeChange(!isEditMode)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            {isEditMode ? 'Düzenlemeyi Bitir' : 'Dashboard Düzenle'}
          </Button>

          {isEditMode && (
            <Badge variant="secondary" className="text-xs">
              Widget'ları sürükleyip düzenleyebilirsiniz
            </Badge>
          )}
        </div>

        {isEditMode && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditModeChange(false)}
              disabled={isSaving}
            >
              İptal
            </Button>
            <Button
              size="sm"
              onClick={savePreferences}
              disabled={isSaving}
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        )}
      </div>

      {/* Dashboard grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div
            className={cn(
              "grid gap-6",
              gridCols,
              layout.columns >= 4 && "lg:grid-cols-4",
              layout.columns === 3 && "lg:grid-cols-3",
              layout.columns === 2 && "lg:grid-cols-2",
              layout.columns === 1 && "grid-cols-1"
            )}
            style={{
              padding: layout.padding,
              gap: layout.gap
            }}
          >
            {widgets
              .filter(widget => isEditMode || widget.visible)
              .map((widget) => (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  isEditMode={isEditMode}
                >
                  <div
                    className={cn(
                      "col-span-1",
                      widget.size.width > 1 && `col-span-${Math.min(widget.size.width, layout.columns)}`
                    )}
                    style={{
                      gridRow: `span ${widget.size.height}`
                    }}
                  >
                    <WidgetContainer
                      widget={widget}
                      isEditMode={isEditMode}
                      onToggleVisibility={handleToggleVisibility}
                    >
                      {renderWidget(widget)}
                    </WidgetContainer>
                  </div>
                </SortableWidget>
              ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}