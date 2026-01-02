import React from 'react';
import { Square, CheckSquare } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

interface ChecklistItem {
  name: string;
  completed?: boolean;
}

/**
 * Checklist field component - list of checkable items
 */
export function ChecklistField({
  name: _name,
  value,
  fieldDef,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  void _name; // Field name available if needed
  // Parse checklist items
  let items: ChecklistItem[] = [];

  if (Array.isArray(value)) {
    // Array of items with completed status
    items = value as ChecklistItem[];
  } else if (typeof value === 'object' && value !== null) {
    // Object with item names as keys and boolean values
    items = Object.entries(value as Record<string, boolean>).map(([itemName, completed]) => ({
      name: itemName,
      completed,
    }));
  }

  // Get options from fieldDef if items are empty
  const options = fieldDef.options ?? [];
  if (items.length === 0 && options.length > 0) {
    items = options.map((opt) => ({ name: opt, completed: false }));
  }

  // Calculate completion stats
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Format item label
  const getLabel = (itemName: string): string => {
    return itemName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Detail mode - display checklist with completion status
  if (mode === 'detail') {
    if (items.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div className={cn('space-y-2', className)}>
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {item.completed ? (
                <CheckSquare className="h-4 w-4 text-green-600" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
              <span
                className={cn(
                  'text-sm',
                  item.completed && 'text-muted-foreground line-through'
                )}
              >
                {getLabel(item.name)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List mode - compact progress display
  if (mode === 'list') {
    if (items.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount}
        </span>
      </div>
    );
  }

  // Edit mode - interactive checklist
  if (mode === 'edit') {
    const handleToggle = (index: number): void => {
      const newItems = items.map((item, i) =>
        i === index ? { ...item, completed: !item.completed } : item
      );
      onChange?.(newItems);
    };

    return (
      <div className={cn('space-y-2 p-3 border rounded-md', className)}>
        {items.length === 0 ? (
          <span className="text-muted-foreground text-sm">No items</span>
        ) : (
          items.map((item, index) => (
            <label
              key={index}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                (disabled || readOnly) && 'cursor-not-allowed opacity-50'
              )}
            >
              <input
                type="checkbox"
                checked={item.completed ?? false}
                onChange={() => handleToggle(index)}
                disabled={disabled || readOnly}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span
                className={cn(
                  'text-sm',
                  item.completed && 'text-muted-foreground line-through'
                )}
              >
                {getLabel(item.name)}
              </span>
            </label>
          ))
        )}
      </div>
    );
  }

  // Search mode - not typically used
  if (mode === 'search') {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  return (
    <span>
      {completedCount}/{totalCount} completed
    </span>
  );
}
