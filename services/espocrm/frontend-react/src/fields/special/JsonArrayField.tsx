import React, { useState, useCallback, useMemo } from 'react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * JSON Array field component - display/edit JSON array data
 */
export function JsonArrayField({
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const [editText, setEditText] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parse value to array
  const arrayValue = useMemo((): unknown[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Invalid JSON
      }
    }
    return [];
  }, [value]);

  // Format for display
  const displayText = useMemo(() => {
    if (arrayValue.length === 0) return '';
    return JSON.stringify(arrayValue, null, 2);
  }, [arrayValue]);

  const handleTextChange = useCallback((text: string) => {
    setEditText(text);
    setParseError(null);

    if (!text.trim()) {
      onChange?.([]);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        onChange?.(parsed);
      } else {
        setParseError('Value must be a JSON array');
      }
    } catch (e) {
      setParseError('Invalid JSON syntax');
    }
  }, [onChange]);

  // Detail/List mode
  if (mode === 'detail') {
    if (arrayValue.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <pre className={cn('text-sm bg-muted p-2 rounded-md overflow-auto max-h-60', className)}>
        {displayText}
      </pre>
    );
  }

  if (mode === 'list') {
    if (arrayValue.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <span className={cn('font-mono text-sm', className)}>
        [{arrayValue.length} items]
      </span>
    );
  }

  // Edit mode
  if (mode === 'edit') {
    const currentText = editText ?? displayText;

    return (
      <div className={cn('space-y-1', className)}>
        <textarea
          value={currentText}
          onChange={(e) => handleTextChange(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="[]"
          rows={6}
          className={cn(
            'w-full font-mono text-sm rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
            parseError ? 'border-red-500' : 'border-gray-300'
          )}
        />
        {parseError && (
          <p className="text-sm text-red-600">{parseError}</p>
        )}
      </div>
    );
  }

  // Search mode - not typically searchable
  return <span className={cn('text-muted-foreground', className)}>—</span>;
}
