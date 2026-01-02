import React from 'react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Text field component - multi-line text
 */
export function TextField({
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

  // Detail mode - display with preserved whitespace
  if (mode === 'detail') {
    if (!stringValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <div className={cn('whitespace-pre-wrap break-words', className)}>
        {stringValue}
      </div>
    );
  }

  // List mode - truncated display
  if (mode === 'list') {
    if (!stringValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    const truncated = stringValue.length > 100
      ? stringValue.substring(0, 100) + '...'
      : stringValue;
    return (
      <span className={cn('line-clamp-2', className)} title={stringValue}>
        {truncated}
      </span>
    );
  }

  // Edit mode
  if (mode === 'edit') {
    const rows = (fieldDef.params?.rows as number) ?? 4;
    return (
      <textarea
        name={name}
        value={stringValue}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        maxLength={fieldDef.maxLength}
        placeholder={fieldDef.params?.placeholder as string}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      />
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <input
        type="text"
        name={name}
        value={stringValue}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search..."
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          className
        )}
      />
    );
  }

  return <span>{stringValue}</span>;
}
