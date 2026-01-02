import React, { useMemo } from 'react';
import { FieldRenderer } from '@/fields';
import { InlineEditableField } from '@/fields/InlineEditableField';
import { useDynamicLogic } from '@/lib/dynamicLogic';
import type { FieldMode, FieldDef } from '@/fields/types';
import type { DetailLayout, LayoutPanel, LayoutCell, ListLayout } from './types';
import { cn } from '@/lib/utils/cn';

export interface LayoutRendererProps {
  /** Layout configuration (detail or list) */
  layout: DetailLayout | ListLayout;
  /** Layout type */
  type: 'detail' | 'list';
  /** Field definitions from metadata */
  fieldDefs: Record<string, FieldDef>;
  /** Record data */
  record: Record<string, unknown>;
  /** Entity type */
  entityType: string;
  /** Display mode */
  mode: FieldMode;
  /** Form values (for edit mode) */
  formData?: Record<string, unknown>;
  /** Change handler (for edit mode) */
  onChange?: (field: string, value: unknown) => void;
  /** Enable inline editing in detail mode */
  inlineEdit?: boolean;
  /** Handler for inline edit saves */
  onInlineEditSave?: (fieldName: string, value: unknown) => void;
  /** Fields currently being saved via inline edit */
  savingFields?: Set<string>;
  /** Additional CSS class */
  className?: string;
}

/**
 * LayoutRenderer - renders layouts based on JSON configuration
 */
export function LayoutRenderer({
  layout,
  type,
  fieldDefs,
  record,
  entityType,
  mode,
  formData,
  onChange,
  inlineEdit,
  onInlineEditSave,
  savingFields,
  className,
}: LayoutRendererProps): React.ReactElement {
  if (type === 'detail') {
    return (
      <DetailLayoutRenderer
        layout={layout as DetailLayout}
        fieldDefs={fieldDefs}
        record={record}
        entityType={entityType}
        mode={mode}
        formData={formData}
        onChange={onChange}
        inlineEdit={inlineEdit}
        onInlineEditSave={onInlineEditSave}
        savingFields={savingFields}
        className={className}
      />
    );
  }

  // List layout is handled differently (usually by table component)
  return (
    <ListLayoutRenderer
      layout={layout as ListLayout}
      fieldDefs={fieldDefs}
      record={record}
      entityType={entityType}
      className={className}
    />
  );
}

interface DetailLayoutRendererProps {
  layout: DetailLayout;
  fieldDefs: Record<string, FieldDef>;
  record: Record<string, unknown>;
  entityType: string;
  mode: FieldMode;
  formData?: Record<string, unknown>;
  onChange?: (field: string, value: unknown) => void;
  inlineEdit?: boolean;
  onInlineEditSave?: (fieldName: string, value: unknown) => void;
  savingFields?: Set<string>;
  className?: string;
}

/**
 * Renders a detail layout with panels and rows
 */
function DetailLayoutRenderer({
  layout,
  fieldDefs,
  record,
  entityType,
  mode,
  formData,
  onChange,
  inlineEdit,
  onInlineEditSave,
  savingFields,
  className,
}: DetailLayoutRendererProps): React.ReactElement {
  // Get current data for dynamic logic evaluation
  const currentData = useMemo(() => {
    return formData ? { ...record, ...formData } : record;
  }, [record, formData]);

  // Use dynamic logic to get field/panel states
  const {
    isFieldVisible,
    isFieldRequired,
    isFieldReadOnly,
    getFilteredOptions,
    getPanelState,
  } = useDynamicLogic({
    entityType,
    data: currentData,
  });

  // Group panels by tab
  const tabs: { label: string; panels: LayoutPanel[] }[] = [];
  let currentTab: { label: string; panels: LayoutPanel[] } = { label: '', panels: [] };

  for (const panel of layout) {
    if (panel.tabBreak && currentTab.panels.length > 0) {
      tabs.push(currentTab);
      currentTab = {
        label: panel.tabLabel ?? '',
        panels: [panel],
      };
    } else {
      currentTab.panels.push(panel);
    }
  }
  if (currentTab.panels.length > 0) {
    tabs.push(currentTab);
  }

  // Create dynamic logic object to pass down
  const dynamicLogic: DynamicLogicFunctions = {
    isFieldVisible,
    isFieldRequired,
    isFieldReadOnly,
    getFilteredOptions,
    getPanelState,
  };

  // If only one tab with no label, render panels directly
  const firstTab = tabs[0];
  if (tabs.length === 1 && firstTab && !firstTab.label) {
    return (
      <div className={cn('space-y-6', className)}>
        {firstTab.panels.map((panel, idx) => (
          <PanelRenderer
            key={panel.name ?? `panel-${idx}`}
            panel={panel}
            fieldDefs={fieldDefs}
            record={record}
            entityType={entityType}
            mode={mode}
            formData={formData}
            onChange={onChange}
            inlineEdit={inlineEdit}
            onInlineEditSave={onInlineEditSave}
            savingFields={savingFields}
            dynamicLogic={dynamicLogic}
          />
        ))}
      </div>
    );
  }

  // TODO: Implement tabbed layout
  // For now, render all panels in sequence
  return (
    <div className={cn('space-y-6', className)}>
      {layout.map((panel, idx) => (
        <PanelRenderer
          key={panel.name ?? `panel-${idx}`}
          panel={panel}
          fieldDefs={fieldDefs}
          record={record}
          entityType={entityType}
          mode={mode}
          formData={formData}
          onChange={onChange}
          inlineEdit={inlineEdit}
          onInlineEditSave={onInlineEditSave}
          savingFields={savingFields}
          dynamicLogic={dynamicLogic}
        />
      ))}
    </div>
  );
}

