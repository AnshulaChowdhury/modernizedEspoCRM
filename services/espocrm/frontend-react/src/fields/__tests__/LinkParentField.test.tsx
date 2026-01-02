/**
 * LinkParentField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LinkParentField } from '../relation/LinkParentField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = {
    type: 'linkParent',
    params: {
      entityList: ['Account', 'Contact', 'Lead'],
    },
  };
  return {
    name: 'parent',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Task',
    ...overrides,
  };
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('LinkParentField', () => {
  describe('detail mode', () => {
    it('shows dash for no value', () => {
      renderWithRouter(<LinkParentField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays parent type badge', () => {
      renderWithRouter(
        <LinkParentField
          {...createFieldProps({
            record: {
              parentType: 'Account',
              parentId: 'acc-123',
              parentName: 'Acme Corp',
            },
          })}
        />
      );
      expect(screen.getByText('Account')).toBeInTheDocument();
    });

    it('displays parent name as link', () => {
      renderWithRouter(
        <LinkParentField
          {...createFieldProps({
            record: {
              parentType: 'Account',
              parentId: 'acc-123',
              parentName: 'Acme Corp',
            },
          })}
        />
      );
      const link = screen.getByRole('link', { name: /Acme Corp/ });
      expect(link).toHaveAttribute('href', '/Account/view/acc-123');
    });

    it('uses parentId when parentName is missing', () => {
      renderWithRouter(
        <LinkParentField
          {...createFieldProps({
            record: {
              parentType: 'Contact',
              parentId: 'con-456',
            },
          })}
        />
      );
      expect(screen.getByRole('link', { name: 'con-456' })).toBeInTheDocument();
    });

    it('reads value from value prop', () => {
      renderWithRouter(
        <LinkParentField
          {...createFieldProps({
            value: {
              parentType: 'Lead',
              parentId: 'lead-789',
              parentName: 'John Doe',
            },
          })}
        />
      );
      expect(screen.getByRole('link', { name: /John Doe/ })).toHaveAttribute(
        'href',
        '/Lead/view/lead-789'
      );
    });
  });

  describe('list mode', () => {
    it('shows dash for no value', () => {
      renderWithRouter(<LinkParentField {...createFieldProps({ value: null, mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays compact link', () => {
      renderWithRouter(
        <LinkParentField
          {...createFieldProps({
            mode: 'list',
            record: {
              parentType: 'Account',
              parentId: 'acc-123',
              parentName: 'Test Account',
            },
          })}
        />
      );
      const link = screen.getByRole('link', { name: 'Test Account' });
      expect(link).toHaveAttribute('href', '/Account/view/acc-123');
    });

    it('stops click propagation', () => {
      const parentHandler = vi.fn();
      renderWithRouter(
        <div onClick={parentHandler}>
          <LinkParentField
            {...createFieldProps({
              mode: 'list',
              record: {
                parentType: 'Account',
                parentId: 'acc-123',
                parentName: 'Test',
              },
            })}
          />
        </div>
      );
      fireEvent.click(screen.getByRole('link'));
      expect(parentHandler).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    it('renders entity type dropdown', () => {
      renderWithRouter(<LinkParentField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows entity options from fieldDef', () => {
      renderWithRouter(<LinkParentField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Lead')).toBeInTheDocument();
    });

    it('renders name input', () => {
      renderWithRouter(<LinkParentField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByPlaceholderText('Select type first')).toBeInTheDocument();
    });

    it('populates with existing values', () => {
      renderWithRouter(
        <LinkParentField
          {...createFieldProps({
            mode: 'edit',
            record: {
              parentType: 'Account',
              parentId: 'acc-123',
              parentName: 'Acme Corp',
            },
          })}
        />
      );
      expect(screen.getByRole('combobox')).toHaveValue('Account');
      expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    });

    it('shows correct placeholder when type selected', () => {
      renderWithRouter(
        <LinkParentField
          {...createFieldProps({
            mode: 'edit',
            record: { parentType: 'Contact', parentId: '', parentName: '' },
          })}
        />
      );
      expect(screen.getByPlaceholderText('Select Contact...')).toBeInTheDocument();
    });

    it('calls onChange when type changes', () => {
      const onChange = vi.fn();
      renderWithRouter(
        <LinkParentField {...createFieldProps({ value: null, mode: 'edit', onChange })} />
      );

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Account' } });

      expect(onChange).toHaveBeenCalledWith({
        parentType: 'Account',
        parentId: '',
        parentName: '',
      });
    });

    it('calls onChange when name changes', () => {
      const onChange = vi.fn();
      renderWithRouter(
        <LinkParentField
          {...createFieldProps({
            mode: 'edit',
            onChange,
            record: { parentType: 'Account', parentId: '', parentName: '' },
          })}
        />
      );

      fireEvent.change(screen.getByPlaceholderText('Select Account...'), {
        target: { value: 'New Name' },
      });

      expect(onChange).toHaveBeenCalledWith({
        parentType: 'Account',
        parentId: '',
        parentName: 'New Name',
      });
    });

    it('disables inputs when disabled', () => {
      renderWithRouter(
        <LinkParentField {...createFieldProps({ value: null, mode: 'edit', disabled: true })} />
      );
      expect(screen.getByRole('combobox')).toBeDisabled();
      expect(screen.getByPlaceholderText('Select type first')).toBeDisabled();
    });

    it('disables inputs when readOnly', () => {
      renderWithRouter(
        <LinkParentField {...createFieldProps({ value: null, mode: 'edit', readOnly: true })} />
      );
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('disables name input when no type selected', () => {
      renderWithRouter(<LinkParentField {...createFieldProps({ value: null, mode: 'edit' })} />);
      expect(screen.getByPlaceholderText('Select type first')).toBeDisabled();
    });
  });

  describe('search mode', () => {
    it('renders search input', () => {
      renderWithRouter(<LinkParentField {...createFieldProps({ value: null, mode: 'search' })} />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('calls onChange on search input', () => {
      const onChange = vi.fn();
      renderWithRouter(
        <LinkParentField {...createFieldProps({ value: null, mode: 'search', onChange })} />
      );

      fireEvent.change(screen.getByPlaceholderText('Search...'), {
        target: { value: 'test search' },
      });

      expect(onChange).toHaveBeenCalledWith('test search');
    });
  });

  describe('default entity list', () => {
    it('uses default entity list when not specified', () => {
      const fieldDef: FieldDef = { type: 'linkParent' };
      renderWithRouter(
        <LinkParentField {...createFieldProps({ fieldDef, value: null, mode: 'edit' })} />
      );
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Lead')).toBeInTheDocument();
      expect(screen.getByText('Opportunity')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      const { container } = renderWithRouter(
        <LinkParentField
          {...createFieldProps({
            record: {
              parentType: 'Account',
              parentId: 'acc-123',
              parentName: 'Test',
            },
            className: 'custom-class',
          })}
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
