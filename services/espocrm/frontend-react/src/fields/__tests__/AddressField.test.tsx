/**
 * AddressField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddressField } from '../special/AddressField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'address' };
  return {
    name: 'billingAddress',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Account',
    ...overrides,
  };
}

const fullAddress = {
  street: '123 Main St',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'USA',
};

describe('AddressField', () => {
  describe('detail mode', () => {
    it('shows dash for empty address', () => {
      render(<AddressField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays full address with all parts', () => {
      render(<AddressField {...createFieldProps({ value: fullAddress })} />);

      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('New York, NY, 10001')).toBeInTheDocument();
      expect(screen.getByText('USA')).toBeInTheDocument();
    });

    it('displays partial address', () => {
      render(<AddressField {...createFieldProps({ value: { city: 'Boston', state: 'MA' } })} />);
      expect(screen.getByText('Boston, MA')).toBeInTheDocument();
    });

    it('shows View on Map link', () => {
      render(<AddressField {...createFieldProps({ value: fullAddress })} />);
      const mapLink = screen.getByText('View on Map');
      expect(mapLink).toHaveAttribute('href');
      expect(mapLink).toHaveAttribute('target', '_blank');
      expect(mapLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('reads address parts from record with prefixed field names', () => {
      const record = {
        billingAddressStreet: '456 Oak Ave',
        billingAddressCity: 'Chicago',
        billingAddressState: 'IL',
      };
      render(<AddressField {...createFieldProps({ value: null, record })} />);

      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('Chicago, IL')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for empty address', () => {
      render(<AddressField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows city, state, country in list mode', () => {
      render(<AddressField {...createFieldProps({ value: fullAddress, mode: 'list' })} />);
      expect(screen.getByText('New York, NY, USA')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders all address input fields', () => {
      render(<AddressField {...createFieldProps({ value: null, mode: 'edit' })} />);

      expect(screen.getByPlaceholderText('Street')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('City')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('State/Province')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Postal Code')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Country')).toBeInTheDocument();
    });

    it('populates inputs with existing values', () => {
      render(<AddressField {...createFieldProps({ value: fullAddress, mode: 'edit' })} />);

      expect(screen.getByPlaceholderText('Street')).toHaveValue('123 Main St');
      expect(screen.getByPlaceholderText('City')).toHaveValue('New York');
      expect(screen.getByPlaceholderText('State/Province')).toHaveValue('NY');
      expect(screen.getByPlaceholderText('Postal Code')).toHaveValue('10001');
      expect(screen.getByPlaceholderText('Country')).toHaveValue('USA');
    });

    it('calls onChange with updated address object', () => {
      const onChange = vi.fn();
      render(<AddressField {...createFieldProps({ value: fullAddress, mode: 'edit', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('Street'), {
        target: { value: '789 New St' },
      });

      expect(onChange).toHaveBeenCalledWith({
        ...fullAddress,
        street: '789 New St',
      });
    });

    it('disables inputs when disabled', () => {
      render(<AddressField {...createFieldProps({ value: null, mode: 'edit', disabled: true })} />);

      expect(screen.getByPlaceholderText('Street')).toBeDisabled();
      expect(screen.getByPlaceholderText('City')).toBeDisabled();
    });

    it('makes inputs readonly when readOnly', () => {
      render(<AddressField {...createFieldProps({ value: null, mode: 'edit', readOnly: true })} />);

      expect(screen.getByPlaceholderText('Street')).toHaveAttribute('readonly');
      expect(screen.getByPlaceholderText('City')).toHaveAttribute('readonly');
    });
  });

  describe('search mode', () => {
    it('renders single search input', () => {
      render(<AddressField {...createFieldProps({ value: '', mode: 'search' })} />);
      expect(screen.getByPlaceholderText('Search address...')).toBeInTheDocument();
    });

    it('calls onChange on search input', () => {
      const onChange = vi.fn();
      render(<AddressField {...createFieldProps({ value: '', mode: 'search', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('Search address...'), {
        target: { value: 'New York' },
      });
      expect(onChange).toHaveBeenCalledWith('New York');
    });
  });
});
