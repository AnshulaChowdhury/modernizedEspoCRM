import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { EnumField } from '../selection/EnumField';
import { renderField } from './testUtils';

describe('EnumField', () => {
  const enumOptions = ['New', 'InProgress', 'Completed', 'Canceled'];
  const fieldDef = { type: 'enum', options: enumOptions };

  describe('detail mode', () => {
    it('displays the value with formatted label', () => {
      renderField(EnumField, {
        value: 'InProgress',
        mode: 'detail',
        fieldDef,
      });
      // The getLabel function converts InProgress to "In Progress"
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('displays em-dash for empty value', () => {
      renderField(EnumField, {
        value: '',
        mode: 'detail',
        fieldDef,
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays em-dash for null value', () => {
      renderField(EnumField, {
        value: null,
        mode: 'detail',
        fieldDef,
      });
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays simple value', () => {
      renderField(EnumField, {
        value: 'New',
        mode: 'list',
        fieldDef,
      });
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('displays status-like values with badge styling', () => {
      renderField(EnumField, {
        value: 'Completed',
        mode: 'list',
        fieldDef,
      });
      const badge = screen.getByText('Completed');
      // Check if it has badge-like classes
      expect(badge).toHaveClass('rounded-full');
    });
  });

  describe('edit mode', () => {
    it('renders a select dropdown', () => {
      renderField(EnumField, {
        name: 'status',
        value: 'New',
        mode: 'edit',
        fieldDef,
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('New');
    });

    it('shows all options plus empty option', () => {
      renderField(EnumField, {
        name: 'status',
        value: '',
        mode: 'edit',
        fieldDef,
      });

      const options = screen.getAllByRole('option');
      // 4 enum options + 1 "— Select —" empty option
      expect(options).toHaveLength(5);
      expect(options[0]).toHaveTextContent('— Select —');
    });

    it('calls onChange when selection changes', () => {
      const onChange = vi.fn();
      renderField(EnumField, {
        name: 'status',
        value: 'New',
        mode: 'edit',
        fieldDef,
        onChange,
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Completed' } });

      expect(onChange).toHaveBeenCalledWith('Completed');
    });

    it('calls onChange with null when empty option selected', () => {
      const onChange = vi.fn();
      renderField(EnumField, {
        name: 'status',
        value: 'New',
        mode: 'edit',
        fieldDef,
        onChange,
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('can be disabled', () => {
      renderField(EnumField, {
        name: 'status',
        value: 'New',
        mode: 'edit',
        fieldDef,
        disabled: true,
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('disables when readOnly', () => {
      renderField(EnumField, {
        name: 'status',
        value: 'New',
        mode: 'edit',
        fieldDef,
        readOnly: true,
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  describe('search mode', () => {
    it('renders a select with "Any" option', () => {
      renderField(EnumField, {
        name: 'status',
        value: '',
        mode: 'search',
        fieldDef,
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent('Any');
    });

    it('calls onChange when filter selection changes', () => {
      const onChange = vi.fn();
      renderField(EnumField, {
        name: 'status',
        value: '',
        mode: 'search',
        fieldDef,
        onChange,
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Completed' } });

      expect(onChange).toHaveBeenCalledWith('Completed');
    });
  });

  describe('empty options', () => {
    it('handles fieldDef without options', () => {
      renderField(EnumField, {
        name: 'status',
        value: 'SomeValue',
        mode: 'detail',
        fieldDef: { type: 'enum' },
      });

      expect(screen.getByText('Some Value')).toBeInTheDocument();
    });
  });
});
