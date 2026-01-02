/**
 * PhoneField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneField } from '../special/PhoneField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'phone' };
  return {
    name: 'phone',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Contact',
    ...overrides,
  };
}

describe('PhoneField', () => {
  describe('detail mode', () => {
    it('shows dash for empty value', () => {
      render(<PhoneField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays phone number as clickable link', () => {
      render(<PhoneField {...createFieldProps({ value: '5551234567' })} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'tel:5551234567');
    });

    it('formats US phone number correctly', () => {
      render(<PhoneField {...createFieldProps({ value: '5551234567' })} />);
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    });

    it('formats US phone with country code', () => {
      render(<PhoneField {...createFieldProps({ value: '15551234567' })} />);
      expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
    });

    it('displays multiple phone numbers', () => {
      const phones = [
        { phoneNumber: '5551234567', type: 'Work', primary: true },
        { phoneNumber: '5559876543', type: 'Mobile' },
      ];
      render(<PhoneField {...createFieldProps({ value: phones })} />);

      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('(555) 987-6543')).toBeInTheDocument();
      expect(screen.getByText('(Work)')).toBeInTheDocument();
      expect(screen.getByText('(Mobile)')).toBeInTheDocument();
      expect(screen.getByText('Primary')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for empty value', () => {
      render(<PhoneField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays primary phone as link', () => {
      const phones = [
        { phoneNumber: '5551234567', primary: true },
        { phoneNumber: '5559876543' },
      ];
      render(<PhoneField {...createFieldProps({ value: phones, mode: 'list' })} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'tel:5551234567');
      expect(link).toHaveTextContent('(555) 123-4567');
    });
  });

  describe('edit mode', () => {
    it('renders phone input', () => {
      render(<PhoneField {...createFieldProps({ value: '', mode: 'edit' })} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
      expect(input).toHaveAttribute('placeholder', 'Enter phone number');
    });

    it('displays current value', () => {
      render(<PhoneField {...createFieldProps({ value: '5551234567', mode: 'edit' })} />);
      expect(screen.getByRole('textbox')).toHaveValue('5551234567');
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      render(<PhoneField {...createFieldProps({ value: '', mode: 'edit', onChange })} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '5551234567' } });
      expect(onChange).toHaveBeenCalledWith('5551234567');
    });

    it('disables input when disabled', () => {
      render(<PhoneField {...createFieldProps({ value: '', mode: 'edit', disabled: true })} />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('makes input readonly when readOnly', () => {
      render(<PhoneField {...createFieldProps({ value: '', mode: 'edit', readOnly: true })} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });
  });

  describe('search mode', () => {
    it('renders search input', () => {
      render(<PhoneField {...createFieldProps({ value: '', mode: 'search' })} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Search phone...');
    });

    it('calls onChange on search input', () => {
      const onChange = vi.fn();
      render(<PhoneField {...createFieldProps({ value: '', mode: 'search', onChange })} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '555' } });
      expect(onChange).toHaveBeenCalledWith('555');
    });
  });
});
