import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { VarcharField } from '../text/VarcharField';
import { renderField, testValues, testFieldDefs } from './testUtils';

describe('VarcharField', () => {
  describe('detail mode', () => {
    it('displays the value as text', () => {
      renderField(VarcharField, {
        value: testValues.sampleString,
        mode: 'detail',
      });
      expect(screen.getByText(testValues.sampleString)).toBeInTheDocument();
    });

    it('displays em-dash for empty value', () => {
      renderField(VarcharField, {
        value: '',
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(VarcharField, {
        value: null,
        mode: 'detail',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('converts non-string values to string', () => {
      renderField(VarcharField, {
        value: 12345,
        mode: 'detail',
      });
      expect(screen.getByText('12345')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays the value as text', () => {
      renderField(VarcharField, {
        value: testValues.sampleString,
        mode: 'list',
      });
      expect(screen.getByText(testValues.sampleString)).toBeInTheDocument();
    });

    it('displays em-dash for empty value', () => {
      renderField(VarcharField, {
        value: '',
        mode: 'list',
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders an input field', () => {
      renderField(VarcharField, {
        name: 'testField',
        value: testValues.sampleString,
        mode: 'edit',
      });
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(testValues.sampleString);
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      renderField(VarcharField, {
        name: 'testField',
        value: '',
        mode: 'edit',
        onChange,
      });

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Value' } });

      expect(onChange).toHaveBeenCalledWith('New Value');
    });

    it('respects maxLength attribute', () => {
      renderField(VarcharField, {
        name: 'testField',
        value: '',
        mode: 'edit',
        fieldDef: testFieldDefs.varcharWithMaxLength,
      });

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '100');
    });

    it('can be disabled', () => {
      renderField(VarcharField, {
        name: 'testField',
        value: testValues.sampleString,
        mode: 'edit',
        disabled: true,
      });

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('can be read-only', () => {
      renderField(VarcharField, {
        name: 'testField',
        value: testValues.sampleString,
        mode: 'edit',
        readOnly: true,
      });

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readOnly');
    });

    it('shows placeholder from fieldDef', () => {
      renderField(VarcharField, {
        name: 'testField',
        value: '',
        mode: 'edit',
        fieldDef: {
          type: 'varchar',
          params: { placeholder: 'Enter name...' },
        },
      });

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Enter name...');
    });
  });

  describe('search mode', () => {
    it('renders a search input', () => {
      renderField(VarcharField, {
        name: 'testField',
        value: '',
        mode: 'search',
      });

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search...');
    });

    it('calls onChange when search value changes', () => {
      const onChange = vi.fn();
      renderField(VarcharField, {
        name: 'testField',
        value: '',
        mode: 'search',
        onChange,
      });

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'search term' } });

      expect(onChange).toHaveBeenCalledWith('search term');
    });
  });
});
