/**
 * FieldRenderer Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldRenderer } from './FieldRenderer';
import { registerField, fieldRegistry } from './registry';
import type { FieldDef, FieldProps } from './types';

// Clear and reset registry before each test
beforeEach(() => {
  // Clear registry
  Object.keys(fieldRegistry).forEach((key) => {
    delete fieldRegistry[key];
  });
});

// Mock field component
function MockField({ name, value, mode, onChange }: FieldProps) {
  return (
    <div data-testid={`mock-field-${name}`}>
      <span data-testid="mode">{mode}</span>
      <span data-testid="value">{String(value ?? '')}</span>
      {mode === 'edit' && onChange && (
        <input
          data-testid="input"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

describe('FieldRenderer', () => {
  describe('basic rendering', () => {
    it('should render a field with registered component', () => {
      registerField('custom', MockField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="testField"
          value="test value"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
        />
      );

      expect(screen.getByTestId('mock-field-testField')).toBeInTheDocument();
      expect(screen.getByTestId('value')).toHaveTextContent('test value');
      expect(screen.getByTestId('mode')).toHaveTextContent('detail');
    });

    it('should fall back to VarcharField for unregistered types', () => {
      const fieldDef: FieldDef = { type: 'unknownType' };
      render(
        <FieldRenderer
          name="testField"
          value="fallback value"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
        />
      );

      // VarcharField should render the value as text
      expect(screen.getByText('fallback value')).toBeInTheDocument();
    });

    it('should render in list mode', () => {
      registerField('custom', MockField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="testField"
          value="list value"
          fieldDef={fieldDef}
          mode="list"
          entityType="Account"
        />
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('list');
    });

    it('should render in edit mode with onChange', () => {
      registerField('custom', MockField);
      const handleChange = vi.fn();

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="testField"
          value="edit value"
          fieldDef={fieldDef}
          mode="edit"
          entityType="Account"
          onChange={handleChange}
        />
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('edit');

      // Trigger change
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { value: 'new value' } });
      expect(handleChange).toHaveBeenCalledWith('new value');
    });
  });

  describe('with label', () => {
    it('should render with label when showLabel is true', () => {
      registerField('custom', MockField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
          showLabel
        />
      );

      // Should format field name as label: "testField" -> "Test Field"
      expect(screen.getByText('Test Field')).toBeInTheDocument();
    });

    it('should use custom label when provided', () => {
      registerField('custom', MockField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
          showLabel
          label="Custom Label"
        />
      );

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('should show required indicator in edit mode', () => {
      registerField('custom', MockField);

      const fieldDef: FieldDef = { type: 'custom', required: true };
      render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="edit"
          entityType="Account"
          showLabel
        />
      );

      // Should have required indicator
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not show required indicator in detail mode', () => {
      registerField('custom', MockField);

      const fieldDef: FieldDef = { type: 'custom', required: true };
      render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
          showLabel
        />
      );

      // Should NOT have required indicator in detail mode
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('should not show label in list mode', () => {
      registerField('custom', MockField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="list"
          entityType="Account"
          showLabel
        />
      );

      // Label should not appear in list mode
      expect(screen.queryByText('Test Field')).not.toBeInTheDocument();
    });
  });

  describe('field properties', () => {
    it('should pass disabled from props', () => {
      function DisabledField({ disabled }: FieldProps) {
        return <span data-testid="disabled">{disabled ? 'yes' : 'no'}</span>;
      }
      registerField('custom', DisabledField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="edit"
          entityType="Account"
          disabled
        />
      );

      expect(screen.getByTestId('disabled')).toHaveTextContent('yes');
    });

    it('should use fieldDef.disabled when prop not provided', () => {
      function DisabledField({ disabled }: FieldProps) {
        return <span data-testid="disabled">{disabled ? 'yes' : 'no'}</span>;
      }
      registerField('custom', DisabledField);

      const fieldDef: FieldDef = { type: 'custom', disabled: true };
      render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="edit"
          entityType="Account"
        />
      );

      expect(screen.getByTestId('disabled')).toHaveTextContent('yes');
    });

    it('should pass readOnly from props', () => {
      function ReadOnlyField({ readOnly }: FieldProps) {
        return <span data-testid="readonly">{readOnly ? 'yes' : 'no'}</span>;
      }
      registerField('custom', ReadOnlyField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="edit"
          entityType="Account"
          readOnly
        />
      );

      expect(screen.getByTestId('readonly')).toHaveTextContent('yes');
    });

    it('should pass record data to field component', () => {
      function RecordField({ record }: FieldProps) {
        return <span data-testid="record">{JSON.stringify(record)}</span>;
      }
      registerField('custom', RecordField);

      const fieldDef: FieldDef = { type: 'custom' };
      const record = { id: '123', name: 'Test', status: 'active' };
      render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
          record={record}
        />
      );

      expect(screen.getByTestId('record')).toHaveTextContent('{"id":"123","name":"Test","status":"active"}');
    });

    it('should pass entityType to field component', () => {
      function EntityField({ entityType }: FieldProps) {
        return <span data-testid="entity">{entityType}</span>;
      }
      registerField('custom', EntityField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
        />
      );

      expect(screen.getByTestId('entity')).toHaveTextContent('Account');
    });
  });

  describe('formatFieldLabel', () => {
    it('should format camelCase field names', () => {
      registerField('custom', MockField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="assignedUserId"
          value="test"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
          showLabel
        />
      );

      expect(screen.getByText('Assigned User Id')).toBeInTheDocument();
    });

    it('should handle single word field names', () => {
      registerField('custom', MockField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="name"
          value="test"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
          showLabel
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should capitalize first letter', () => {
      registerField('custom', MockField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="website"
          value="test"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
          showLabel
        />
      );

      expect(screen.getByText('Website')).toBeInTheDocument();
    });
  });

  describe('className handling', () => {
    it('should pass className to field when showLabel is false', () => {
      function ClassField({ className }: FieldProps) {
        return <span data-testid="class">{className ?? 'no-class'}</span>;
      }
      registerField('custom', ClassField);

      const fieldDef: FieldDef = { type: 'custom' };
      render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
          className="custom-class"
        />
      );

      expect(screen.getByTestId('class')).toHaveTextContent('custom-class');
    });

    it('should apply className to wrapper when showLabel is true', () => {
      registerField('custom', MockField);

      const fieldDef: FieldDef = { type: 'custom' };
      const { container } = render(
        <FieldRenderer
          name="testField"
          value="test"
          fieldDef={fieldDef}
          mode="detail"
          entityType="Account"
          showLabel
          className="wrapper-class"
        />
      );

      // The wrapper div should have the class
      expect(container.firstChild).toHaveClass('wrapper-class');
    });
  });
});
