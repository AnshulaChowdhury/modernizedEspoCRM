import React from 'react';
import { Input } from '@/components/ui/input';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Varchar field component - single line text
 */
export function VarcharField({
  name,
  value,
  fieldDef,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const stringValue = value != null ? String(value) : '';

  // Detail/List mode - display only
  if (mode === 'detail' || mode === 'list') {
    if (!stringValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return <span className={className}>{stringValue}</span>;
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <Input
        name={name}
        value={stringValue}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={fieldDef.maxLength}
        placeholder={fieldDef.params?.placeholder as string}
        className={className}
      />
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        name={name}
        value={stringValue}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search..."
        className={className}
      />
    );
  }

  return <span>{stringValue}</span>;
}
