import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { BoolField } from '../selection/BoolField';
import { renderField } from './testUtils';

describe('BoolField', () => {
  describe('detail mode', () => {
    it('displays Yes with checkmark for true', () => {
      renderField(BoolField, {
        value: true,
        mode: 'detail',
      });
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('displays No with X for false', () => {
      renderField(BoolField, {
        value: false,
        mode: 'detail',
      });
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('treats truthy values as true', () => {
      renderField(BoolField, {
        value: 1,
        mode: 'detail',
      });
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('treats falsy values as false', () => {
      renderField(BoolField, {
        value: 0,
        mode: 'detail',
      });
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('treats null as false', () => {
      renderField(BoolField, {
        value: null,
        mode: 'detail',
      });
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays checkmark icon for true', () => {
      const { container } = renderField(BoolField, {
        value: true,
        mode: 'list',
      });
      // Check for the Check icon (has text-green-600 class)
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('displays X icon for false', () => {
      const { container } = renderField(BoolField, {
        value: false,
        mode: 'list',
      });
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders a checkbox', () => {
      renderField(BoolField, {
        name: 'isActive',
        value: false,
        mode: 'edit',
      });

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('shows checked state for true value', () => {
      renderField(BoolField, {
        name: 'isActive',
        value: true,
        mode: 'edit',
      });

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('calls onChange with true when checked', () => {
      const onChange = vi.fn();
      renderField(BoolField, {
        name: 'isActive',
        value: false,
        mode: 'edit',
        onChange,
      });

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('calls onChange with false when unchecked', () => {
      const onChange = vi.fn();
      renderField(BoolField, {
        name: 'isActive',
        value: true,
        mode: 'edit',
        onChange,
      });

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('can be disabled', () => {
      renderField(BoolField, {
        name: 'isActive',
        value: true,
        mode: 'edit',
        disabled: true,
      });

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('disables when readOnly', () => {
      renderField(BoolField, {
        name: 'isActive',
        value: true,
        mode: 'edit',
        readOnly: true,
      });

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('shows label text that changes with value', () => {
      renderField(BoolField, {
        name: 'isActive',
        value: false,
        mode: 'edit',
      });

      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  describe('search mode', () => {
    it('renders a select with three options', () => {
      renderField(BoolField, {
        name: 'isActive',
        value: null,
        mode: 'search',
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('Any');
      expect(options[1]).toHaveTextContent('Yes');
      expect(options[2]).toHaveTextContent('No');
    });

    it('shows empty value for null', () => {
      renderField(BoolField, {
        name: 'isActive',
        value: null,
        mode: 'search',
      });

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('');
    });

    it('calls onChange with null for "Any" selection', () => {
      const onChange = vi.fn();
      renderField(BoolField, {
        name: 'isActive',
        value: true,
        mode: 'search',
        onChange,
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('calls onChange with true for "Yes" selection', () => {
      const onChange = vi.fn();
      renderField(BoolField, {
        name: 'isActive',
        value: null,
        mode: 'search',
        onChange,
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'true' } });

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('calls onChange with false for "No" selection', () => {
      const onChange = vi.fn();
      renderField(BoolField, {
        name: 'isActive',
        value: null,
        mode: 'search',
        onChange,
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'false' } });

      expect(onChange).toHaveBeenCalledWith(false);
    });
  });
});
