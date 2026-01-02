import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Input } from '@/components/ui/input';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Date field component
 */
export function DateField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  // Parse and validate date
  const parseDate = (val: unknown): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return isValid(val) ? val : null;
    if (typeof val === 'string') {
      const parsed = parseISO(val);
      return isValid(parsed) ? parsed : null;
    }
    return null;
  };

  const dateValue = parseDate(value);
  const displayValue = dateValue ? format(dateValue, 'MMM d, yyyy') : '';
  const inputValue = dateValue ? format(dateValue, 'yyyy-MM-dd') : '';

  // Detail/List mode - display only
  if (mode === 'detail' || mode === 'list') {
    if (!dateValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return <span className={className}>{displayValue}</span>;
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <Input
        type="date"
        name={name}
        value={inputValue}
        onChange={(e) => {
          const val = e.target.value;
          if (!val) {
            onChange?.(null);
          } else {
            onChange?.(val); // Keep as ISO string
          }
        }}
        disabled={disabled}
        readOnly={readOnly}
        className={className}
      />
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        type="date"
        name={name}
        value={inputValue}
        onChange={(e) => {
          const val = e.target.value;
          onChange?.(val || null);
        }}
        className={className}
      />
    );
  }

  return <span>{displayValue}</span>;
}
