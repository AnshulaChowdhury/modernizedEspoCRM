/**
 * AutoincrementField Tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AutoincrementField } from '../number/AutoincrementField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'autoincrement' };
  return {
    name: 'orderNumber',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Order',
    ...overrides,
  };
}

describe('AutoincrementField', () => {
  describe('rendering', () => {
    it('shows dash for null value', () => {
      render(<AutoincrementField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for undefined value', () => {
      render(<AutoincrementField {...createFieldProps({ value: undefined })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for NaN value', () => {
      render(<AutoincrementField {...createFieldProps({ value: NaN })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for non-numeric string', () => {
      render(<AutoincrementField {...createFieldProps({ value: 'abc' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays numeric value', () => {
      render(<AutoincrementField {...createFieldProps({ value: 12345 })} />);
      expect(screen.getByText('12,345')).toBeInTheDocument();
    });

    it('displays string number value', () => {
      render(<AutoincrementField {...createFieldProps({ value: '67890' })} />);
      expect(screen.getByText('67,890')).toBeInTheDocument();
    });

    it('formats large numbers with locale', () => {
      render(<AutoincrementField {...createFieldProps({ value: 1234567890 })} />);
      expect(screen.getByText('1,234,567,890')).toBeInTheDocument();
    });

    it('displays zero correctly', () => {
      render(<AutoincrementField {...createFieldProps({ value: 0 })} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays negative numbers', () => {
      render(<AutoincrementField {...createFieldProps({ value: -100 })} />);
      expect(screen.getByText('-100')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className to value display', () => {
      const { container } = render(
        <AutoincrementField {...createFieldProps({ value: 123, className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom className to empty state', () => {
      const { container } = render(
        <AutoincrementField {...createFieldProps({ value: null, className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('read-only behavior', () => {
    it('is always read-only (no edit mode support)', () => {
      // AutoincrementField is always read-only, it just displays the value
      // regardless of mode passed
      render(<AutoincrementField {...createFieldProps({ value: 100, mode: 'edit' })} />);
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows same display in list mode', () => {
      render(<AutoincrementField {...createFieldProps({ value: 100, mode: 'list' })} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});
