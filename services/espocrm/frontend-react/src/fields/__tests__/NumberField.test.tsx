/**
 * NumberField Tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NumberField } from '../number/NumberField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'number' };
  return {
    name: 'orderNumber',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Order',
    ...overrides,
  };
}

describe('NumberField', () => {
  describe('rendering', () => {
    it('shows dash for null value', () => {
      render(<NumberField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for undefined value', () => {
      render(<NumberField {...createFieldProps({ value: undefined })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for empty string', () => {
      render(<NumberField {...createFieldProps({ value: '' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays numeric value', () => {
      render(<NumberField {...createFieldProps({ value: 12345 })} />);
      expect(screen.getByText('12345')).toBeInTheDocument();
    });

    it('displays string value', () => {
      render(<NumberField {...createFieldProps({ value: 'INV-001' })} />);
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });

    it('displays sequence number', () => {
      render(<NumberField {...createFieldProps({ value: 'ORD-2024-00123' })} />);
      expect(screen.getByText('ORD-2024-00123')).toBeInTheDocument();
    });

    it('uses monospace font', () => {
      const { container } = render(<NumberField {...createFieldProps({ value: '12345' })} />);
      expect(container.querySelector('.font-mono')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      const { container } = render(
        <NumberField {...createFieldProps({ value: '12345', className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies className to empty state', () => {
      const { container } = render(
        <NumberField {...createFieldProps({ value: null, className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
