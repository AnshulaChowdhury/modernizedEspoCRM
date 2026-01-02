import React from 'react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Formula field component - read-only calculated value
 * The value is computed on the backend via EspoCRM formula engine.
 */
export function FormulaField({
  value,
  className,
}: FieldProps): React.ReactElement {
  // Formula fields can return various types - format appropriately
  const formatValue = (): string => {
    if (value == null) return '';

    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  };

  const displayValue = formatValue();

  if (!displayValue) {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  return <span className={className}>{displayValue}</span>;
}
