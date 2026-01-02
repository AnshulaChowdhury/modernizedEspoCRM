import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { DateTimeField } from '../date/DateTimeField';
import { renderField } from './testUtils';

describe('DateTimeField', () => {
  // Use a fixed date for testing
  const testDateTime = '2024-06-15T14:30:00Z';
  const testDate = new Date(testDateTime);

  describe('detail mode', () => {
    it('displays formatted date with time', () => {
      renderField(DateTimeField, {
        value: testDateTime,
        mode: 'detail',
      });
      // Format: MMM d, yyyy h:mm a
      expect(screen.getByText(/Jun 15, 2024/)).toBeInTheDocument();
    });

    it('displays em-dash for empty value', () => {
      renderField(DateTimeField, {
        value: '',
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(DateTimeField, {
        value: null,
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('handles Date object value', () => {
      renderField(DateTimeField, {
        value: testDate,
        mode: 'detail',
      });
      expect(screen.getByText(/Jun 15, 2024/)).toBeInTheDocument();
    });

    it('displays em-dash for invalid date string', () => {
      renderField(DateTimeField, {
        value: 'not-a-date',
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays compact date format', () => {
      renderField(DateTimeField, {
        value: testDateTime,
        mode: 'list',
      });
      // Format: MMM d, yyyy (date only)
      expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument();
    });

    it('has title with full datetime', () => {
      renderField(DateTimeField, {
        value: testDateTime,
        mode: 'list',
      });
      const element = screen.getByText('Jun 15, 2024');
      expect(element).toHaveAttribute('title');
    });

    it('displays em-dash for empty value', () => {
      renderField(DateTimeField, {
        value: '',
        mode: 'list',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders a datetime-local input', () => {
      renderField(DateTimeField, {
        name: 'startDate',
        value: testDateTime,
        mode: 'edit',
      });
      // datetime-local inputs don't have the role 'textbox' in JSDOM
      const dateInput = document.querySelector('input[type="datetime-local"]');
      expect(dateInput).toBeInTheDocument();
    });

    it('formats value for datetime-local input', () => {
      renderField(DateTimeField, {
        name: 'startDate',
        value: testDateTime,
        mode: 'edit',
      });
      const input = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      // Should be in format: yyyy-MM-ddTHH:mm
      expect(input.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('calls onChange with ISO string when value changes', () => {
      const onChange = vi.fn();
      renderField(DateTimeField, {
        name: 'startDate',
        value: '',
        mode: 'edit',
        onChange,
      });

      const input = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '2024-12-25T10:30' } });

      expect(onChange).toHaveBeenCalled();
      // Check that it's an ISO string
      const calledWith = onChange.mock.calls[0][0];
      expect(calledWith).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('calls onChange with null for empty value', () => {
      const onChange = vi.fn();
      renderField(DateTimeField, {
        name: 'startDate',
        value: testDateTime,
        mode: 'edit',
        onChange,
      });

      const input = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('can be disabled', () => {
      renderField(DateTimeField, {
        name: 'startDate',
        value: testDateTime,
        mode: 'edit',
        disabled: true,
      });

      const input = document.querySelector('input[type="datetime-local"]');
      expect(input).toBeDisabled();
    });

    it('can be read-only', () => {
      renderField(DateTimeField, {
        name: 'startDate',
        value: testDateTime,
        mode: 'edit',
        readOnly: true,
      });

      const input = document.querySelector('input[type="datetime-local"]');
      expect(input).toHaveAttribute('readOnly');
    });
  });

  describe('search mode', () => {
    it('renders a datetime-local input for search', () => {
      renderField(DateTimeField, {
        name: 'startDate',
        value: '',
        mode: 'search',
      });

      const input = document.querySelector('input[type="datetime-local"]');
      expect(input).toBeInTheDocument();
    });

    it('calls onChange when search value changes', () => {
      const onChange = vi.fn();
      renderField(DateTimeField, {
        name: 'startDate',
        value: '',
        mode: 'search',
        onChange,
      });

      const input = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '2024-12-25T10:30' } });

      expect(onChange).toHaveBeenCalled();
    });
  });
});
