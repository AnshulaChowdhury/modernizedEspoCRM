import React from 'react';
import { Link } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

interface LinkItem {
  id: string;
  name: string;
}

/**
 * LinkMultiple field component - multiple entity relationships
 */
export function LinkMultipleField({
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
  // LinkMultiple stores IDs in `${name}Ids` and names in `${name}Names`
  const linkIds = (record?.[`${name}Ids`] as string[]) ?? [];
  const linkNames = (record?.[`${name}Names`] as Record<string, string>) ?? {};
  const entityType = fieldDef.entity ?? '';

  // Build array of link items
  const items: LinkItem[] = linkIds.map((id) => ({
    id,
    name: linkNames[id] ?? id,
  }));

  // Alternative: value might be an array directly
  const valueArray = Array.isArray(value) ? value as LinkItem[] : items;

  // Detail mode - display as comma-separated links
  if (mode === 'detail') {
    if (valueArray.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {valueArray.map((item, index) => (
          <React.Fragment key={item.id}>
            <Link
              to={`/${entityType}/view/${item.id}`}
              className="text-primary hover:underline"
            >
              {item.name}
            </Link>
            {index < valueArray.length - 1 && <span className="text-muted-foreground">,</span>}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // List mode - compact display
  if (mode === 'list') {
    if (valueArray.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    const displayCount = 3;
    const displayItems = valueArray.slice(0, displayCount);
    const moreCount = valueArray.length - displayCount;

    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {displayItems.map((item, index) => (
          <React.Fragment key={item.id}>
            <Link
              to={`/${entityType}/view/${item.id}`}
              className="text-primary hover:underline text-sm"
            >
              {item.name}
            </Link>
            {index < displayItems.length - 1 && <span>,</span>}
          </React.Fragment>
        ))}
        {moreCount > 0 && (
          <span className="text-muted-foreground text-sm">+{moreCount} more</span>
        )}
      </div>
    );
  }

  // Edit mode - tag-style display with add/remove
  if (mode === 'edit') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-background">
          {valueArray.length === 0 && (
            <span className="text-muted-foreground text-sm">No {entityType} selected</span>
          )}
          {valueArray.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-sm"
            >
              {item.name}
              {!disabled && !readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const newItems = valueArray.filter((i) => i.id !== item.id);
                    onChange?.(newItems);
                  }}
                  className="hover:bg-secondary-foreground/10 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
        {!disabled && !readOnly && (
          <button
            type="button"
            onClick={() => {
              // TODO: Open entity selection modal
            }}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add {entityType}
          </button>
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
        placeholder={`Search ${entityType}...`}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          className
        )}
      />
    );
  }

  return <span>{valueArray.map((i) => i.name).join(', ') || '—'}</span>;
}