interface DynamicLogicFunctions {
  isFieldVisible: (fieldName: string) => boolean;
  isFieldRequired: (fieldName: string) => boolean;
  isFieldReadOnly: (fieldName: string) => boolean;
  getFilteredOptions: (fieldName: string) => string[] | undefined;
  getPanelState: (panelName: string) => { visible: boolean };
}

interface PanelRendererProps {
  panel: LayoutPanel;
  fieldDefs: Record<string, FieldDef>;
  record: Record<string, unknown>;
  entityType: string;
  mode: FieldMode;
  formData?: Record<string, unknown>;
  onChange?: (field: string, value: unknown) => void;
  inlineEdit?: boolean;
  onInlineEditSave?: (fieldName: string, value: unknown) => void;
  savingFields?: Set<string>;
  dynamicLogic: DynamicLogicFunctions;
}

/**
 * Renders a single panel with its rows
 */
function PanelRenderer({
  panel,
  fieldDefs,
  record,
  entityType,
  mode,
  formData,
  onChange,
  inlineEdit,
  onInlineEditSave,
  savingFields,
  dynamicLogic,
}: PanelRendererProps): React.ReactElement {
  const rows = panel.rows ?? [];
  const label = panel.customLabel ?? panel.label;
  const style = panel.style ?? 'default';

  const styleClasses: Record<string, string> = {
    default: 'border-border',
    success: 'border-green-200 bg-green-50',
    danger: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50',
  };

  // Check panel visibility (static hidden or dynamic logic)
  if (panel.hidden) {
    return <React.Fragment />;
  }

  // Check dynamic panel visibility
  if (panel.name) {
    const panelState = dynamicLogic.getPanelState(panel.name);
    if (!panelState.visible) {
      return <React.Fragment />;
    }
  }

  return (
    <div className={cn('rounded-lg border p-4', styleClasses[style])}>
      {label && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {label}
        </h3>
      )}
      <div className="space-y-4">
        {rows.map((row, rowIdx) => (
          <RowRenderer
            key={rowIdx}
            row={row}
            fieldDefs={fieldDefs}
            record={record}
            entityType={entityType}
            mode={mode}
            formData={formData}
            onChange={onChange}
            inlineEdit={inlineEdit}
            onInlineEditSave={onInlineEditSave}
            savingFields={savingFields}
            dynamicLogic={dynamicLogic}
          />
        ))}
      </div>
    </div>
  );
}

interface RowRendererProps {
  row: LayoutCell[];
  fieldDefs: Record<string, FieldDef>;
  record: Record<string, unknown>;
  entityType: string;
  mode: FieldMode;
  formData?: Record<string, unknown>;
  onChange?: (field: string, value: unknown) => void;
  inlineEdit?: boolean;
  onInlineEditSave?: (fieldName: string, value: unknown) => void;
  savingFields?: Set<string>;
  dynamicLogic: DynamicLogicFunctions;
}

/**
 * Renders a row of cells
 */
function RowRenderer({
  row,
  fieldDefs,
  record,
  entityType,
  mode,
  formData,
  onChange,
  inlineEdit,
  onInlineEditSave,
  savingFields,
  dynamicLogic,
}: RowRendererProps): React.ReactElement {
  // Filter out false cells and check for fullWidth
  const activeCells = row.filter((cell): cell is Exclude<LayoutCell, false> => cell !== false);

  if (activeCells.length === 0) {
    return <React.Fragment />;
  }

  // Check if any cell is fullWidth or if only one cell
  const isFullWidth = activeCells.length === 1 || activeCells.some(cell => cell.fullWidth);

  if (isFullWidth) {
    // Render cells stacked (full width)
    return (
      <div className="space-y-4">
        {activeCells.map((cell) => (
          <CellRenderer
            key={cell.name}
            cell={cell}
            fieldDefs={fieldDefs}
            record={record}
            entityType={entityType}
            mode={mode}
            formData={formData}
            onChange={onChange}
            inlineEdit={inlineEdit}
            onInlineEditSave={onInlineEditSave}
            savingFields={savingFields}
            dynamicLogic={dynamicLogic}
            fullWidth
          />
        ))}
      </div>
    );
  }

  // Render cells in a grid (typically 2 columns)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {row.map((cell, idx) => {
        if (cell === false) {
          return <div key={`empty-${idx}`} />;
        }
        return (
          <CellRenderer
            key={cell.name}
            cell={cell}
            fieldDefs={fieldDefs}
            record={record}
            entityType={entityType}
            mode={mode}
            formData={formData}
            onChange={onChange}
            inlineEdit={inlineEdit}
            onInlineEditSave={onInlineEditSave}
            savingFields={savingFields}
            dynamicLogic={dynamicLogic}
          />
        );
      })}
    </div>
  );
}

