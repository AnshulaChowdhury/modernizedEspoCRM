import React, { useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

interface RangeValue {
  from: number | null;
  to: number | null;
}

/**
 * Range Float field component - from/to float inputs
 */
export function RangeFloatField({
  name,
  value,
  fieldDef,
  mode,
  record,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  // Range values are stored as {name}From and {name}To
  const rangeValue = useMemo<RangeValue>(() => {
    if (typeof value === 'object' && value !== null) {
      const v = value as Record<string, unknown>;
      return {
        from: typeof v.from === 'number' ? v.from : null,
        to: typeof v.to === 'number' ? v.to : null,
      };
    }
    // Check record for individual fields
    const fromVal = record?.[`${name}From`];
    const toVal = record?.[`${name}To`];
    return {
      from: typeof fromVal === 'number' ? fromVal : null,
      to: typeof toVal === 'number' ? toVal : null,
    };
  }, [value, record, name]);

  const handleFromChange = useCallback((fromVal: number | null) => {
    onChange?.({ from: fromVal, to: rangeValue.to });
  }, [onChange, rangeValue.to]);

  const handleToChange = useCallback((toVal: number | null) => {
    onChange?.({ from: rangeValue.from, to: toVal });
  }, [onChange, rangeValue.from]);

  // Format number for display
  const formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  };

  // Format display string
  const displayValue = useMemo(() => {
    if (rangeValue.from == null && rangeValue.to == null) return '';
    if (rangeValue.from != null && rangeValue.to != null) {
      return `${formatNumber(rangeValue.from)} – ${formatNumber(rangeValue.to)}`;
    }
    if (rangeValue.from != null) {
      return `From ${formatNumber(rangeValue.from)}`;
    }
    return `To ${formatNumber(rangeValue.to!)}`;
  }, [rangeValue]);

  // Detail/List mode
  if (mode === 'detail' || mode === 'list') {
    if (!displayValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return <span className={className}>{displayValue}</span>;
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Input
          type="number"
          value={rangeValue.from ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            handleFromChange(val === '' ? null : parseFloat(val));
          }}
          disabled={disabled}
          readOnly={readOnly}
          min={fieldDef.min}
          max={fieldDef.max}
          step="any"
          placeholder="From"
          className="flex-1"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          value={rangeValue.to ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            handleToChange(val === '' ? null : parseFloat(val));
          }}
          disabled={disabled}
          readOnly={readOnly}
          min={fieldDef.min}
          max={fieldDef.max}
          step="any"
          placeholder="To"
          className="flex-1"
        />
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Input
          type="number"
          value={rangeValue.from ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            handleFromChange(val === '' ? null : parseFloat(val));
          }}
          step="any"
          placeholder="From"
          className="flex-1"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          value={rangeValue.to ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            handleToChange(val === '' ? null : parseFloat(val));
          }}
          step="any"
          placeholder="To"
          className="flex-1"
        />
      </div>
    );
  }

  return <span>{displayValue || '—'}</span>;
}
