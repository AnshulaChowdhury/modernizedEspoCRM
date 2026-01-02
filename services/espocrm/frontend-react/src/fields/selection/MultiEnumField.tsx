import React from 'react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * MultiEnum field component - multiple selection from options
 */
export function MultiEnumField({
  name,
  value,
  fieldDef,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  // Value is an array of strings
  const arrayValue: string[] = Array.isArray(value) ? value : [];
  const options = fieldDef.options ?? [];

  // Get display label for value
  const getLabel = (val: string): string => {
    return val
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Detail/List mode - display only
  if (mode === 'detail' || mode === 'list') {
    if (arrayValue.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {arrayValue.map((val) => (
          <span
            key={val}
            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
          >
            {getLabel(val)}
          </span>
        ))}
      </div>
    );
  }

  // Edit mode - multi-select with checkboxes
  if (mode === 'edit') {
    const handleToggle = (opt: string): void => {
      const newValue = arrayValue.includes(opt)
        ? arrayValue.filter((v) => v !== opt)
        : [...arrayValue, opt];
      onChange?.(newValue);
    };

    return (
      <div className={cn('space-y-2 rounded-md border p-3', className)}>
        {options.length === 0 ? (
          <span className="text-muted-foreground text-sm">No options available</span>
        ) : (
          options.map((opt) => (
            <label
              key={opt}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                (disabled || readOnly) && 'cursor-not-allowed opacity-50'
              )}
            >
              <input
                type="checkbox"
                checked={arrayValue.includes(opt)}
                onChange={() => handleToggle(opt)}
                disabled={disabled || readOnly}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">{getLabel(opt)}</span>
            </label>
          ))
        )}
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <select
        name={name}
        value={arrayValue[0] ?? ''}
        onChange={(e) => onChange?.(e.target.value ? [e.target.value] : [])}
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

  return <span>{arrayValue.map(getLabel).join(', ')}</span>;
}
