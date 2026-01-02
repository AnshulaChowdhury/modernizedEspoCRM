import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { FloatField } from '../number/FloatField';
import { renderField, testValues } from './testUtils';

describe('FloatField', () => {
  describe('detail mode', () => {
    it('displays formatted float with default 2 decimal places', () => {
      renderField(FloatField, {
        value: 1234.5,
        mode: 'detail',
      });
      expect(screen.getByText('1,234.50')).toBeInTheDocument();
    });

    it('displays value with custom decimal places', () => {
      renderField(FloatField, {
        value: 99.999,
        mode: 'detail',
        fieldDef: {
          type: 'float',
          params: { decimalPlaces: 3 },
        },
      });
      expect(screen.getByText('99.999')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(FloatField, {
        value: null,
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays zero correctly', () => {
      renderField(FloatField, {
        value: 0,
        mode: 'detail',
      });
      expect(screen.getByText('0.00')).toBeInTheDocument();
    });

    it('displays negative numbers', () => {
      renderField(FloatField, {
        value: -99.99,
        mode: 'detail',
      });
      expect(screen.getByText('-99.99')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays formatted float', () => {
      renderField(FloatField, {
        value: testValues.sampleFloat,
        mode: 'list',
      });
      expect(screen.getByText('99.99')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(FloatField, {
        value: null,
        mode: 'list',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders a number input', () => {
      renderField(FloatField, {
        name: 'amount',
        value: 99.99,
        mode: 'edit',
      });
      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(99.99);
    });

    it('calls onChange with parsed float', () => {
      const onChange = vi.fn();
      renderField(FloatField, {
        name: 'amount',
        value: '',
        mode: 'edit',
        onChange,
      });

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '25.75' } });

      expect(onChange).toHaveBeenCalledWith(25.75);
    });

    it('calls onChange with null for empty value', () => {
      const onChange = vi.fn();
      renderField(FloatField, {
        name: 'amount',
        value: 10.5,
        mode: 'edit',
        onChange,
      });

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('respects min/max constraints', () => {
      renderField(FloatField, {
        name: 'amount',
        value: 50.0,
        mode: 'edit',
        fieldDef: {
          type: 'float',
          min: 0,
          max: 1000,
        },
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '1000');
    });

    it('has step based on decimal places', () => {
      renderField(FloatField, {
        name: 'amount',
        value: 10.0,
        mode: 'edit',
        fieldDef: {
          type: 'float',
          params: { decimalPlaces: 3 },
        },
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('step', '0.001');
    });

    it('can be disabled', () => {
      renderField(FloatField, {
        name: 'amount',
        value: 99.99,
        mode: 'edit',
        disabled: true,
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toBeDisabled();
    });

    it('can be read-only', () => {
      renderField(FloatField, {
        name: 'amount',
        value: 99.99,
        mode: 'edit',
        readOnly: true,
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('readOnly');
    });
  });

  describe('search mode', () => {
    it('renders a number search input', () => {
      renderField(FloatField, {
        name: 'amount',
        value: '',
        mode: 'search',
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search...');
    });

    it('has step=any for search mode', () => {
      renderField(FloatField, {
        name: 'amount',
        value: '',
        mode: 'search',
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('step', 'any');
    });

    it('calls onChange when search value changes', () => {
      const onChange = vi.fn();
      renderField(FloatField, {
        name: 'amount',
        value: '',
        mode: 'search',
        onChange,
      });

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '100.5' } });

      expect(onChange).toHaveBeenCalledWith(100.5);
    });
  });
});
