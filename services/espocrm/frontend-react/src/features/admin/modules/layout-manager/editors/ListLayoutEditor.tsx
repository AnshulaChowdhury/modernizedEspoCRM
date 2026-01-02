/**
 * ListLayoutEditor - Editor for list/listSmall layouts
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useTranslation } from '@/hooks/useTranslation';
import { layoutManagerApi } from '../api';
import { SortableFieldList, type SortableItem } from '../components/SortableFieldList';
import type { ListLayout, ListLayoutColumn, FieldItem } from '../types';

interface ListLayoutEditorProps {
  scope: string;
  type: 'list' | 'listSmall';
  onCancel?: () => void;
  onSave?: () => void;
}

const DEFAULT_WIDTH = 16;

export function ListLayoutEditor({
  scope,
  type,
  onCancel,
  onSave,
}: ListLayoutEditorProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { metadata } = useMetadata();
  const { translateField } = useTranslation();

  const [hasChanges, setHasChanges] = useState(false);
  const [enabledColumns, setEnabledColumns] = useState<ListLayoutColumn[]>([]);

  // Fetch current layout
  const { data: layout, isLoading, error } = useQuery({
    queryKey: ['layout', scope, type],
    queryFn: () => layoutManagerApi.getLayout<ListLayout>(scope, type),
    staleTime: 0, // Always refetch to get latest
  });

  // Initialize enabled columns when layout loads
  React.useEffect(() => {
    if (layout) {
      setEnabledColumns(layout);
    }
  }, [layout]);

  // Get all available fields from entity defs
  const allFields = useMemo(() => {
    const entityDefs = metadata?.entityDefs?.[scope];
    if (!entityDefs?.fields) return [];

    const fields: FieldItem[] = [];
    const fieldDefs = entityDefs.fields as Record<string, Record<string, unknown>>;

    for (const [name, def] of Object.entries(fieldDefs)) {
      // Skip disabled, utility, and layoutListDisabled fields
      if (def.disabled || def.utility || def.layoutListDisabled) {
        continue;
      }

      // Check layoutAvailabilityList
      const availabilityList = def.layoutAvailabilityList as string[] | undefined;
      if (availabilityList && !availabilityList.includes(type) && !availabilityList.includes('list')) {
        continue;
      }

      // Check layoutIgnoreList
      const ignoreList = def.layoutIgnoreList as string[] | undefined;
      if (ignoreList && (ignoreList.includes(type) || ignoreList.includes('list'))) {
        continue;
      }

      const fieldType = def.type as string;
      const fieldMeta = metadata?.fields?.[fieldType] as Record<string, unknown> | undefined;

      fields.push({
        name,
        label: translateField(scope, name),
        type: fieldType,
        isEnabled: enabledColumns.some(col => col.name === name),
        notSortable: fieldMeta?.notSortable as boolean | undefined,
      });
    }

    return fields.sort((a, b) => a.label.localeCompare(b.label));
  }, [metadata, scope, type, enabledColumns, translateField]);

  // Disabled fields (not in enabled list)
  const disabledFields = useMemo(() => {
    return allFields.filter(f => !f.isEnabled);
  }, [allFields]);

  // Convert enabled columns to sortable items
  const enabledItems: SortableItem[] = useMemo(() => {
    return enabledColumns.map(col => {
      const { name, ...rest } = col;
      return {
        name,
        label: translateField(scope, name),
        ...rest,
      };
    });
  }, [enabledColumns, scope, translateField]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => layoutManagerApi.saveLayout(scope, type, enabledColumns),
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

  const handleReorder = useCallback((items: SortableItem[]) => {
    setEnabledColumns(items.map(item => ({
      name: item.name,
      width: (item.width as number) || DEFAULT_WIDTH,
      link: item.link as boolean | undefined,
      notSortable: item.notSortable as boolean | undefined,
      align: item.align as 'left' | 'right' | 'center' | undefined,
    })));
    setHasChanges(true);
  }, []);

  const handleRemove = useCallback((name: string) => {
    setEnabledColumns(prev => prev.filter(col => col.name !== name));
    setHasChanges(true);
  }, []);

  const handleAddField = useCallback((field: FieldItem) => {
    if (enabledColumns.some(col => col.name === field.name)) return;

    setEnabledColumns(prev => [
      ...prev,
      {
        name: field.name,
        width: DEFAULT_WIDTH,
        notSortable: field.notSortable,
      },
    ]);
    setHasChanges(true);
  }, [enabledColumns]);

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
      setEnabledColumns(layout);
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
        <button
          onClick={handleReset}
          disabled={resetMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </button>
      </div>

      {/* Editor grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enabled columns */}
        <SortableFieldList
          items={enabledItems}
          onReorder={handleReorder}
          onRemove={handleRemove}
          title="Enabled Columns"
          emptyMessage="No columns enabled. Click fields on the right to add them."
          showEditButton={true}
        />

        {/* Available fields */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Available Fields</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {disabledFields.length === 0 ? (
              <p className="text-sm text-gray-500 italic">All fields are enabled</p>
            ) : (
              disabledFields.map(field => (
                <button
                  key={field.name}
                  onClick={() => handleAddField(field)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <span className="truncate">{field.label}</span>
                  {field.notSortable && (
                    <span className="text-xs text-gray-400 ml-auto">(not sortable)</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

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

export default ListLayoutEditor;
