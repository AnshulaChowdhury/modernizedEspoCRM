import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Foreign field component - read-only value from a related entity
 * This displays a field value from a linked record (e.g., account.industry)
 */
export function ForeignField({
  value,
  fieldDef,
  mode,
  record,
  className,
}: FieldProps): React.ReactElement {
  // Foreign field shows value from related record
  // The link relationship and foreign field are defined in fieldDef
  const fieldDefAny = fieldDef as unknown as Record<string, unknown>;
  const linkName = fieldDefAny.link as string | undefined;

  // Get linked entity ID and type for navigation
  const linkedId = linkName ? (record?.[`${linkName}Id`] as string) : null;
  const linkedEntity = fieldDef.entity ?? '';

  const displayValue = value != null ? String(value) : '';

  if (!displayValue) {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  // In list/detail mode, show value with optional link to parent record
  if ((mode === 'detail' || mode === 'list') && linkedId && linkedEntity) {
    return (
      <Link
        to={`/${linkedEntity}/view/${linkedId}`}
        className={cn('text-primary hover:underline inline-flex items-center gap-1', className)}
      >
        {displayValue}
        {mode === 'detail' && <ExternalLink className="h-3 w-3" />}
      </Link>
    );
  }

  return <span className={className}>{displayValue}</span>;
}
