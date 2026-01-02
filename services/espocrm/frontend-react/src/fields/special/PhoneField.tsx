import React from 'react';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

interface PhoneData {
  phoneNumber?: string;
  type?: string;
  primary?: boolean;
}

/**
 * Phone field component - phone number with click-to-call
 */
export function PhoneField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  // Handle both string and array of phone data
  let phoneNumbers: PhoneData[] = [];

  if (Array.isArray(value)) {
    phoneNumbers = value as PhoneData[];
  } else if (typeof value === 'string' && value) {
    phoneNumbers = [{ phoneNumber: value, primary: true }];
  }

  const primaryPhone = phoneNumbers.find((p) => p.primary)?.phoneNumber ?? phoneNumbers[0]?.phoneNumber ?? '';

  // Format phone for display
  const formatPhone = (phone: string): string => {
    // Basic US phone formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  // Detail mode - display with click-to-call
  if (mode === 'detail') {
    if (phoneNumbers.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div className={cn('space-y-1', className)}>
        {phoneNumbers.map((phone, index) => (
          <div key={index} className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a
              href={`tel:${phone.phoneNumber}`}
              className="text-blue-600 hover:underline"
            >
              {formatPhone(phone.phoneNumber ?? '')}
            </a>
            {phone.type && (
              <span className="text-xs text-muted-foreground">({phone.type})</span>
            )}
            {phone.primary && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Primary</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // List mode - compact display
  if (mode === 'list') {
    if (!primaryPhone) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return (
      <a
        href={`tel:${primaryPhone}`}
        className={cn('text-blue-600 hover:underline', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {formatPhone(primaryPhone)}
      </a>
    );
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Phone className="h-4 w-4 text-muted-foreground" />
        <Input
          name={name}
          type="tel"
          value={primaryPhone}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="Enter phone number"
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
        type="tel"
        value={primaryPhone}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search phone..."
        className={className}
      />
    );
  }

  return <span>{formatPhone(primaryPhone)}</span>;
}
