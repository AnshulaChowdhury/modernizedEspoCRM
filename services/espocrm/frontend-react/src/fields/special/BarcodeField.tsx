import React from 'react';
import { Input } from '@/components/ui/input';
import { Barcode, Copy, Check } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

/**
 * Barcode field component - barcode display and input
 *
 * Note: For actual barcode rendering, integrate a library like:
 * - JsBarcode (https://github.com/lindell/JsBarcode)
 * - react-barcode (https://github.com/kciter/react-barcode)
 *
 * This component provides a styled display with copy functionality.
 */
export function BarcodeField({
  name,
  value,
  fieldDef,
  mode,
  onChange,
  disabled,
  readOnly,
  className,
}: FieldProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);
  const stringValue = value != null ? String(value) : '';

  // Get barcode type from field definition
  const barcodeType = (fieldDef.params?.codeType as string) ?? 'CODE128';

  // Copy to clipboard
  const handleCopy = async (): Promise<void> => {
    if (!stringValue) return;
    try {
      await navigator.clipboard.writeText(stringValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Detail mode - barcode display with copy
  if (mode === 'detail') {
    if (!stringValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div className={cn('space-y-2', className)}>
        {/* Barcode visual representation */}
        <div className="inline-block p-3 bg-white border rounded-md">
          {/* Simple barcode-like visual using CSS */}
          <div className="flex items-end justify-center gap-px h-12 mb-1">
            {stringValue.split('').map((char, i) => {
              // Generate pseudo-random bar widths based on character
              const charCode = char.charCodeAt(0);
              const width = ((charCode % 3) + 1) * 2;
              const height = 40 + (charCode % 10);
              return (
                <div
                  key={i}
                  className="bg-black"
                  style={{
                    width: `${width}px`,
                    height: `${height}px`,
                  }}
                />
              );
            })}
          </div>
          <div className="text-center font-mono text-sm tracking-wider">
            {stringValue}
          </div>
        </div>

        {/* Code value with copy button */}
        <div className="flex items-center gap-2">
          <Barcode className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{stringValue}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-blue-600 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <span className="text-xs text-muted-foreground">({barcodeType})</span>
        </div>
      </div>
    );
  }

  // List mode - compact display
  if (mode === 'list') {
    if (!stringValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <span className={cn('font-mono text-sm inline-flex items-center gap-1', className)}>
        <Barcode className="h-3 w-3" />
        {stringValue}
      </span>
    );
  }

  // Edit mode - text input with barcode icon
  if (mode === 'edit') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Barcode className="h-4 w-4 text-muted-foreground" />
        <Input
          name={name}
          value={stringValue}
          onChange={(e) => onChange?.(e.target.value.toUpperCase())}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="Enter barcode..."
          className="flex-1 font-mono uppercase"
        />
        {stringValue && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-blue-600"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        name={name}
        value={stringValue}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search barcode..."
        className={cn('font-mono', className)}
      />
    );
  }

  return <span className="font-mono">{stringValue || '—'}</span>;
}