interface CellRendererProps {
  cell: Exclude<LayoutCell, false>;
  fieldDefs: Record<string, FieldDef>;
  record: Record<string, unknown>;
  entityType: string;
  mode: FieldMode;
  formData?: Record<string, unknown>;
  onChange?: (field: string, value: unknown) => void;
  inlineEdit?: boolean;
  onInlineEditSave?: (fieldName: string, value: unknown) => void;
  savingFields?: Set<string>;
  dynamicLogic: DynamicLogicFunctions;
  fullWidth?: boolean;
}

/**
 * Renders a single cell (field)
 */
function CellRenderer({
  cell,
  fieldDefs,
  record,
  entityType,
  mode,
  formData,
  onChange,
  inlineEdit,
  onInlineEditSave,
  savingFields,
  dynamicLogic,
  fullWidth,
}: CellRendererProps): React.ReactElement {
  const fieldDef = fieldDefs[cell.name];

  if (!fieldDef) {
    // Field not found in metadata, skip
    return <React.Fragment />;
  }

  // Check dynamic visibility
  if (!dynamicLogic.isFieldVisible(cell.name)) {
    return <React.Fragment />;
  }

  // Get dynamic logic state for this field
  const isDynamicallyRequired = dynamicLogic.isFieldRequired(cell.name);
  const isDynamicallyReadOnly = dynamicLogic.isFieldReadOnly(cell.name);
  const filteredOptions = dynamicLogic.getFilteredOptions(cell.name);

  // Merge field def with cell overrides and dynamic logic
  const mergedFieldDef: FieldDef = {
    ...fieldDef,
    ...cell.params,
    readOnly: cell.readOnly ?? fieldDef.readOnly ?? isDynamicallyReadOnly,
    required: fieldDef.required || isDynamicallyRequired,
    type: cell.type ?? fieldDef.type,
    // Apply filtered options if available
    ...(filteredOptions ? { options: filteredOptions } : {}),
  };

  // Get value from formData (edit mode) or record
  const value = formData?.[cell.name] ?? record[cell.name];

  // Get label
  const label = cell.labelText ?? cell.label ?? formatFieldLabel(cell.name);
  const showLabel = !cell.noLabel;

  // Use inline editable field in detail mode with inline edit enabled
  const useInlineEditable = mode === 'detail' && inlineEdit && onInlineEditSave;
  const isSaving = savingFields?.has(cell.name) ?? false;

  // Determine if field is effectively read-only
  const effectiveReadOnly = cell.readOnly ?? mergedFieldDef.readOnly ?? isDynamicallyReadOnly;

  return (
    <div className={cn(fullWidth && 'col-span-full')}>
      {showLabel && mode !== 'list' && (
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          {label}
          {mergedFieldDef.required && mode === 'edit' && (
            <span className="text-destructive ml-1">*</span>
          )}
        </label>
      )}
      {useInlineEditable ? (
        <InlineEditableField
          name={cell.name}
          value={value}
          fieldDef={mergedFieldDef}
          entityType={entityType}
          record={record}
          inlineEditEnabled={!effectiveReadOnly}
          isSaving={isSaving}
          onSave={onInlineEditSave}
          label={label}
        />
      ) : (
        <FieldRenderer
          name={cell.name}
          value={value}
          fieldDef={mergedFieldDef}
          mode={mode}
          entityType={entityType}
          record={record}
          onChange={(newValue) => onChange?.(cell.name, newValue)}
          readOnly={effectiveReadOnly}
        />
      )}
    </div>
  );
}

interface ListLayoutRendererProps {
  layout: ListLayout;
  fieldDefs: Record<string, FieldDef>;
  record: Record<string, unknown>;
  entityType: string;
  className?: string;
}

/**
 * Renders a list layout row (typically used in tables)
 */
function ListLayoutRenderer({
  layout,
  fieldDefs,
  record,
  entityType,
  className,
}: ListLayoutRendererProps): React.ReactElement {
  return (
    <div className={cn('flex gap-4', className)}>
      {layout.map((column) => {
        if (column.hidden) return null;

        const fieldDef = fieldDefs[column.name];
        if (!fieldDef) return null;

        const value = record[column.name];

        return (
          <div
            key={column.name}
            style={{ width: column.width ? `${column.width}%` : undefined }}
            className={cn(
              'flex-shrink-0',
              column.align === 'right' && 'text-right',
              column.align === 'center' && 'text-center',
              column.className
            )}
          >
            <FieldRenderer
              name={column.name}
              value={value}
              fieldDef={fieldDef}
              mode="list"
              entityType={entityType}
              record={record}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Format field name as a readable label
 */
function formatFieldLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export default LayoutRenderer;
