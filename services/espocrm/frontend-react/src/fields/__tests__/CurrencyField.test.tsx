import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { CurrencyField } from '../number/CurrencyField';
import { renderField } from './testUtils';

describe('CurrencyField', () => {
  describe('detail mode', () => {
    it('displays formatted currency with default USD', () => {
      renderField(CurrencyField, {
        value: 1234.56,
        mode: 'detail',
      });
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('displays currency from fieldDef', () => {
      renderField(CurrencyField, {
        value: 1000,
        mode: 'detail',
        fieldDef: { type: 'currency', currency: 'EUR' },
      });
      // EUR formatting varies by locale, but should contain the amount
      expect(screen.getByText(/1.*000/)).toBeInTheDocument();
    });

    it('handles CurrencyValue object', () => {
      renderField(CurrencyField, {
        value: { amount: 500, currency: 'GBP' },
        mode: 'detail',
      });
      expect(screen.getByText(/500/)).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(CurrencyField, {
        value: null,
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('handles string number value', () => {
      renderField(CurrencyField, {
        value: '999.99',
        mode: 'detail',
      });
      expect(screen.getByText('$999.99')).toBeInTheDocument();
    });

    it('uses currency from record field', () => {
      renderField(CurrencyField, {
        name: 'amount',
        value: 100,
        mode: 'detail',
        record: { amountCurrency: 'CAD' },
      });
      // Should use CAD from record
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    it('displays zero correctly', () => {
      renderField(CurrencyField, {
        value: 0,
        mode: 'detail',
      });
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays formatted currency', () => {
      renderField(CurrencyField, {
        value: 50.5,
        mode: 'list',
      });
      expect(screen.getByText('$50.50')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(CurrencyField, {
        value: null,
        mode: 'list',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders number input with currency symbol', () => {
      renderField(CurrencyField, {
        name: 'amount',
        value: 100,
        mode: 'edit',
      });
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(100);
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('shows currency from fieldDef', () => {
      renderField(CurrencyField, {
        name: 'amount',
        value: 100,
        mode: 'edit',
        fieldDef: { type: 'currency', currency: 'EUR' },
      });
      expect(screen.getByText('EUR')).toBeInTheDocument();
    });

    it('calls onChange with parsed float', () => {
      const onChange = vi.fn();
      renderField(CurrencyField, {
        name: 'amount',
        value: '',
        mode: 'edit',
        onChange,
      });

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '99.99' } });

      expect(onChange).toHaveBeenCalledWith(99.99);
    });

    it('calls onChange with null for empty value', () => {
      const onChange = vi.fn();
      renderField(CurrencyField, {
        name: 'amount',
        value: 100,
        mode: 'edit',
        onChange,
      });

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('has step of 0.01', () => {
      renderField(CurrencyField, {
        name: 'amount',
        value: 100,
        mode: 'edit',
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('step', '0.01');
    });

    it('can be disabled', () => {
      renderField(CurrencyField, {
        name: 'amount',
        value: 100,
        mode: 'edit',
        disabled: true,
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toBeDisabled();
    });

    it('can be read-only', () => {
      renderField(CurrencyField, {
        name: 'amount',
        value: 100,
        mode: 'edit',
        readOnly: true,
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('readOnly');
    });
  });

  describe('search mode', () => {
    it('renders number search input', () => {
      renderField(CurrencyField, {
        name: 'amount',
        value: '',
        mode: 'search',
      });

      expect(screen.getByPlaceholderText('Amount...')).toBeInTheDocument();
    });

    it('calls onChange when search value changes', () => {
      const onChange = vi.fn();
      renderField(CurrencyField, {
        name: 'amount',
        value: '',
        mode: 'search',
        onChange,
      });

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '500' } });

      expect(onChange).toHaveBeenCalledWith(500);
    });
  });
});
