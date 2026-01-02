import React from 'react';
import { Check, X } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Boolean field component
 */
export function BoolField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const boolValue = Boolean(value);

  // Detail mode - display with icon
  if (mode === 'detail') {
    return (
      <span className={cn('flex items-center gap-1', className)}>
        {boolValue ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span>Yes</span>
          </>
        ) : (
          <>
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">No</span>
          </>
        )}
      </span>
    );
  }

  // List mode - compact icon only
  if (mode === 'list') {
    return (
      <span className={className}>
        {boolValue ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground" />
        )}
      </span>
    );
  }

  // Edit mode - checkbox
  if (mode === 'edit') {
    return (
      <label className={cn('flex items-center gap-2 cursor-pointer', className)}>
        <input
          type="checkbox"
          name={name}
          checked={boolValue}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled || readOnly}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="text-sm">{boolValue ? 'Yes' : 'No'}</span>
      </label>
    );
  }

  // Search mode - three-state select
  if (mode === 'search') {
    return (
      <select
        name={name}
        value={value === null || value === undefined ? '' : String(boolValue)}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '') {
            onChange?.(null);
          } else {
            onChange?.(val === 'true');
          }
        }}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          className
        )}
      >
        <option value="">Any</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  return <span>{boolValue ? 'Yes' : 'No'}</span>;
}
