import React from 'react';
import { Input } from '@/components/ui/input';
import type { FieldProps, CurrencyValue } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Currency field component - number with currency symbol
 */
export function CurrencyField({
  name,
  value,
  fieldDef,
  mode,
  onChange,
  disabled,
  readOnly,
  record,
  className,
}: FieldProps): React.ReactElement {
  // Handle both simple number values and CurrencyValue objects
  let amount: number | null = null;
  let currency = fieldDef.currency ?? 'USD';

  if (typeof value === 'object' && value !== null) {
    const currencyValue = value as CurrencyValue;
    amount = currencyValue.amount ?? null;
    currency = currencyValue.currency ?? currency;
  } else if (typeof value === 'number') {
    amount = value;
  } else if (typeof value === 'string' && value !== '') {
    amount = parseFloat(value);
  }

  // Check for currency field in record (e.g., amountCurrency for amount field)
  const currencyFieldName = `${name}Currency`;
  if (record?.[currencyFieldName]) {
    currency = String(record[currencyFieldName]);
  }

  // Format currency for display
  const formatCurrency = (val: number | null): string => {
    if (val === null || isNaN(val)) return '';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    } catch {
      // Fallback for unknown currencies
      return `${currency} ${val.toFixed(2)}`;
    }
  };

  // Detail/List mode - display only
  if (mode === 'detail' || mode === 'list') {
    if (amount === null) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return <span className={className}>{formatCurrency(amount)}</span>;
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-muted-foreground">{currency}</span>
        <Input
          name={name}
          type="number"
          step="0.01"
          value={amount ?? ''}
          onChange={(e) => {
            const newAmount = e.target.value === '' ? null : parseFloat(e.target.value);
            onChange?.(newAmount);
          }}
          disabled={disabled}
          readOnly={readOnly}
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
        type="number"
        step="0.01"
        value={amount ?? ''}
        onChange={(e) => {
          const newAmount = e.target.value === '' ? null : parseFloat(e.target.value);
          onChange?.(newAmount);
        }}
        placeholder="Amount..."
        className={className}
      />
    );
  }

  return <span>{formatCurrency(amount)}</span>;
}
