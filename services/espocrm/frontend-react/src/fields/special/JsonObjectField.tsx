import React, { useState, useCallback, useMemo } from 'react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * JSON Object field component - display/edit JSON object data
 */
export function JsonObjectField({
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const [editText, setEditText] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parse value to object
  const objectValue = useMemo((): Record<string, unknown> => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Invalid JSON
      }
    }
    return {};
  }, [value]);

  // Format for display
  const displayText = useMemo(() => {
    const keys = Object.keys(objectValue);
    if (keys.length === 0) return '';
    return JSON.stringify(objectValue, null, 2);
  }, [objectValue]);

  const handleTextChange = useCallback((text: string) => {
    setEditText(text);
    setParseError(null);

    if (!text.trim()) {
      onChange?.({});
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        onChange?.(parsed);
      } else {
        setParseError('Value must be a JSON object');
      }
    } catch (e) {
      setParseError('Invalid JSON syntax');
    }
  }, [onChange]);

  // Detail mode - full display
  if (mode === 'detail') {
    const keys = Object.keys(objectValue);
    if (keys.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <pre className={cn('text-sm bg-muted p-2 rounded-md overflow-auto max-h-60', className)}>
        {displayText}
      </pre>
    );
  }

  // List mode - compact display
  if (mode === 'list') {
    const keys = Object.keys(objectValue);
    if (keys.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <span className={cn('font-mono text-sm', className)}>
        {'{'}
        {keys.length} {keys.length === 1 ? 'key' : 'keys'}
        {'}'}
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
          placeholder="{}"
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
