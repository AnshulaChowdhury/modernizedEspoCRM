import type { ReactElement } from 'react';

/**
 * Field display modes
 */
export type FieldMode = 'detail' | 'edit' | 'list' | 'search';

/**
 * Base field definition from metadata
 */
export interface FieldDef {
  type: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  default?: unknown;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
  optionsPath?: string;
  view?: string;
  params?: Record<string, unknown>;
  // Link field specific
  entity?: string;
  // Currency field specific
  currency?: string;
  // Enum field specific
  translation?: string;
}

/**
 * Props passed to all field components
 */
export interface FieldProps {
  /** Field name (key in record) */
  name: string;
  /** Current value */
  value: unknown;
  /** Field definition from metadata */
  fieldDef: FieldDef;
  /** Display mode */
  mode: FieldMode;
  /** Entity type for context */
  entityType: string;
  /** Full record data for context */
  record?: Record<string, unknown>;
  /** Callback when value changes (edit mode) */
  onChange?: (value: unknown) => void;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is read-only */
  readOnly?: boolean;
  /** Custom label text */
  label?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * Field component type
 */
export type FieldComponent = (props: FieldProps) => ReactElement | null;

/**
 * Link record structure
 */
export interface LinkValue {
  id: string;
  name?: string;
}

/**
 * Currency value structure
 */
export interface CurrencyValue {
  amount: number;
  currency: string;
}

/**
 * Address value structure
 */
export interface AddressValue {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}
