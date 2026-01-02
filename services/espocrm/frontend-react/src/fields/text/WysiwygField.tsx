import React from 'react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * WYSIWYG field component - rich text editor
 * Note: Uses a textarea for editing. For a full WYSIWYG experience,
 * integrate a library like TipTap, Slate, or Quill.
 */
export function WysiwygField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const stringValue = value != null ? String(value) : '';

  // Detail mode - render HTML content
  if (mode === 'detail') {
    if (!stringValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div
        className={cn('prose prose-sm max-w-none', className)}
        dangerouslySetInnerHTML={{ __html: stringValue }}
      />
    );
  }

  // List mode - strip HTML and show plain text preview
  if (mode === 'list') {
    if (!stringValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    // Strip HTML tags for list display
    const plainText = stringValue.replace(/<[^>]*>/g, '').trim();
    const preview = plainText.length > 100 ? `${plainText.slice(0, 100)}...` : plainText;

    return <span className={className}>{preview || '—'}</span>;
  }

  // Edit mode - textarea with basic formatting hint
  if (mode === 'edit') {
    return (
      <div className={cn('space-y-1', className)}>
        <textarea
          name={name}
          value={stringValue}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          rows={8}
          className={cn(
            'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[120px]'
          )}
          placeholder="Enter content... (HTML supported)"
        />
        <p className="text-xs text-muted-foreground">
          HTML formatting is supported
        </p>
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <input
        name={name}
        type="text"
        value={stringValue}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search content..."
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          className
        )}
      />
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: stringValue }} />;
}
