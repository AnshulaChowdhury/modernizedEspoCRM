import React from 'react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Number field component - read-only formatted sequence (e.g., "INV-001")
 * This is distinct from IntField which handles integer input.
 */
export function NumberField({
  value,
  className,
}: FieldProps): React.ReactElement {
  const displayValue = value != null ? String(value) : '';

  if (!displayValue) {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  return (
    <span className={cn('font-mono', className)}>
      {displayValue}
    </span>
  );
}
