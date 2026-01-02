import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { DateField } from '../date/DateField';
import { renderField } from './testUtils';

describe('DateField', () => {
  describe('detail mode', () => {
    it('displays formatted date', () => {
      renderField(DateField, {
        value: '2024-12-31',
        mode: 'detail',
      });
      // date-fns formats as "Dec 31, 2024"
      expect(screen.getByText('Dec 31, 2024')).toBeInTheDocument();
    });

    it('displays em-dash for empty value', () => {
      renderField(DateField, {
        value: '',
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(DateField, {
        value: null,
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('handles ISO date strings', () => {
      // Using non-midnight time to avoid timezone issues
      renderField(DateField, {
        value: '2024-06-15',
        mode: 'detail',
      });
      expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument();
    });

    it('handles invalid date gracefully', () => {
      renderField(DateField, {
        value: 'not-a-date',
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays formatted date', () => {
      renderField(DateField, {
        value: '2024-12-31',
        mode: 'list',
      });
      expect(screen.getByText('Dec 31, 2024')).toBeInTheDocument();
    });

    it('displays em-dash for empty value', () => {
      renderField(DateField, {
        value: null,
        mode: 'list',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders a date input', () => {
      renderField(DateField, {
        name: 'closeDate',
        value: '2024-12-31',
        mode: 'edit',
      });

      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('2024-12-31');
    });

    it('shows empty value when null', () => {
      renderField(DateField, {
        name: 'closeDate',
        value: null,
        mode: 'edit',
      });

      const input = document.querySelector('input[type="date"]');
      expect(input).toHaveValue('');
    });

    it('calls onChange with date string when changed', () => {
      const onChange = vi.fn();
      renderField(DateField, {
        name: 'closeDate',
        value: '',
        mode: 'edit',
        onChange,
      });

      const input = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '2024-12-31' } });

      expect(onChange).toHaveBeenCalledWith('2024-12-31');
    });

    it('calls onChange with null when cleared', () => {
      const onChange = vi.fn();
      renderField(DateField, {
        name: 'closeDate',
        value: '2024-12-31',
        mode: 'edit',
        onChange,
      });

      const input = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('can be disabled', () => {
      renderField(DateField, {
        name: 'closeDate',
        value: '2024-12-31',
        mode: 'edit',
        disabled: true,
      });

      const input = document.querySelector('input[type="date"]');
      expect(input).toBeDisabled();
    });

    it('can be read-only', () => {
      renderField(DateField, {
        name: 'closeDate',
        value: '2024-12-31',
        mode: 'edit',
        readOnly: true,
      });

      const input = document.querySelector('input[type="date"]');
      expect(input).toHaveAttribute('readOnly');
    });
  });

  describe('search mode', () => {
    it('renders a date input', () => {
      renderField(DateField, {
        name: 'closeDate',
        value: null,
        mode: 'search',
      });

      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    it('calls onChange with value when changed', () => {
      const onChange = vi.fn();
      renderField(DateField, {
        name: 'closeDate',
        value: null,
        mode: 'search',
        onChange,
      });

      const input = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '2024-12-31' } });

      expect(onChange).toHaveBeenCalledWith('2024-12-31');
    });

    it('calls onChange with null when cleared', () => {
      const onChange = vi.fn();
      renderField(DateField, {
        name: 'closeDate',
        value: '2024-12-31',
        mode: 'search',
        onChange,
      });

      const input = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('date parsing', () => {
    it('handles Date object values', () => {
      // Use local noon to avoid timezone issues
      const date = new Date(2024, 11, 31, 12, 0, 0);
      renderField(DateField, {
        value: date,
        mode: 'detail',
      });
      expect(screen.getByText('Dec 31, 2024')).toBeInTheDocument();
    });

    it('handles various ISO string formats', () => {
      renderField(DateField, {
        value: '2024-03-15',
        mode: 'detail',
      });
      expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument();
    });
  });
});
