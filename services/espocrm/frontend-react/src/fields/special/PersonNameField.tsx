import React from 'react';
import { Input } from '@/components/ui/input';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

interface PersonNameValue {
  salutation?: string;
  firstName?: string;
  lastName?: string;
}

const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];

/**
 * PersonName field component - salutation + first + last name
 */
export function PersonNameField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  record,
  className,
}: FieldProps): React.ReactElement {
  // EspoCRM stores name parts as separate fields
  const salutation = (record?.salutationName ?? (value as PersonNameValue)?.salutation ?? '') as string;
  const firstName = (record?.firstName ?? (value as PersonNameValue)?.firstName ?? '') as string;
  const lastName = (record?.lastName ?? (value as PersonNameValue)?.lastName ?? '') as string;

  // Format full name
  const formatName = (): string => {
    const parts = [salutation, firstName, lastName].filter(Boolean);
    return parts.join(' ');
  };

  const fullName = formatName();

  // Detail/List mode - display formatted name
  if (mode === 'detail' || mode === 'list') {
    if (!fullName) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return <span className={className}>{fullName}</span>;
  }

  // Edit mode - three inputs
  if (mode === 'edit') {
    const handleChange = (field: keyof PersonNameValue, newValue: string): void => {
      const currentValue: PersonNameValue = {
        salutation,
        firstName,
        lastName,
      };
      onChange?.({
        ...currentValue,
        [field]: newValue,
      });
    };

    return (
      <div className={cn('flex gap-2', className)}>
        <select
          value={salutation}
          onChange={(e) => handleChange('salutation', e.target.value)}
          disabled={disabled || readOnly}
          className={cn(
            'h-10 rounded-md border border-input bg-background px-2 py-2 text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'w-20'
          )}
        >
          <option value="">—</option>
          {SALUTATIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Input
          value={firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="First Name"
          className="flex-1"
        />
        <Input
          value={lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="Last Name"
          className="flex-1"
        />
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        name={name}
        value={typeof value === 'string' ? value : fullName}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search name..."
        className={className}
      />
    );
  }

  return <span>{fullName || '—'}</span>;
}
