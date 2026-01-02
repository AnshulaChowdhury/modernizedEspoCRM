import React from 'react';
import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Email field component
 */
export function EmailField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  // Email can be a string or an object with primary email
  const getEmailString = (val: unknown): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val !== null) {
      // Handle EspoCRM email format: array of {emailAddress, primary} or object
      if (Array.isArray(val)) {
        const primary = val.find((e: Record<string, unknown>) => e.primary);
        return (primary?.emailAddress as string) ?? (val[0]?.emailAddress as string) ?? '';
      }
      return '';
    }
    return '';
  };

  const emailValue = getEmailString(value);

  // Detail mode - display as mailto link
  if (mode === 'detail') {
    if (!emailValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <a
        href={`mailto:${emailValue}`}
        className={cn('text-primary hover:underline inline-flex items-center gap-1', className)}
      >
        <Mail className="h-4 w-4" />
        {emailValue}
      </a>
    );
  }

  // List mode - compact email link
  if (mode === 'list') {
    if (!emailValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <a
        href={`mailto:${emailValue}`}
        className={cn('text-primary hover:underline text-sm', className)}
      >
        {emailValue}
      </a>
    );
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          name={name}
          value={emailValue}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="email@example.com"
          className={cn('pl-10', className)}
        />
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        type="text"
        name={name}
        value={emailValue}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search email..."
        className={className}
      />
    );
  }

  return <span>{emailValue || '—'}</span>;
}
