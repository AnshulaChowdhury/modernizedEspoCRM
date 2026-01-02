/* eslint-disable react-hooks/static-components */
import React, { useMemo, memo } from 'react';
import { getFieldComponent, hasFieldType } from './registry';
import { VarcharField } from './text/VarcharField';
import type { FieldProps, FieldMode, FieldDef } from './types';
import { cn } from '@/lib/utils/cn';

export interface FieldRendererProps {
  /** Field name */
  name: string;
  /** Field value */
  value: unknown;
  /** Field definition from metadata */
  fieldDef: FieldDef;
  /** Display mode */
  mode: FieldMode;
  /** Entity type */
  entityType: string;
  /** Full record data */
  record?: Record<string, unknown>;
  /** Change handler for edit mode */
  onChange?: (value: unknown) => void;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is read-only */
  readOnly?: boolean;
  /** Custom label */
  label?: string;
  /** Additional CSS class */
  className?: string;
  /** Whether to show label */
  showLabel?: boolean;
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

/**
 * FieldRenderer - dynamically renders fields based on their type
 */
export function FieldRenderer({
  name,
  value,
  fieldDef,
  mode,
  entityType,
  record,
  onChange,
  disabled,
  readOnly,
  label,
  className,
  showLabel = false,
}: FieldRendererProps): React.ReactElement {
  const fieldType = fieldDef.type;

  const fieldProps: FieldProps = useMemo(() => ({
    name,
    value,
    fieldDef,
    mode,
    entityType,
    record,
    onChange,
    disabled: disabled ?? fieldDef.disabled,
    readOnly: readOnly ?? fieldDef.readOnly,
    label,
    className: showLabel ? undefined : className,
  }), [name, value, fieldDef, mode, entityType, record, onChange, disabled, readOnly, label, showLabel, className]);

  // Render the appropriate field component
  const renderedField = useMemo(() => {
    if (hasFieldType(fieldType)) {
      const Component = getFieldComponent(fieldType);
      if (Component) {
        return <Component {...fieldProps} />;
      }
    }
    // Fall back to varchar (text display)
    return <VarcharField {...fieldProps} />;
  }, [fieldType, fieldProps]);

  // If showing label, wrap in a label container
  if (showLabel && mode !== 'list') {
    const labelText = label ?? formatFieldLabel(name);
    const isRequired = fieldDef.required && mode === 'edit';

    return (
      <div className={cn('space-y-1', className)}>
        <label className="text-sm font-medium text-muted-foreground">
          {labelText}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </label>
        {renderedField}
      </div>
    );
  }

  return renderedField;
}

/**
 * Memoized FieldRenderer - prevents re-renders when props haven't changed.
 * Use this in list views or forms with many fields for better performance.
 */
export const MemoizedFieldRenderer = memo(FieldRenderer, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.name === nextProps.name &&
    prevProps.value === nextProps.value &&
    prevProps.mode === nextProps.mode &&
    prevProps.entityType === nextProps.entityType &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.fieldDef.type === nextProps.fieldDef.type &&
    prevProps.className === nextProps.className
  );
});

MemoizedFieldRenderer.displayName = 'MemoizedFieldRenderer';

export default FieldRenderer;
