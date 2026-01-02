import React from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import type { FieldProps, AddressValue } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Address field component - multi-part address
 */
export function AddressField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  record,
  className,
}: FieldProps): React.ReactElement {
  // EspoCRM stores address parts as separate fields (e.g., billingAddressStreet)
  // Try to get parts from record or from value object
  const getAddressPart = (part: string): string => {
    // Check record for prefixed field names (e.g., billingAddressStreet)
    const prefixedField = `${name}${part.charAt(0).toUpperCase()}${part.slice(1)}`;
    if (record?.[prefixedField] != null) {
      return String(record[prefixedField]);
    }
    // Check value object
    if (typeof value === 'object' && value !== null) {
      const addressValue = value as AddressValue;
      return (addressValue[part as keyof AddressValue] as string) ?? '';
    }
    return '';
  };

  const street = getAddressPart('street');
  const city = getAddressPart('city');
  const state = getAddressPart('state');
  const postalCode = getAddressPart('postalCode');
  const country = getAddressPart('country');

  const hasAddress = street || city || state || postalCode || country;

  // Format address for display
  const formatAddress = (): string[] => {
    const lines: string[] = [];
    if (street) lines.push(street);
    const cityStateZip = [city, state, postalCode].filter(Boolean).join(', ');
    if (cityStateZip) lines.push(cityStateZip);
    if (country) lines.push(country);
    return lines;
  };

  // Build Google Maps URL
  const getMapUrl = (): string => {
    const parts = [street, city, state, postalCode, country].filter(Boolean);
    const query = encodeURIComponent(parts.join(', '));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // Detail mode - formatted display with map link
  if (mode === 'detail') {
    if (!hasAddress) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    const lines = formatAddress();
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            {lines.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        </div>
        <a
          href={getMapUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          View on Map
        </a>
      </div>
    );
  }

  // List mode - single line
  if (mode === 'list') {
    if (!hasAddress) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    const parts = [city, state, country].filter(Boolean);
    return <span className={className}>{parts.join(', ')}</span>;
  }

  // Edit mode - multiple inputs
  if (mode === 'edit') {
    const handleChange = (part: string, newValue: string): void => {
      const currentAddress: AddressValue = typeof value === 'object' && value !== null
        ? (value as AddressValue)
        : { street, city, state, postalCode, country };

      onChange?.({
        ...currentAddress,
        [part]: newValue,
      });
    };

    return (
      <div className={cn('space-y-2', className)}>
        <Input
          name={`${name}Street`}
          value={street}
          onChange={(e) => handleChange('street', e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="Street"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            name={`${name}City`}
            value={city}
            onChange={(e) => handleChange('city', e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="City"
          />
          <Input
            name={`${name}State`}
            value={state}
            onChange={(e) => handleChange('state', e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="State/Province"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            name={`${name}PostalCode`}
            value={postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Postal Code"
          />
          <Input
            name={`${name}Country`}
            value={country}
            onChange={(e) => handleChange('country', e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Country"
          />
        </div>
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        name={name}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search address..."
        className={className}
      />
    );
  }

  return <span>{formatAddress().join(', ')}</span>;
}
