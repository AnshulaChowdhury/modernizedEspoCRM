/**
 * FormulaField Tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormulaField } from '../special/FormulaField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'formula' };
  return {
    name: 'calculated',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Order',
    ...overrides,
  };
}

describe('FormulaField', () => {
  describe('null and empty values', () => {
    it('shows dash for null value', () => {
      render(<FormulaField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for undefined value', () => {
      render(<FormulaField {...createFieldProps({ value: undefined })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for empty string', () => {
      render(<FormulaField {...createFieldProps({ value: '' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('number formatting', () => {
    it('formats integer numbers', () => {
      render(<FormulaField {...createFieldProps({ value: 12345 })} />);
      expect(screen.getByText('12,345')).toBeInTheDocument();
    });

    it('formats decimal numbers', () => {
      render(<FormulaField {...createFieldProps({ value: 1234.56 })} />);
      expect(screen.getByText('1,234.56')).toBeInTheDocument();
    });

    it('displays zero', () => {
      render(<FormulaField {...createFieldProps({ value: 0 })} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays negative numbers', () => {
      render(<FormulaField {...createFieldProps({ value: -1000 })} />);
      expect(screen.getByText('-1,000')).toBeInTheDocument();
    });

    it('formats large numbers', () => {
      render(<FormulaField {...createFieldProps({ value: 1000000000 })} />);
      expect(screen.getByText('1,000,000,000')).toBeInTheDocument();
    });
  });

  describe('boolean formatting', () => {
    it('displays "Yes" for true', () => {
      render(<FormulaField {...createFieldProps({ value: true })} />);
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('displays "No" for false', () => {
      render(<FormulaField {...createFieldProps({ value: false })} />);
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  describe('string values', () => {
    it('displays string values as-is', () => {
      render(<FormulaField {...createFieldProps({ value: 'Calculated Result' })} />);
      expect(screen.getByText('Calculated Result')).toBeInTheDocument();
    });

    it('displays numeric strings', () => {
      render(<FormulaField {...createFieldProps({ value: '42' })} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('other types', () => {
    it('converts object to string', () => {
      render(<FormulaField {...createFieldProps({ value: { key: 'value' } })} />);
      expect(screen.getByText('[object Object]')).toBeInTheDocument();
    });

    it('converts array to string', () => {
      render(<FormulaField {...createFieldProps({ value: [1, 2, 3] })} />);
      expect(screen.getByText('1,2,3')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className to value display', () => {
      const { container } = render(
        <FormulaField {...createFieldProps({ value: 'Test', className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom className to empty state', () => {
      const { container } = render(
        <FormulaField {...createFieldProps({ value: null, className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('read-only nature', () => {
    it('renders same output regardless of mode', () => {
      // Formula fields are always read-only, so mode doesn't matter
      const { rerender } = render(<FormulaField {...createFieldProps({ value: 100, mode: 'detail' })} />);
      expect(screen.getByText('100')).toBeInTheDocument();

      rerender(<FormulaField {...createFieldProps({ value: 100, mode: 'edit' })} />);
      expect(screen.getByText('100')).toBeInTheDocument();

      rerender(<FormulaField {...createFieldProps({ value: 100, mode: 'list' })} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});
