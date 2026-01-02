/**
 * DetailLayoutEditor - Editor for detail/detailSmall layouts with panels and grids
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Loader2,
  Save,
  RotateCcw,
  AlertCircle,
  Plus,
  X,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils/cn';
import { layoutManagerApi } from '../api';
import type {
  DetailLayout,
  DetailLayoutPanel,
  DetailLayoutCell,
  DetailLayoutRow,
  FieldItem,
} from '../types';

interface DetailLayoutEditorProps {
  scope: string;
  type: 'detail' | 'detailSmall';
  onCancel?: () => void;
  onSave?: () => void;
}

const COLUMN_COUNT = 2;

// Panel Component
interface PanelEditorProps {
  panel: DetailLayoutPanel;
  panelIndex: number;
  onRemove: (index: number) => void;
  onAddRow: (panelIndex: number) => void;
  onRemoveRow: (panelIndex: number, rowIndex: number) => void;
  onRemoveCell: (panelIndex: number, rowIndex: number, cellIndex: number) => void;
  translateField: (scope: string, field: string) => string;
  scope: string;
  availableFields: FieldItem[];
  onAddField: (panelIndex: number, rowIndex: number, cellIndex: number, fieldName: string) => void;
}

function PanelEditor({
  panel,
  panelIndex,
  onRemove,
  onAddRow,
  onRemoveRow,
  onRemoveCell,
  translateField,
  scope,
  availableFields,
  onAddField,
}: PanelEditorProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `panel-${panelIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const panelLabel = panel.customLabel || panel.label || `Panel ${panelIndex + 1}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white border border-gray-200 rounded-lg overflow-hidden',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        <span className="font-medium text-gray-700 flex-1">{panelLabel}</span>
        <button
          onClick={() => onAddRow(panelIndex)}
          className="p-1 text-gray-400 hover:text-blue-600 rounded"
          title="Add Row"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => onRemove(panelIndex)}
          className="p-1 text-gray-400 hover:text-red-600 rounded"
          title="Remove Panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Panel content */}
      {!isCollapsed && (
        <div className="p-4 space-y-2">
          {panel.rows.map((row, rowIndex) => (
            <RowEditor
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              panelIndex={panelIndex}
              onRemoveRow={onRemoveRow}
              onRemoveCell={onRemoveCell}
              translateField={translateField}
              scope={scope}
              availableFields={availableFields}
              onAddField={onAddField}
            />
          ))}
          {panel.rows.length === 0 && (
            <p className="text-sm text-gray-500 italic text-center py-4">
              No rows. Click + to add a row.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Row Component
interface RowEditorProps {
  row: DetailLayoutRow;
  rowIndex: number;
  panelIndex: number;
  onRemoveRow: (panelIndex: number, rowIndex: number) => void;
  onRemoveCell: (panelIndex: number, rowIndex: number, cellIndex: number) => void;
  translateField: (scope: string, field: string) => string;
  scope: string;
  availableFields: FieldItem[];
  onAddField: (panelIndex: number, rowIndex: number, cellIndex: number, fieldName: string) => void;
}

function RowEditor({
  row,
  rowIndex,
  panelIndex,
  onRemoveRow,
  onRemoveCell,
  translateField,
  scope,
  availableFields,
  onAddField,
}: RowEditorProps): React.ReactElement {
  return (
    <div className="flex items-stretch gap-2 group">
      <div className="flex items-center">
        <button
          onClick={() => onRemoveRow(panelIndex, rowIndex)}
          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove Row"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2">
        {Array.from({ length: COLUMN_COUNT }).map((_, cellIndex) => {
          const cell = row[cellIndex];
          return (
            <CellEditor
              key={cellIndex}
              cell={cell}
              cellIndex={cellIndex}
              rowIndex={rowIndex}
              panelIndex={panelIndex}
              onRemoveCell={onRemoveCell}
              translateField={translateField}
              scope={scope}
              availableFields={availableFields}
              onAddField={onAddField}
            />
          );
        })}
      </div>
    </div>
  );
}

// Cell Component
interface CellEditorProps {
  cell: DetailLayoutCell | boolean | undefined;
  cellIndex: number;
  rowIndex: number;
  panelIndex: number;
  onRemoveCell: (panelIndex: number, rowIndex: number, cellIndex: number) => void;
  translateField: (scope: string, field: string) => string;
  scope: string;
  availableFields: FieldItem[];
  onAddField: (panelIndex: number, rowIndex: number, cellIndex: number, fieldName: string) => void;
}

function CellEditor({
  cell,
  cellIndex,
  rowIndex,
  panelIndex,
  onRemoveCell,
  translateField,
  scope,
  availableFields,
  onAddField,
}: CellEditorProps): React.ReactElement {
  const [showDropdown, setShowDropdown] = useState(false);

  // Check if cell is empty (false, undefined, or not an object with name)
  if (!cell || typeof cell !== 'object' || !('name' in cell)) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full h-10 border-2 border-dashed border-gray-200 rounded-md text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center"
        >
          <Plus className="h-4 w-4" />
        </button>
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
            {availableFields.map(field => (
              <button
                key={field.name}
                onClick={() => {
                  onAddField(panelIndex, rowIndex, cellIndex, field.name);
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {field.label}
              </button>
            ))}
            {availableFields.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-500 italic">No fields available</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md group/cell">
      <span className="flex-1 text-sm truncate">
        {translateField(scope, cell.name)}
      </span>
      <button
        onClick={() => onRemoveCell(panelIndex, rowIndex, cellIndex)}
        className="p-0.5 text-gray-400 hover:text-red-500 opacity-0 group-hover/cell:opacity-100 transition-opacity"
        title="Remove"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// Main Editor Component
export function DetailLayoutEditor({
  scope,
  type,
  onCancel,
  onSave,
}: DetailLayoutEditorProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { metadata } = useMetadata();
  const { translateField } = useTranslation();

  const [hasChanges, setHasChanges] = useState(false);
  const [panels, setPanels] = useState<DetailLayoutPanel[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch current layout
  const { data: layout, isLoading, error } = useQuery({
    queryKey: ['layout', scope, type],
    queryFn: () => layoutManagerApi.getLayout<DetailLayout>(scope, type),
    staleTime: 0,
  });

  // Initialize panels when layout loads
  React.useEffect(() => {
    if (layout) {
      setPanels(layout);
    }
  }, [layout]);

  // Get enabled field names
  const enabledFieldNames = useMemo(() => {
    const names = new Set<string>();
    panels.forEach(panel => {
      panel.rows.forEach(row => {
        row.forEach(cell => {
          if (cell && typeof cell === 'object' && 'name' in cell && cell.name) {
            names.add(cell.name);
          }
        });
      });
    });
    return names;
  }, [panels]);

  // Get all available fields from entity defs
  const allFields = useMemo(() => {
    const entityDefs = metadata?.entityDefs?.[scope];
    if (!entityDefs?.fields) return [];

    const fields: FieldItem[] = [];
    const fieldDefs = entityDefs.fields as Record<string, Record<string, unknown>>;

    for (const [name, def] of Object.entries(fieldDefs)) {
      if (def.disabled || def.utility || def.layoutDetailDisabled) {
        continue;
      }

      const availabilityList = def.layoutAvailabilityList as string[] | undefined;
      if (availabilityList && !availabilityList.includes(type) && !availabilityList.includes('detail')) {
        continue;
      }

      const ignoreList = def.layoutIgnoreList as string[] | undefined;
      if (ignoreList && (ignoreList.includes(type) || ignoreList.includes('detail'))) {
        continue;
      }

      fields.push({
        name,
        label: translateField(scope, name),
        type: def.type as string,
        isEnabled: enabledFieldNames.has(name),
      });
    }

    return fields.sort((a, b) => a.label.localeCompare(b.label));
  }, [metadata, scope, type, enabledFieldNames, translateField]);

  // Available fields (not enabled)
  const availableFields = useMemo(() => {
    return allFields.filter(f => !f.isEnabled);
  }, [allFields]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => layoutManagerApi.saveLayout(scope, type, panels),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layout', scope, type] });
      setHasChanges(false);
      onSave?.();
    },
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: () => layoutManagerApi.resetToDefault(scope, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layout', scope, type] });
      setHasChanges(false);
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = panels.findIndex((_, i) => `panel-${i}` === active.id);
      const newIndex = panels.findIndex((_, i) => `panel-${i}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setPanels(arrayMove(panels, oldIndex, newIndex));
        setHasChanges(true);
      }
    }
  };

  const handleAddPanel = useCallback(() => {
    setPanels(prev => [
      ...prev,
      {
        label: '',
        rows: [[false, false]],
      },
    ]);
    setHasChanges(true);
  }, []);

  const handleRemovePanel = useCallback((index: number) => {
    setPanels(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  }, []);

  const handleAddRow = useCallback((panelIndex: number) => {
    setPanels(prev => {
      const newPanels = [...prev];
      const panel = newPanels[panelIndex];
      if (!panel) return prev;
      newPanels[panelIndex] = {
        ...panel,
        rows: [...panel.rows, [false, false]],
      };
      return newPanels;
    });
    setHasChanges(true);
  }, []);

  const handleRemoveRow = useCallback((panelIndex: number, rowIndex: number) => {
    setPanels(prev => {
      const newPanels = [...prev];
      const panel = newPanels[panelIndex];
      if (!panel) return prev;
      newPanels[panelIndex] = {
        ...panel,
        rows: panel.rows.filter((_, i) => i !== rowIndex),
      };
      return newPanels;
    });
    setHasChanges(true);
  }, []);

  const handleRemoveCell = useCallback((panelIndex: number, rowIndex: number, cellIndex: number) => {
    setPanels(prev => {
      const newPanels = [...prev];
      const panel = newPanels[panelIndex];
      if (!panel) return prev;
      const newRows = [...panel.rows];
      const row = newRows[rowIndex];
      if (!row) return prev;
      const newRow = [...row];
      newRow[cellIndex] = false;
      newRows[rowIndex] = newRow;
      newPanels[panelIndex] = { ...panel, rows: newRows };
      return newPanels;
    });
    setHasChanges(true);
  }, []);

  const handleAddField = useCallback((panelIndex: number, rowIndex: number, cellIndex: number, fieldName: string) => {
    setPanels(prev => {
      const newPanels = [...prev];
      const panel = newPanels[panelIndex];
      if (!panel) return prev;
      const newRows = [...panel.rows];
      const row = newRows[rowIndex];
      if (!row) return prev;
      const newRow = [...row];
      newRow[cellIndex] = { name: fieldName };
      newRows[rowIndex] = newRow;
      newPanels[panelIndex] = { ...panel, rows: newRows };
      return newPanels;
    });
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleReset = () => {
    if (confirm('Reset this layout to default? This cannot be undone.')) {
      resetMutation.mutate();
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    if (layout) {
      setPanels(layout);
    }
    setHasChanges(false);
    onCancel?.();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Failed to load layout</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddPanel}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add Panel
          </button>
          <button
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Panels editor */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={panels.map((_, i) => `panel-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {panels.map((panel, index) => (
              <PanelEditor
                key={index}
                panel={panel}
                panelIndex={index}
                onRemove={handleRemovePanel}
                onAddRow={handleAddRow}
                onRemoveRow={handleRemoveRow}
                onRemoveCell={handleRemoveCell}
                translateField={translateField}
                scope={scope}
                availableFields={availableFields}
                onAddField={handleAddField}
              />
            ))}
            {panels.length === 0 && (
              <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500 mb-4">No panels. Click "Add Panel" to create one.</p>
                <button
                  onClick={handleAddPanel}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Panel
                </button>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Status messages */}
      {saveMutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Failed to save layout. Please try again.
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          Layout saved successfully.
        </div>
      )}
    </div>
  );
}

export default DetailLayoutEditor;
