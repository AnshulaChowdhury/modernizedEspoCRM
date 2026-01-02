import React, { useState, useCallback } from 'react';
import { X, Plus, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * URL Multiple field component - multiple clickable URLs
 */
export function UrlMultipleField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const [newUrl, setNewUrl] = useState('');

  // Ensure value is an array
  const urlArray: string[] = Array.isArray(value) ? value : [];

  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (trimmed && !trimmed.match(/^https?:\/\//i)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleAdd = useCallback(() => {
    if (!newUrl.trim()) return;
    const normalized = normalizeUrl(newUrl);
    if (!urlArray.includes(normalized)) {
      onChange?.([...urlArray, normalized]);
    }
    setNewUrl('');
  }, [newUrl, urlArray, onChange]);

  const handleRemove = useCallback((index: number) => {
    onChange?.(urlArray.filter((_, i) => i !== index));
  }, [urlArray, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }, [handleAdd]);

  // Detail/List mode - display as clickable links
  if (mode === 'detail' || mode === 'list') {
    if (urlArray.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div className={cn(mode === 'list' ? '' : 'flex flex-col gap-1', className)}>
        {urlArray.map((url, index) => (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {url.replace(/^https?:\/\//, '')}
            <ExternalLink className="h-3 w-3" />
            {mode === 'list' && index < urlArray.length - 1 && ', '}
          </a>
        ))}
      </div>
    );
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Existing URLs */}
        {urlArray.length > 0 && (
          <div className="flex flex-col gap-1">
            {urlArray.map((url, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md bg-muted px-2 py-1"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-primary hover:underline truncate"
                >
                  {url}
                </a>
                {!disabled && !readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-0.5 hover:bg-destructive/20 rounded text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new URL */}
        {!disabled && !readOnly && (
          <div className="flex gap-2">
            <Input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAdd}
              disabled={!newUrl.trim()}
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
        placeholder="Search URLs..."
        className={className}
      />
    );
  }

  return <span>{urlArray.join(', ') || '—'}</span>;
}
