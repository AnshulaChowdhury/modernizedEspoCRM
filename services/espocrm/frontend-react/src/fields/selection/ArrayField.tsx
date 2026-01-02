import React, { useState, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Array field component - string array with add/remove functionality
 */
export function ArrayField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const [newItem, setNewItem] = useState('');

  // Ensure value is an array
  const arrayValue: string[] = Array.isArray(value) ? value : [];

  const handleAdd = useCallback(() => {
    if (!newItem.trim()) return;
    const newArray = [...arrayValue, newItem.trim()];
    onChange?.(newArray);
    setNewItem('');
  }, [newItem, arrayValue, onChange]);

  const handleRemove = useCallback((index: number) => {
    const newArray = arrayValue.filter((_, i) => i !== index);
    onChange?.(newArray);
  }, [arrayValue, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }, [handleAdd]);

  // Detail/List mode - display as comma-separated list
  if (mode === 'detail' || mode === 'list') {
    if (arrayValue.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    if (mode === 'list') {
      return <span className={className}>{arrayValue.join(', ')}</span>;
    }

    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {arrayValue.map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-sm"
          >
            {item}
          </span>
        ))}
      </div>
    );
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Existing items */}
        {arrayValue.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {arrayValue.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-md bg-muted pl-2 pr-1 py-1 text-sm"
              >
                {item}
                {!disabled && !readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-0.5 hover:bg-destructive/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Add new item */}
        {!disabled && !readOnly && (
          <div className="flex gap-2">
            <Input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add item..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAdd}
              disabled={!newItem.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        type="text"
        name={name}
        value={Array.isArray(value) ? value.join(', ') : String(value ?? '')}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search..."
        className={className}
      />
    );
  }

  return <span>{arrayValue.join(', ') || '—'}</span>;
}
