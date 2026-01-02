import React from 'react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Autoincrement field component - read-only auto-generated integer
 */
export function AutoincrementField({
  value,
  className,
}: FieldProps): React.ReactElement {
  const numValue = value != null ? Number(value) : null;
  const displayValue = numValue != null && !isNaN(numValue)
    ? numValue.toLocaleString()
    : '';

  if (numValue == null || isNaN(numValue)) {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  return <span className={className}>{displayValue}</span>;
}
