/**
 * Test utilities for field components
 */
import React from 'react';
import { render, type RenderResult } from '@testing-library/react';
import type { FieldProps, FieldDef, FieldMode } from '../types';

/**
 * Default field props for testing
 */
export function createFieldProps(
  overrides: Partial<FieldProps> & { name?: string; value?: unknown } = {}
): FieldProps {
  return {
    name: 'testField',
    value: '',
    fieldDef: { type: 'varchar' },
    mode: 'detail',
    entityType: 'Account',
    record: {},
    onChange: undefined,
    disabled: false,
    readOnly: false,
    className: '',
    ...overrides,
  };
}

/**
 * Helper to render a field in different modes
 */
export function renderField(
  FieldComponent: React.ComponentType<FieldProps>,
  props: Partial<FieldProps> = {}
): RenderResult {
  const mergedProps = createFieldProps(props);
  return render(<FieldComponent {...mergedProps} />);
}

/**
 * Test all modes for a field component
 */
export async function testFieldModes(
  FieldComponent: React.ComponentType<FieldProps>,
  modes: FieldMode[],
  baseProps: Partial<FieldProps> = {}
) {
  const results: Record<string, RenderResult> = {};

  for (const mode of modes) {
    results[mode] = renderField(FieldComponent, { ...baseProps, mode });
  }

  return results;
}

// Note: createMockOnChange removed - use vi.fn() directly in tests

/**
 * Common field definitions for testing
 */
export const testFieldDefs: Record<string, FieldDef> = {
  varchar: { type: 'varchar' },
  varcharRequired: { type: 'varchar', required: true },
  varcharWithMaxLength: { type: 'varchar', maxLength: 100 },
  text: { type: 'text' },
  email: { type: 'email' },
  url: { type: 'url' },
  int: { type: 'int' },
  intWithRange: { type: 'int', min: 0, max: 100 },
  float: { type: 'float' },
  bool: { type: 'bool' },
  boolDefault: { type: 'bool', default: true },
  enum: { type: 'enum', options: ['Option1', 'Option2', 'Option3'] },
  enumRequired: { type: 'enum', options: ['Active', 'Inactive'], required: true },
  date: { type: 'date' },
  datetime: { type: 'datetime' },
  link: { type: 'link', entity: 'Account' },
  linkRequired: { type: 'link', entity: 'Contact', required: true },
  linkMultiple: { type: 'linkMultiple', entity: 'Contact' },
  currency: { type: 'currency' },
};

/**
 * Common test values
 */
export const testValues = {
  emptyString: '',
  sampleString: 'Test Value',
  longString: 'A'.repeat(200),
  sampleEmail: 'test@example.com',
  invalidEmail: 'not-an-email',
  sampleUrl: 'https://example.com',
  sampleInt: 42,
  sampleFloat: 99.99,
  sampleDate: '2024-12-31',
  sampleDatetime: '2024-12-31 10:30:00',
  sampleLinkId: 'acc-001',
  sampleLink: { id: 'acc-001', name: 'Acme Corp' },
  sampleLinks: [
    { id: 'con-001', name: 'John Doe' },
    { id: 'con-002', name: 'Jane Smith' },
  ],
};
