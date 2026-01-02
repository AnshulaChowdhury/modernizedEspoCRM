/**
 * DurationField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DurationField } from '../date/DurationField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'duration' };
  return {
    name: 'duration',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Task',
    ...overrides,
  };
}

describe('DurationField', () => {
  describe('detail mode', () => {
    it('shows dash for null value', () => {
      render(<DurationField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays minutes only for short duration', () => {
      // 30 minutes = 1800 seconds
      render(<DurationField {...createFieldProps({ value: 1800 })} />);
      expect(screen.getByText('30m')).toBeInTheDocument();
    });

    it('displays hours and minutes', () => {
      // 1 hour 30 minutes = 5400 seconds
      render(<DurationField {...createFieldProps({ value: 5400 })} />);
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });

    it('displays hours only', () => {
      // 2 hours = 7200 seconds
      render(<DurationField {...createFieldProps({ value: 7200 })} />);
      expect(screen.getByText('2h')).toBeInTheDocument();
    });

    it('displays 0m for zero duration', () => {
      render(<DurationField {...createFieldProps({ value: 0 })} />);
      expect(screen.getByText('0m')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for null value', () => {
      render(<DurationField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays formatted duration', () => {
      render(<DurationField {...createFieldProps({ value: 3600, mode: 'list' })} />);
      expect(screen.getByText('1h')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders hours input', () => {
      render(<DurationField {...createFieldProps({ value: 0, mode: 'edit' })} />);
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toBeInTheDocument();
    });

    it('renders minutes input', () => {
      render(<DurationField {...createFieldProps({ value: 0, mode: 'edit' })} />);
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[1]).toBeInTheDocument();
    });

    it('renders hours and minutes labels', () => {
      render(<DurationField {...createFieldProps({ value: 0, mode: 'edit' })} />);
      expect(screen.getByText('h')).toBeInTheDocument();
      expect(screen.getByText('m')).toBeInTheDocument();
    });

    it('populates inputs with existing values', () => {
      // 2 hours 30 minutes = 9000 seconds
      render(<DurationField {...createFieldProps({ value: 9000, mode: 'edit' })} />);

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveValue(2);
      expect(inputs[1]).toHaveValue(30);
    });

    it('calls onChange when hours change', () => {
      const onChange = vi.fn();
      render(<DurationField {...createFieldProps({ value: 3600, mode: 'edit', onChange })} />);

      const hoursInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.change(hoursInput, { target: { value: '3' } });

      // 3 hours = 10800 seconds (assuming minutes stay at 0)
      expect(onChange).toHaveBeenCalledWith(10800);
    });

    it('calls onChange when minutes change', () => {
      const onChange = vi.fn();
      render(<DurationField {...createFieldProps({ value: 3600, mode: 'edit', onChange })} />);

      const minutesInput = screen.getAllByRole('spinbutton')[1];
      fireEvent.change(minutesInput, { target: { value: '45' } });

      // 1 hour 45 minutes = 6300 seconds
      expect(onChange).toHaveBeenCalledWith(6300);
    });

    it('clamps minutes to maximum of 59', () => {
      const onChange = vi.fn();
      render(<DurationField {...createFieldProps({ value: 0, mode: 'edit', onChange })} />);

      const minutesInput = screen.getAllByRole('spinbutton')[1];
      fireEvent.change(minutesInput, { target: { value: '75' } });

      // Should clamp to 59 minutes = 3540 seconds
      expect(onChange).toHaveBeenCalledWith(3540);
    });

    it('prevents negative hours', () => {
      const onChange = vi.fn();
      render(<DurationField {...createFieldProps({ value: 3600, mode: 'edit', onChange })} />);

      const hoursInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.change(hoursInput, { target: { value: '-5' } });

      // Should clamp to 0 hours
      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('disables inputs when disabled', () => {
      render(<DurationField {...createFieldProps({ value: 0, mode: 'edit', disabled: true })} />);

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toBeDisabled();
      expect(inputs[1]).toBeDisabled();
    });

    it('makes inputs readonly when readOnly', () => {
      render(<DurationField {...createFieldProps({ value: 0, mode: 'edit', readOnly: true })} />);

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveAttribute('readonly');
      expect(inputs[1]).toHaveAttribute('readonly');
    });
  });

  describe('search mode', () => {
    it('renders seconds input', () => {
      render(<DurationField {...createFieldProps({ value: null, mode: 'search' })} />);
      expect(screen.getByPlaceholderText('Duration (seconds)...')).toBeInTheDocument();
    });

    it('calls onChange with seconds value', () => {
      const onChange = vi.fn();
      render(<DurationField {...createFieldProps({ value: null, mode: 'search', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('Duration (seconds)...'), {
        target: { value: '3600' },
      });

      expect(onChange).toHaveBeenCalledWith(3600);
    });

    it('calls onChange with null for empty value', () => {
      const onChange = vi.fn();
      render(<DurationField {...createFieldProps({ value: 3600, mode: 'search', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('Duration (seconds)...'), {
        target: { value: '' },
      });

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });
});
