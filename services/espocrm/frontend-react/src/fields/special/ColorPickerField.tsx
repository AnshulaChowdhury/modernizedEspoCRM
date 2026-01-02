import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Palette } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

// Predefined color palette
const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#1e293b', '#ffffff',
];

/**
 * ColorPicker field component - color selection
 */
export function ColorPickerField({
  name,
  value,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const [showPalette, setShowPalette] = useState(false);
  const colorValue = typeof value === 'string' ? value : '';

  // Validate hex color
  const isValidColor = (color: string): boolean => {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
  };

  // Get contrasting text color (reserved for future use)
  const _getContrastColor = (hexColor: string): string => {
    if (!isValidColor(hexColor)) return '#000000';
    const hex = hexColor.replace('#', '');
    const h0 = hex[0] ?? '0';
    const h1 = hex[1] ?? '0';
    const h2 = hex[2] ?? '0';
    const r = parseInt(hex.length === 3 ? h0 + h0 : hex.slice(0, 2), 16);
    const g = parseInt(hex.length === 3 ? h1 + h1 : hex.slice(2, 4), 16);
    const b = parseInt(hex.length === 3 ? h2 + h2 : hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };
  void _getContrastColor;

  // Detail mode - color swatch with value
  if (mode === 'detail') {
    if (!colorValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className="w-6 h-6 rounded border shadow-sm"
          style={{ backgroundColor: colorValue }}
        />
        <span className="text-sm font-mono">{colorValue}</span>
      </div>
    );
  }

  // List mode - small swatch
  if (mode === 'list') {
    if (!colorValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div
        className={cn('w-5 h-5 rounded border shadow-sm', className)}
        style={{ backgroundColor: colorValue }}
        title={colorValue}
      />
    );
  }

  // Edit mode - color picker with palette
  if (mode === 'edit') {
    const handleColorChange = (newColor: string): void => {
      onChange?.(newColor);
    };

    return (
      <div className={cn('relative', className)}>
        <div className="flex items-center gap-2">
          {/* Color preview/button */}
          <button
            type="button"
            onClick={() => !disabled && !readOnly && setShowPalette(!showPalette)}
            className={cn(
              'w-10 h-10 rounded border-2 shadow-sm transition-all',
              'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring',
              (disabled || readOnly) && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              backgroundColor: colorValue || '#ffffff',
              borderColor: colorValue || '#e5e7eb',
            }}
            disabled={disabled || readOnly}
          >
            {!colorValue && <Palette className="h-4 w-4 text-muted-foreground m-auto" />}
          </button>

          {/* Hex input */}
          <Input
            name={name}
            value={colorValue}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="#000000"
            className="flex-1 font-mono"
            maxLength={7}
          />

          {/* Native color picker */}
          <input
            type="color"
            value={colorValue || '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled || readOnly}
            className={cn(
              'w-10 h-10 rounded cursor-pointer border-0 p-0',
              (disabled || readOnly) && 'opacity-50 cursor-not-allowed'
            )}
          />
        </div>

        {/* Color palette dropdown */}
        {showPalette && !disabled && !readOnly && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPalette(false)}
            />
            <div className="absolute z-20 top-12 left-0 p-2 bg-white rounded-lg shadow-lg border grid grid-cols-5 gap-1">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    handleColorChange(color);
                    setShowPalette(false);
                  }}
                  className={cn(
                    'w-6 h-6 rounded border shadow-sm hover:scale-110 transition-transform',
                    colorValue === color && 'ring-2 ring-ring ring-offset-1'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        name={name}
        value={colorValue}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="#000000"
        className={cn('font-mono', className)}
      />
    );
  }

  return (
    <div
      className="w-5 h-5 rounded border"
      style={{ backgroundColor: colorValue }}
    />
  );
}
