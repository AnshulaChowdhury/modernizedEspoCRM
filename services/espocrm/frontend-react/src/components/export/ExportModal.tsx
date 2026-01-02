import React, { useState, useMemo, useCallback } from 'react';
import { Download, X, FileSpreadsheet, FileText, Check } from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { FieldDef } from '@/fields/types';

interface ExportModalProps {
  entityType: string;
  /** Selected record IDs (for exporting specific records) */
  selectedIds?: string[];
  /** Current filters (for exporting filtered results) */
  filters?: unknown[];
  /** Callback to close modal */
  onClose: () => void;
  className?: string;
}

type ExportFormat = 'csv' | 'xlsx';

export function ExportModal({
  entityType,
  selectedIds,
  filters,
  onClose,
  className,
}: ExportModalProps): React.ReactElement {
  const { metadata } = useMetadata();
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Get exportable fields from metadata
  const exportableFields = useMemo(() => {
    const fieldDefs = metadata?.entityDefs?.[entityType]?.fields ?? {};
    const result: Array<{ name: string; def: FieldDef }> = [];

    for (const [name, def] of Object.entries(fieldDefs)) {
      const fieldDef = def as FieldDef & { exportDisabled?: boolean; notStorable?: boolean };

      // Skip fields that can't be exported
      if (fieldDef.exportDisabled) continue;
      if (fieldDef.notStorable) continue;

      result.push({ name, def: fieldDef });
    }

    // Sort by name
    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [metadata, entityType]);

  // Initialize selected fields with common fields
  useMemo(() => {
    if (selectedFields.size === 0 && exportableFields.length > 0) {
      const defaultFields = new Set<string>();
      const commonFields = ['name', 'id', 'createdAt', 'modifiedAt'];

      for (const field of exportableFields) {
        if (commonFields.includes(field.name) || field.def.required) {
          defaultFields.add(field.name);
        }
      }

      // If no common fields, select first 5
      if (defaultFields.size === 0) {
        exportableFields.slice(0, 5).forEach((f) => defaultFields.add(f.name));
      }

      setSelectedFields(defaultFields);
    }
  }, [exportableFields, selectedFields.size]);

  // Toggle field selection
  const toggleField = useCallback((fieldName: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  }, []);

  // Select all fields
  const selectAllFields = useCallback(() => {
    setSelectedFields(new Set(exportableFields.map((f) => f.name)));
  }, [exportableFields]);

  // Deselect all fields
  const deselectAllFields = useCallback(() => {
    setSelectedFields(new Set());
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    if (selectedFields.size === 0) {
      setExportError('Please select at least one field to export');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      // Build export URL
      const params = new URLSearchParams();
      params.set('format', format);
      params.set('fieldList', Array.from(selectedFields).join(','));

      if (selectedIds && selectedIds.length > 0) {
        params.set('ids', selectedIds.join(','));
      } else if (filters && filters.length > 0) {
        params.set('where', JSON.stringify(filters));
      }

      // Trigger download via API
      const exportUrl = `/${entityType}/action/export?${params.toString()}`;

      // Create a temporary link to download
      const response = await fetch(`/api/v1${exportUrl}`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${localStorage.getItem('espo-auth-token') ?? ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [entityType, format, selectedFields, selectedIds, filters, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={cn(
          'bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            Export {entityType}
            {selectedIds && selectedIds.length > 0 && (
              <span className="text-muted-foreground font-normal ml-2">
                ({selectedIds.length} selected)
              </span>
            )}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Format selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <div className="flex gap-4">
              <button
                onClick={() => setFormat('csv')}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors',
                  format === 'csv'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">CSV</div>
                  <div className="text-xs text-muted-foreground">
                    Comma-separated values
                  </div>
                </div>
                {format === 'csv' && (
                  <Check className="h-4 w-4 text-primary ml-auto" />
                )}
              </button>

              <button
                onClick={() => setFormat('xlsx')}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors',
                  format === 'xlsx'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <FileSpreadsheet className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Excel</div>
                  <div className="text-xs text-muted-foreground">
                    Microsoft Excel format
                  </div>
                </div>
                {format === 'xlsx' && (
                  <Check className="h-4 w-4 text-primary ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Field selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Fields to Export</label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllFields}>
                  Select all
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAllFields}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-2">
                {exportableFields.map((field) => (
                  <label
                    key={field.name}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-muted/50',
                      selectedFields.has(field.name) && 'bg-primary/5'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.has(field.name)}
                      onChange={() => toggleField(field.name)}
                      className="rounded"
                    />
                    <span className="text-sm truncate">
                      {formatFieldName(field.name)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              {selectedFields.size} of {exportableFields.length} fields selected
            </div>
          </div>

          {/* Error */}
          {exportError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {exportError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || selectedFields.size === 0}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export default ExportModal;
