import React from 'react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Enum field component - single selection from options
 */
export function EnumField({
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
  const options = fieldDef.options ?? [];

  // Get display label for value (in real implementation, would use translation)
  const getLabel = (val: string): string => {
    // For now, just format the value nicely
    return val
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Detail/List mode - display only
  if (mode === 'detail' || mode === 'list') {
    if (!stringValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    // Optional: Add styling based on value (for status-like enums)
    const statusColors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      inProgress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      canceled: 'bg-gray-100 text-gray-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
    };

    const colorClass = statusColors[stringValue.toLowerCase()];

    if (colorClass && mode === 'list') {
      return (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', colorClass, className)}>
          {getLabel(stringValue)}
        </span>
      );
    }

    return <span className={className}>{getLabel(stringValue)}</span>;
  }

  // Edit mode - select dropdown
  if (mode === 'edit') {
    return (
      <select
        name={name}
        value={stringValue}
        onChange={(e) => onChange?.(e.target.value || null)}
        disabled={disabled || readOnly}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <option value="">— Select —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {getLabel(opt)}
          </option>
        ))}
      </select>
    );
  }

  // Search mode - select with "Any" option
  if (mode === 'search') {
    return (
      <select
        name={name}
        value={stringValue}
        onChange={(e) => onChange?.(e.target.value || null)}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          className
        )}
      >
        <option value="">Any</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {getLabel(opt)}
          </option>
        ))}
      </select>
    );
  }

  return <span>{getLabel(stringValue)}</span>;
}
