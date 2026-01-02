/**
 * ArrayField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArrayField } from '../selection/ArrayField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'array' };
  return {
    name: 'tags',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Task',
    ...overrides,
  };
}

describe('ArrayField', () => {
  describe('detail mode', () => {
    it('shows dash for empty array', () => {
      render(<ArrayField {...createFieldProps({ value: [] })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for null value', () => {
      render(<ArrayField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays items as badges', () => {
      render(<ArrayField {...createFieldProps({ value: ['tag1', 'tag2', 'tag3'] })} />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for empty array', () => {
      render(<ArrayField {...createFieldProps({ value: [], mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays items as comma-separated list', () => {
      render(<ArrayField {...createFieldProps({ value: ['a', 'b', 'c'], mode: 'list' })} />);
      expect(screen.getByText('a, b, c')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders add item input', () => {
      render(<ArrayField {...createFieldProps({ value: [], mode: 'edit' })} />);
      expect(screen.getByPlaceholderText('Add item...')).toBeInTheDocument();
    });

    it('renders add button', () => {
      render(<ArrayField {...createFieldProps({ value: [], mode: 'edit' })} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('displays existing items with remove buttons', () => {
      render(<ArrayField {...createFieldProps({ value: ['item1', 'item2'], mode: 'edit' })} />);

      expect(screen.getByText('item1')).toBeInTheDocument();
      expect(screen.getByText('item2')).toBeInTheDocument();

      // Two items, each with a remove button
      const removeButtons = screen.getAllByRole('button').filter((btn) =>
        btn.querySelector('svg.h-3')
      );
      expect(removeButtons).toHaveLength(2);
    });

    it('adds new item when button clicked', () => {
      const onChange = vi.fn();
      render(<ArrayField {...createFieldProps({ value: ['existing'], mode: 'edit', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('Add item...'), {
        target: { value: 'new item' },
      });

      // Find the Plus button (the last button, not the remove buttons)
      const buttons = screen.getAllByRole('button');
      const addButton = buttons[buttons.length - 1];
      fireEvent.click(addButton);

      expect(onChange).toHaveBeenCalledWith(['existing', 'new item']);
    });

    it('adds new item when Enter pressed', () => {
      const onChange = vi.fn();
      render(<ArrayField {...createFieldProps({ value: [], mode: 'edit', onChange })} />);

      const input = screen.getByPlaceholderText('Add item...');
      fireEvent.change(input, { target: { value: 'new item' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['new item']);
    });

    it('removes item when X button clicked', () => {
      const onChange = vi.fn();
      render(<ArrayField {...createFieldProps({ value: ['item1', 'item2'], mode: 'edit', onChange })} />);

      // Find the first remove button (X icon button)
      const item1Element = screen.getByText('item1');
      const removeButton = item1Element.parentElement?.querySelector('button');
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      expect(onChange).toHaveBeenCalledWith(['item2']);
    });

    it('does not add empty item', () => {
      const onChange = vi.fn();
      render(<ArrayField {...createFieldProps({ value: [], mode: 'edit', onChange })} />);

      const input = screen.getByPlaceholderText('Add item...');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('trims whitespace from new items', () => {
      const onChange = vi.fn();
      render(<ArrayField {...createFieldProps({ value: [], mode: 'edit', onChange })} />);

      const input = screen.getByPlaceholderText('Add item...');
      fireEvent.change(input, { target: { value: '  trimmed  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['trimmed']);
    });

    it('clears input after adding item', () => {
      render(<ArrayField {...createFieldProps({ value: [], mode: 'edit', onChange: vi.fn() })} />);

      const input = screen.getByPlaceholderText('Add item...');
      fireEvent.change(input, { target: { value: 'new item' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(input).toHaveValue('');
    });

    it('hides add input when disabled', () => {
      render(<ArrayField {...createFieldProps({ value: ['item'], mode: 'edit', disabled: true })} />);
      expect(screen.queryByPlaceholderText('Add item...')).not.toBeInTheDocument();
    });

    it('hides add input when readOnly', () => {
      render(<ArrayField {...createFieldProps({ value: ['item'], mode: 'edit', readOnly: true })} />);
      expect(screen.queryByPlaceholderText('Add item...')).not.toBeInTheDocument();
    });

    it('hides remove buttons when disabled', () => {
      render(<ArrayField {...createFieldProps({ value: ['item1', 'item2'], mode: 'edit', disabled: true })} />);

      const removeButtons = screen.queryAllByRole('button').filter((btn) =>
        btn.querySelector('svg.h-3')
      );
      expect(removeButtons).toHaveLength(0);
    });
  });

  describe('search mode', () => {
    it('renders search input', () => {
      render(<ArrayField {...createFieldProps({ value: [], mode: 'search' })} />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('displays array value as comma-separated', () => {
      render(<ArrayField {...createFieldProps({ value: ['a', 'b'], mode: 'search' })} />);
      expect(screen.getByRole('textbox')).toHaveValue('a, b');
    });

    it('calls onChange with string value', () => {
      const onChange = vi.fn();
      render(<ArrayField {...createFieldProps({ value: [], mode: 'search', onChange })} />);

      fireEvent.change(screen.getByPlaceholderText('Search...'), {
        target: { value: 'search term' },
      });

      expect(onChange).toHaveBeenCalledWith('search term');
    });
  });
});
