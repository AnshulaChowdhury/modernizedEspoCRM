import React, { useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Duration field component - displays/edits time duration (stored as seconds)
 */
export function DurationField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  // Value is stored in seconds
  const totalSeconds = typeof value === 'number' ? value : 0;

  // Parse into hours and minutes
  const { hours, minutes } = useMemo(() => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return { hours: h, minutes: m };
  }, [totalSeconds]);

  // Format display string
  const displayValue = useMemo(() => {
    if (totalSeconds === 0 && value == null) return '';

    const parts: string[] = [];
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0 || hours === 0) {
      parts.push(`${minutes}m`);
    }
    return parts.join(' ');
  }, [totalSeconds, hours, minutes, value]);

  const handleChange = useCallback((newHours: number, newMinutes: number) => {
    const newSeconds = (newHours * 3600) + (newMinutes * 60);
    onChange?.(newSeconds);
  }, [onChange]);

  // Detail/List mode - display formatted duration
  if (mode === 'detail' || mode === 'list') {
    if (value == null) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }
    return <span className={className}>{displayValue || '0m'}</span>;
  }

  // Edit mode - hours and minutes inputs
  if (mode === 'edit') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={hours}
            onChange={(e) => {
              const newHours = Math.max(0, parseInt(e.target.value, 10) || 0);
              handleChange(newHours, minutes);
            }}
            disabled={disabled}
            readOnly={readOnly}
            min={0}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">h</span>
        </div>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={minutes}
            onChange={(e) => {
              const newMinutes = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
              handleChange(hours, newMinutes);
            }}
            disabled={disabled}
            readOnly={readOnly}
            min={0}
            max={59}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">m</span>
        </div>
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        type="number"
        name={name}
        value={totalSeconds || ''}
        onChange={(e) => {
          const val = e.target.value;
          onChange?.(val ? parseInt(val, 10) : null);
        }}
        placeholder="Duration (seconds)..."
        className={className}
      />
    );
  }

  return <span>{displayValue || '—'}</span>;
}
