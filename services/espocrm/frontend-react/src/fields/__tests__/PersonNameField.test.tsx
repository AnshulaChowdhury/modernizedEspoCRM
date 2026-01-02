/**
 * PersonNameField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonNameField } from '../special/PersonNameField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'personName' };
  return {
    name: 'name',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Contact',
    ...overrides,
  };
}

describe('PersonNameField', () => {
  describe('detail mode', () => {
    it('shows dash for empty name', () => {
      render(<PersonNameField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays full name from value object', () => {
      render(
        <PersonNameField
          {...createFieldProps({
            value: { salutation: 'Mr.', firstName: 'John', lastName: 'Doe' },
          })}
        />
      );
      expect(screen.getByText('Mr. John Doe')).toBeInTheDocument();
    });

    it('displays name without salutation', () => {
      render(
        <PersonNameField
          {...createFieldProps({
            value: { firstName: 'John', lastName: 'Doe' },
          })}
        />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays name from record fields', () => {
      render(
        <PersonNameField
          {...createFieldProps({
            record: {
              salutationName: 'Dr.',
              firstName: 'Jane',
              lastName: 'Smith',
            },
          })}
        />
      );
      expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
    });

    it('displays only first name when last name is missing', () => {
      render(
        <PersonNameField
          {...createFieldProps({
            value: { firstName: 'John' },
          })}
        />
      );
      expect(screen.getByText('John')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for empty name', () => {
      render(<PersonNameField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays full name', () => {
      render(
        <PersonNameField
          {...createFieldProps({
            value: { firstName: 'John', lastName: 'Doe' },
            mode: 'list',
          })}
        />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders salutation dropdown', () => {
      render(<PersonNameField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders first name input', () => {
      render(<PersonNameField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    });

    it('renders last name input', () => {
      render(<PersonNameField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    });

    it('populates inputs with existing values', () => {
      render(
        <PersonNameField
          {...createFieldProps({
            value: { salutation: 'Mr.', firstName: 'John', lastName: 'Doe' },
            mode: 'edit',
          })}
        />
      );

      expect(screen.getByRole('combobox')).toHaveValue('Mr.');
      expect(screen.getByPlaceholderText('First Name')).toHaveValue('John');
      expect(screen.getByPlaceholderText('Last Name')).toHaveValue('Doe');
    });

    it('calls onChange when first name changes', () => {
      const onChange = vi.fn();
      render(
        <PersonNameField
          {...createFieldProps({
            value: { firstName: 'John', lastName: 'Doe' },
            mode: 'edit',
            onChange,
          })}
        />
      );

      fireEvent.change(screen.getByPlaceholderText('First Name'), {
        target: { value: 'Jane' },
      });

      expect(onChange).toHaveBeenCalledWith({
        salutation: '',
        firstName: 'Jane',
        lastName: 'Doe',
      });
    });

    it('calls onChange when last name changes', () => {
      const onChange = vi.fn();
      render(
        <PersonNameField
          {...createFieldProps({
            value: { firstName: 'John', lastName: 'Doe' },
            mode: 'edit',
            onChange,
          })}
        />
      );

      fireEvent.change(screen.getByPlaceholderText('Last Name'), {
        target: { value: 'Smith' },
      });

      expect(onChange).toHaveBeenCalledWith({
        salutation: '',
        firstName: 'John',
        lastName: 'Smith',
      });
    });

    it('calls onChange when salutation changes', () => {
      const onChange = vi.fn();
      render(
        <PersonNameField
          {...createFieldProps({
            value: { firstName: 'John', lastName: 'Doe' },
            mode: 'edit',
            onChange,
          })}
        />
      );

      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'Dr.' },
      });

      expect(onChange).toHaveBeenCalledWith({
        salutation: 'Dr.',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('includes standard salutation options', () => {
      render(<PersonNameField {...createFieldProps({ value: null, mode: 'edit' })} />);

      const select = screen.getByRole('combobox');
      expect(select).toContainElement(screen.getByText('Mr.'));
      expect(select).toContainElement(screen.getByText('Ms.'));
      expect(select).toContainElement(screen.getByText('Dr.'));
    });

    it('disables inputs when disabled', () => {
      render(
        <PersonNameField {...createFieldProps({ value: null, mode: 'edit', disabled: true })} />
      );

      expect(screen.getByRole('combobox')).toBeDisabled();
      expect(screen.getByPlaceholderText('First Name')).toBeDisabled();
      expect(screen.getByPlaceholderText('Last Name')).toBeDisabled();
    });
  });

  describe('search mode', () => {
    it('renders search input', () => {
      render(<PersonNameField {...createFieldProps({ value: '', mode: 'search' })} />);
      expect(screen.getByPlaceholderText('Search name...')).toBeInTheDocument();
    });

    it('calls onChange on search input', () => {
      const onChange = vi.fn();
      render(<PersonNameField {...createFieldProps({ value: '', mode: 'search', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('Search name...'), {
        target: { value: 'John' },
      });

      expect(onChange).toHaveBeenCalledWith('John');
    });
  });
});
