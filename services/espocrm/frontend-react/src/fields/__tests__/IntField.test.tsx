import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { IntField } from '../number/IntField';
import { renderField } from './testUtils';

describe('IntField', () => {
  describe('detail mode', () => {
    it('displays formatted number', () => {
      renderField(IntField, {
        value: 1234567,
        mode: 'detail',
      });
      // toLocaleString formats as 1,234,567
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('displays simple number', () => {
      renderField(IntField, {
        value: 42,
        mode: 'detail',
      });
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(IntField, {
        value: null,
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays em-dash for undefined value', () => {
      renderField(IntField, {
        value: undefined,
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays zero correctly', () => {
      renderField(IntField, {
        value: 0,
        mode: 'detail',
      });
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays negative numbers', () => {
      renderField(IntField, {
        value: -100,
        mode: 'detail',
      });
      expect(screen.getByText('-100')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays formatted number', () => {
      renderField(IntField, {
        value: 5000,
        mode: 'list',
      });
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(IntField, {
        value: null,
        mode: 'list',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders a number input', () => {
      renderField(IntField, {
        name: 'quantity',
        value: 10,
        mode: 'edit',
      });
      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(10);
    });

    it('calls onChange with parsed integer', () => {
      const onChange = vi.fn();
      renderField(IntField, {
        name: 'quantity',
        value: '',
        mode: 'edit',
        onChange,
      });

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '25' } });

      expect(onChange).toHaveBeenCalledWith(25);
    });

    it('calls onChange with null for empty value', () => {
      const onChange = vi.fn();
      renderField(IntField, {
        name: 'quantity',
        value: 10,
        mode: 'edit',
        onChange,
      });

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('respects min/max constraints', () => {
      renderField(IntField, {
        name: 'quantity',
        value: 50,
        mode: 'edit',
        fieldDef: {
          type: 'int',
          min: 0,
          max: 100,
        },
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('has step of 1', () => {
      renderField(IntField, {
        name: 'quantity',
        value: 10,
        mode: 'edit',
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('step', '1');
    });

    it('can be disabled', () => {
      renderField(IntField, {
        name: 'quantity',
        value: 10,
        mode: 'edit',
        disabled: true,
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toBeDisabled();
    });

    it('can be read-only', () => {
      renderField(IntField, {
        name: 'quantity',
        value: 10,
        mode: 'edit',
        readOnly: true,
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('readOnly');
    });
  });

  describe('search mode', () => {
    it('renders a number search input', () => {
      renderField(IntField, {
        name: 'quantity',
        value: '',
        mode: 'search',
      });

      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search...');
    });

    it('calls onChange when search value changes', () => {
      const onChange = vi.fn();
      renderField(IntField, {
        name: 'quantity',
        value: '',
        mode: 'search',
        onChange,
      });

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '100' } });

      expect(onChange).toHaveBeenCalledWith(100);
    });
  });
});
