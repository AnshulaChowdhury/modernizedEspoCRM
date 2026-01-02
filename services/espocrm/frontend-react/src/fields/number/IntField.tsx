import React from 'react';
import { Input } from '@/components/ui/input';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Integer field component
 */
export function IntField({
  name,
  value,
  fieldDef,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const numValue = value != null ? Number(value) : null;
  const displayValue = numValue != null && !isNaN(numValue)
    ? numValue.toLocaleString()
    : '';

  // Detail/List mode - display only
  if (mode === 'detail' || mode === 'list') {
    if (numValue == null || isNaN(numValue)) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return <span className={className}>{displayValue}</span>;
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <Input
        type="number"
        name={name}
        value={numValue ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '') {
            onChange?.(null);
          } else {
            const parsed = parseInt(val, 10);
            if (!isNaN(parsed)) {
              onChange?.(parsed);
            }
          }
        }}
        disabled={disabled}
        readOnly={readOnly}
        min={fieldDef.min}
        max={fieldDef.max}
        step={1}
        className={className}
      />
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        type="number"
        name={name}
        value={numValue ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '') {
            onChange?.(null);
          } else {
            const parsed = parseInt(val, 10);
            if (!isNaN(parsed)) {
              onChange?.(parsed);
            }
          }
        }}
        placeholder="Search..."
        className={className}
      />
    );
  }

  return <span>{displayValue}</span>;
}
