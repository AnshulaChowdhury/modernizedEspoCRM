import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, X, Search, Plus } from 'lucide-react';
import type { FieldProps, LinkValue } from '../types';
import { cn } from '@/lib/utils/cn';
import { useModal } from '@/components/modals';

/**
 * Link field component - single entity relationship
 */
export function LinkField({
  name,
  value,
  fieldDef,
  mode,
  record,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const { selectRecord, quickCreate } = useModal();
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Link field stores ID in `${name}Id` and name in `${name}Name`
  const linkId = (record?.[`${name}Id`] as string) ?? (value as LinkValue)?.id ?? '';
  const linkName = (record?.[`${name}Name`] as string) ?? (value as LinkValue)?.name ?? '';
  const entityType = fieldDef.entity ?? '';

  const handleSelect = useCallback(async () => {
    if (isSelectOpen) return;
    setIsSelectOpen(true);
    try {
      const selected = await selectRecord({
        entityType,
        multiple: false,
      });
      if (selected && !Array.isArray(selected)) {
        onChange?.({ id: selected.id, name: selected.name });
      }
    } catch {
      // Modal was closed
    } finally {
      setIsSelectOpen(false);
    }
  }, [entityType, selectRecord, onChange, isSelectOpen]);

  const handleQuickCreate = useCallback(async () => {
    try {
      const created = await quickCreate({
        entityType,
      });
      if (created) {
        onChange?.({ id: created.id, name: created.name });
      }
    } catch {
      // Modal was closed
    }
  }, [entityType, quickCreate, onChange]);

  const handleClear = useCallback(() => {
    onChange?.({ id: null, name: null });
  }, [onChange]);

  // Detail mode - display as link
  if (mode === 'detail') {
    if (!linkId || !linkName) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <Link
        to={`/${entityType}/view/${linkId}`}
        className={cn('text-primary hover:underline inline-flex items-center gap-1', className)}
      >
        {linkName}
        <ExternalLink className="h-3 w-3" />
      </Link>
    );
  }

  // List mode - compact link
  if (mode === 'list') {
    if (!linkId || !linkName) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <Link
        to={`/${entityType}/view/${linkId}`}
        className={cn('text-primary hover:underline', className)}
      >
        {linkName}
      </Link>
    );
  }

  // Edit mode - with record selection modal
  if (mode === 'edit') {
    if (!linkId) {
      return (
        <div className={cn('flex items-center gap-1', className)}>
          <button
            type="button"
            onClick={handleSelect}
            disabled={disabled || readOnly}
            className="flex-1 flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>Select {entityType}...</span>
            <Search className="h-4 w-4" />
          </button>
          {!disabled && !readOnly && (
            <button
              type="button"
              onClick={handleQuickCreate}
              className="p-2 hover:bg-accent rounded-md border border-input"
              title={`Create new ${entityType}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex-1 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
          <Link
            to={`/${entityType}/view/${linkId}`}
            className="text-primary hover:underline text-sm"
          >
            {linkName}
          </Link>
        </div>
        {!disabled && !readOnly && (
          <>
            <button
              type="button"
              onClick={handleSelect}
              className="p-2 hover:bg-accent rounded-md"
              title="Change"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-2 hover:bg-accent rounded-md"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <input
        type="text"
        name={name}
        value={linkName}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={`Search ${entityType}...`}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          className
        )}
      />
    );
  }

  return <span>{linkName || '—'}</span>;
}
