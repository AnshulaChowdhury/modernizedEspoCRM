/**
 * ChecklistField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChecklistField } from '../selection/ChecklistField';
import type { FieldProps, FieldDef } from '../types';

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'checklist', options: ['Item1', 'Item2', 'Item3'] };
  return {
    name: 'tasks',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Task',
    ...overrides,
  };
}

const checklistItems = [
  { name: 'task1', completed: true },
  { name: 'task2', completed: false },
  { name: 'task3', completed: true },
];

describe('ChecklistField', () => {
  describe('detail mode', () => {
    it('shows dash for empty checklist', () => {
      render(<ChecklistField {...createFieldProps({ value: [], fieldDef: { type: 'checklist', options: [] } })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays items with completion status', () => {
      render(<ChecklistField {...createFieldProps({ value: checklistItems })} />);

      // getLabel adds space before uppercase letters, so task1 -> Task1
      expect(screen.getByText('Task1')).toBeInTheDocument();
      expect(screen.getByText('Task2')).toBeInTheDocument();
      expect(screen.getByText('Task3')).toBeInTheDocument();
    });

    it('shows completion count', () => {
      render(<ChecklistField {...createFieldProps({ value: checklistItems })} />);
      expect(screen.getByText('2/3')).toBeInTheDocument();
    });

    it('shows progress bar', () => {
      const { container } = render(<ChecklistField {...createFieldProps({ value: checklistItems })} />);
      const progressBar = container.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('strikes through completed items', () => {
      render(<ChecklistField {...createFieldProps({ value: checklistItems })} />);
      const completedItem = screen.getByText('Task1');
      expect(completedItem).toHaveClass('line-through');
    });

    it('handles object format value', () => {
      const objectValue = { task1: true, task2: false };
      render(<ChecklistField {...createFieldProps({ value: objectValue })} />);

      expect(screen.getByText('Task1')).toBeInTheDocument();
      expect(screen.getByText('Task2')).toBeInTheDocument();
    });

    it('uses fieldDef options when value is empty', () => {
      render(
        <ChecklistField
          {...createFieldProps({
            value: null,
            fieldDef: { type: 'checklist', options: ['Option1', 'Option2'] },
          })}
        />
      );

      expect(screen.getByText('Option1')).toBeInTheDocument();
      expect(screen.getByText('Option2')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for empty checklist', () => {
      render(
        <ChecklistField
          {...createFieldProps({ value: [], mode: 'list', fieldDef: { type: 'checklist', options: [] } })}
        />
      );
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows compact progress', () => {
      render(<ChecklistField {...createFieldProps({ value: checklistItems, mode: 'list' })} />);
      expect(screen.getByText('2/3')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders checkboxes for each item', () => {
      render(<ChecklistField {...createFieldProps({ value: checklistItems, mode: 'edit' })} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });

    it('shows checked state for completed items', () => {
      render(<ChecklistField {...createFieldProps({ value: checklistItems, mode: 'edit' })} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).toBeChecked();
    });

    it('calls onChange when item is toggled', () => {
      const onChange = vi.fn();
      render(
        <ChecklistField {...createFieldProps({ value: checklistItems, mode: 'edit', onChange })} />
      );

      fireEvent.click(screen.getAllByRole('checkbox')[1]);

      expect(onChange).toHaveBeenCalledWith([
        { name: 'task1', completed: true },
        { name: 'task2', completed: true },
        { name: 'task3', completed: true },
      ]);
    });

    it('disables checkboxes when disabled', () => {
      render(
        <ChecklistField
          {...createFieldProps({ value: checklistItems, mode: 'edit', disabled: true })}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
    });

    it('shows empty state message when no items', () => {
      render(
        <ChecklistField
          {...createFieldProps({
            value: [],
            mode: 'edit',
            fieldDef: { type: 'checklist', options: [] },
          })}
        />
      );
      expect(screen.getByText('No items')).toBeInTheDocument();
    });
  });

  describe('search mode', () => {
    it('shows dash in search mode', () => {
      render(<ChecklistField {...createFieldProps({ value: checklistItems, mode: 'search' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });
});
