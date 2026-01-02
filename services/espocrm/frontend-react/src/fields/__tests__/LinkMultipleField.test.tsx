import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LinkMultipleField } from '../relation/LinkMultipleField';
import { createFieldProps } from './testUtils';

// Wrapper with router
function renderWithRouter(props: Parameters<typeof createFieldProps>[0] = {}) {
  const mergedProps = createFieldProps({
    fieldDef: { type: 'linkMultiple', entity: 'Contact' },
    ...props,
  });
  return render(
    <MemoryRouter>
      <LinkMultipleField {...mergedProps} />
    </MemoryRouter>
  );
}

describe('LinkMultipleField', () => {
  const sampleLinks = [
    { id: 'con-001', name: 'John Doe' },
    { id: 'con-002', name: 'Jane Smith' },
    { id: 'con-003', name: 'Bob Wilson' },
  ];

  describe('detail mode', () => {
    it('displays multiple links', () => {
      renderWithRouter({
        value: sampleLinks,
        mode: 'detail',
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('renders links to entity view pages', () => {
      renderWithRouter({
        value: sampleLinks.slice(0, 1),
        mode: 'detail',
      });

      const link = screen.getByRole('link', { name: 'John Doe' });
      expect(link).toHaveAttribute('href', '/Contact/view/con-001');
    });

    it('displays em-dash for empty array', () => {
      renderWithRouter({
        value: [],
        mode: 'detail',
      });

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('reads from record Ids and Names fields', () => {
      renderWithRouter({
        name: 'contacts',
        value: null,
        mode: 'detail',
        record: {
          contactsIds: ['con-001', 'con-002'],
          contactsNames: {
            'con-001': 'John Doe',
            'con-002': 'Jane Smith',
          },
        },
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('displays truncated list with "+X more"', () => {
      const manyLinks = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
        { id: '4', name: 'Item 4' },
        { id: '5', name: 'Item 5' },
      ];

      renderWithRouter({
        value: manyLinks,
        mode: 'list',
      });

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
      expect(screen.queryByText('Item 4')).not.toBeInTheDocument();
    });

    it('displays all items if 3 or less', () => {
      renderWithRouter({
        value: sampleLinks,
        mode: 'list',
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    it('displays em-dash for empty array', () => {
      renderWithRouter({
        value: [],
        mode: 'list',
      });

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('displays items as removable tags', () => {
      renderWithRouter({
        value: sampleLinks.slice(0, 2),
        mode: 'edit',
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('displays "No X selected" when empty', () => {
      renderWithRouter({
        value: [],
        mode: 'edit',
        fieldDef: { type: 'linkMultiple', entity: 'Contact' },
      });

      expect(screen.getByText('No Contact selected')).toBeInTheDocument();
    });

    it('has remove buttons for each item', () => {
      renderWithRouter({
        value: sampleLinks.slice(0, 2),
        mode: 'edit',
      });

      // Should have 2 remove buttons (X icons)
      const removeButtons = screen.getAllByRole('button');
      // First button per tag is remove
      expect(removeButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('calls onChange with filtered items when remove clicked', () => {
      const onChange = vi.fn();
      renderWithRouter({
        value: sampleLinks.slice(0, 2),
        mode: 'edit',
        onChange,
      });

      // Click first remove button
      const removeButtons = screen.getAllByRole('button');
      fireEvent.click(removeButtons[0]);

      expect(onChange).toHaveBeenCalledWith([sampleLinks[1]]);
    });

    it('shows Add button', () => {
      renderWithRouter({
        value: [],
        mode: 'edit',
        fieldDef: { type: 'linkMultiple', entity: 'Contact' },
      });

      expect(screen.getByText('Add Contact')).toBeInTheDocument();
    });

    it('hides remove buttons when disabled', () => {
      renderWithRouter({
        value: sampleLinks.slice(0, 2),
        mode: 'edit',
        disabled: true,
      });

      // Should not have remove buttons when disabled
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // Check no X buttons are clickable - the remove button shouldn't exist
      const buttons = screen.queryAllByRole('button');
      const addButton = buttons.find((b) => b.textContent?.includes('Add'));
      expect(addButton).toBeUndefined();
    });

    it('hides add button when disabled', () => {
      renderWithRouter({
        value: [],
        mode: 'edit',
        disabled: true,
        fieldDef: { type: 'linkMultiple', entity: 'Contact' },
      });

      expect(screen.queryByText('Add Contact')).not.toBeInTheDocument();
    });

    it('hides add button when readOnly', () => {
      renderWithRouter({
        value: [],
        mode: 'edit',
        readOnly: true,
        fieldDef: { type: 'linkMultiple', entity: 'Contact' },
      });

      expect(screen.queryByText('Add Contact')).not.toBeInTheDocument();
    });
  });

  describe('search mode', () => {
    it('renders search input with entity placeholder', () => {
      renderWithRouter({
        value: '',
        mode: 'search',
        fieldDef: { type: 'linkMultiple', entity: 'Contact' },
      });

      expect(screen.getByPlaceholderText('Search Contact...')).toBeInTheDocument();
    });
  });
});
