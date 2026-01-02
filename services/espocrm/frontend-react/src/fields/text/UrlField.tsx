import React from 'react';
import { Input } from '@/components/ui/input';
import { ExternalLink } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * URL field component - clickable link
 */
export function UrlField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const stringValue = value != null ? String(value) : '';

  // Ensure URL has protocol
  const getFullUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  // Get display text (domain only for cleaner display)
  const getDisplayText = (url: string): string => {
    try {
      const fullUrl = getFullUrl(url);
      const urlObj = new URL(fullUrl);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    } catch {
      return url;
    }
  };

  // Detail mode - clickable link
  if (mode === 'detail') {
    if (!stringValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <a
        href={getFullUrl(stringValue)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('text-blue-600 hover:underline inline-flex items-center gap-1', className)}
      >
        {getDisplayText(stringValue)}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  // List mode - compact link
  if (mode === 'list') {
    if (!stringValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <a
        href={getFullUrl(stringValue)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('text-blue-600 hover:underline', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {getDisplayText(stringValue)}
      </a>
    );
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Input
          name={name}
          type="url"
          value={stringValue}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="https://example.com"
          className="flex-1"
        />
        {stringValue && (
          <a
            href={getFullUrl(stringValue)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-blue-600"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        name={name}
        type="text"
        value={stringValue}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search URL..."
        className={className}
      />
    );
  }

  return <span>{stringValue}</span>;
}
