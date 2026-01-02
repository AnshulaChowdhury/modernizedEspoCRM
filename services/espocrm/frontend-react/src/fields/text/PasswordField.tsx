import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Password field component - masked input with show/hide toggle
 */
export function PasswordField({
  name,
  value,
  fieldDef,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const stringValue = value != null ? String(value) : '';

  // Detail/List mode - show masked value
  if (mode === 'detail' || mode === 'list') {
    if (!stringValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return <span className={className}>{'•'.repeat(Math.min(stringValue.length, 12))}</span>;
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <div className={cn('relative', className)}>
        <Input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={stringValue}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={fieldDef.maxLength}
          className="pr-10"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }

  // Search mode - typically not searchable
  return <span className={cn('text-muted-foreground', className)}>—</span>;
}
