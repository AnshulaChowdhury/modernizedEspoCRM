/**
 * MultiEnumField Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiEnumField } from '../selection/MultiEnumField';
import type { FieldProps, FieldDef } from '../types';

const options = ['Option1', 'Option2', 'Option3'];

function createFieldProps(overrides: Partial<FieldProps> = {}): FieldProps {
  const fieldDef: FieldDef = { type: 'multiEnum', options };
  return {
    name: 'tags',
    value: null,
    fieldDef,
    mode: 'detail',
    entityType: 'Task',
    ...overrides,
  };
}

describe('MultiEnumField', () => {
  describe('detail mode', () => {
    it('shows dash for empty array', () => {
      render(<MultiEnumField {...createFieldProps({ value: [] })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows dash for null value', () => {
      render(<MultiEnumField {...createFieldProps({ value: null })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays selected values as badges', () => {
      render(<MultiEnumField {...createFieldProps({ value: ['Option1', 'Option2'] })} />);
      // getLabel adds space before capital letters, so Option1 becomes "Option1" (no space before 1)
      expect(screen.getByText('Option1')).toBeInTheDocument();
      expect(screen.getByText('Option2')).toBeInTheDocument();
    });

    it('formats camelCase values as readable labels', () => {
      render(
        <MultiEnumField
          {...createFieldProps({
            value: ['myCustomValue'],
            fieldDef: { type: 'multiEnum', options: ['myCustomValue'] },
          })}
        />
      );
      expect(screen.getByText('My Custom Value')).toBeInTheDocument();
    });
  });

  describe('list mode', () => {
    it('shows dash for empty value', () => {
      render(<MultiEnumField {...createFieldProps({ value: [], mode: 'list' })} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays badges in list mode', () => {
      render(<MultiEnumField {...createFieldProps({ value: ['Option1'], mode: 'list' })} />);
      expect(screen.getByText('Option1')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders checkboxes for all options', () => {
      render(<MultiEnumField {...createFieldProps({ value: [], mode: 'edit' })} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });

    it('shows checked state for selected values', () => {
      render(<MultiEnumField {...createFieldProps({ value: ['Option1'], mode: 'edit' })} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).not.toBeChecked();
    });

    it('calls onChange when checkbox is toggled on', () => {
      const onChange = vi.fn();
      render(<MultiEnumField {...createFieldProps({ value: [], mode: 'edit', onChange })} />);

      fireEvent.click(screen.getAllByRole('checkbox')[0]);
      expect(onChange).toHaveBeenCalledWith(['Option1']);
    });

    it('calls onChange when checkbox is toggled off', () => {
      const onChange = vi.fn();
      render(
        <MultiEnumField {...createFieldProps({ value: ['Option1', 'Option2'], mode: 'edit', onChange })} />
      );

      fireEvent.click(screen.getAllByRole('checkbox')[0]);
      expect(onChange).toHaveBeenCalledWith(['Option2']);
    });

    it('displays labels next to checkboxes', () => {
      render(<MultiEnumField {...createFieldProps({ value: [], mode: 'edit' })} />);

      expect(screen.getByText('Option1')).toBeInTheDocument();
      expect(screen.getByText('Option2')).toBeInTheDocument();
      expect(screen.getByText('Option3')).toBeInTheDocument();
    });

    it('disables checkboxes when disabled', () => {
      render(<MultiEnumField {...createFieldProps({ value: [], mode: 'edit', disabled: true })} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
    });

    it('disables checkboxes when readOnly', () => {
      render(<MultiEnumField {...createFieldProps({ value: [], mode: 'edit', readOnly: true })} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
    });

    it('shows empty state when no options', () => {
      render(
        <MultiEnumField
          {...createFieldProps({ value: [], mode: 'edit', fieldDef: { type: 'multiEnum', options: [] } })}
        />
      );
      expect(screen.getByText('No options available')).toBeInTheDocument();
    });
  });

  describe('search mode', () => {
    it('renders select dropdown', () => {
      render(<MultiEnumField {...createFieldProps({ value: [], mode: 'search' })} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('has "Any" as default option', () => {
      render(<MultiEnumField {...createFieldProps({ value: [], mode: 'search' })} />);

      expect(screen.getByText('Any')).toBeInTheDocument();
    });

    it('includes all options', () => {
      render(<MultiEnumField {...createFieldProps({ value: [], mode: 'search' })} />);

      expect(screen.getByText('Option1')).toBeInTheDocument();
      expect(screen.getByText('Option2')).toBeInTheDocument();
      expect(screen.getByText('Option3')).toBeInTheDocument();
    });

    it('calls onChange with array when option selected', () => {
      const onChange = vi.fn();
      render(<MultiEnumField {...createFieldProps({ value: [], mode: 'search', onChange })} />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Option1' } });
      expect(onChange).toHaveBeenCalledWith(['Option1']);
    });

    it('calls onChange with empty array when Any selected', () => {
      const onChange = vi.fn();
      render(<MultiEnumField {...createFieldProps({ value: ['Option1'], mode: 'search', onChange })} />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('className prop', () => {
    it('applies className in detail mode', () => {
      const { container } = render(
        <MultiEnumField {...createFieldProps({ value: ['Option1'], className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies className in edit mode', () => {
      const { container } = render(
        <MultiEnumField {...createFieldProps({ value: [], mode: 'edit', className: 'custom-class' })} />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
