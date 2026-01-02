import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Input } from '@/components/ui/input';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * DateTime field component
 */
export function DateTimeField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  // Parse and validate datetime
  const parseDateTime = (val: unknown): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return isValid(val) ? val : null;
    if (typeof val === 'string') {
      const parsed = parseISO(val);
      return isValid(parsed) ? parsed : null;
    }
    return null;
  };

  const dateValue = parseDateTime(value);
  const displayValue = dateValue ? format(dateValue, 'MMM d, yyyy h:mm a') : '';
  const listDisplayValue = dateValue ? format(dateValue, 'MMM d, yyyy') : '';
  const inputValue = dateValue ? format(dateValue, "yyyy-MM-dd'T'HH:mm") : '';

  // Detail mode - display with time
  if (mode === 'detail') {
    if (!dateValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return <span className={className}>{displayValue}</span>;
  }

  // List mode - compact display (date only or short time)
  if (mode === 'list') {
    if (!dateValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <span className={className} title={displayValue}>
        {listDisplayValue}
      </span>
    );
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <Input
        type="datetime-local"
        name={name}
        value={inputValue}
        onChange={(e) => {
          const val = e.target.value;
          if (!val) {
            onChange?.(null);
          } else {
            // Convert to ISO string
            const date = new Date(val);
            onChange?.(date.toISOString());
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
        type="datetime-local"
        name={name}
        value={inputValue}
        onChange={(e) => {
          const val = e.target.value;
          if (!val) {
            onChange?.(null);
          } else {
            const date = new Date(val);
            onChange?.(date.toISOString());
          }
        }}
        className={className}
      />
    );
  }

  return <span>{displayValue}</span>;
}
