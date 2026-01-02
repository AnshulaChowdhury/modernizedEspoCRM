/**
 * LayoutRenderer Tests
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { FieldDef } from '@/fields/types';
import type { DetailLayout, ListLayout } from './types';

// Mock FieldRenderer - must be before LayoutRenderer import
vi.mock('@/fields', () => ({
  FieldRenderer: ({ name, value, mode }: { name: string; value: unknown; mode: string }) => (
    <span data-testid={`field-${name}`} data-mode={mode}>
      {String(value ?? '')}
    </span>
  ),
}));

// Mock InlineEditableField
vi.mock('@/fields/InlineEditableField', () => ({
  InlineEditableField: ({ name, value }: { name: string; value: unknown }) => (
    <span data-testid={`inline-${name}`}>{String(value ?? '')}</span>
  ),
}));

// Mock useDynamicLogic
vi.mock('@/lib/dynamicLogic', () => ({
  useDynamicLogic: () => ({
    isFieldVisible: () => true,
    isFieldRequired: () => false,
    isFieldReadOnly: () => false,
    getFilteredOptions: () => undefined,
    getPanelState: () => ({ visible: true }),
  }),
}));

// Import after mocks
import { LayoutRenderer } from './LayoutRenderer';

describe('LayoutRenderer', () => {
  describe('detail layout', () => {
    const basicLayout: DetailLayout = [
      {
        label: 'Overview',
        rows: [
          [
            { name: 'name' },
            { name: 'status' },
          ],
          [
            { name: 'description', fullWidth: true },
          ],
        ],
      },
    ];

    const fieldDefs: Record<string, FieldDef> = {
      name: { type: 'varchar' },
      status: { type: 'enum', options: ['New', 'In Progress', 'Done'] },
      description: { type: 'text' },
    };

    const record = {
      id: '1',
      name: 'Test Record',
      status: 'New',
      description: 'Test description',
    };

    it('should render a basic detail layout', () => {
      render(
        <LayoutRenderer
          layout={basicLayout}
          type="detail"
          fieldDefs={fieldDefs}
          record={record}
          entityType="Task"
          mode="detail"
        />
      );

      expect(screen.getByTestId('field-name')).toHaveTextContent('Test Record');
      expect(screen.getByTestId('field-status')).toHaveTextContent('New');
      expect(screen.getByTestId('field-description')).toHaveTextContent('Test description');
    });

    it('should render panel labels', () => {
      render(
        <LayoutRenderer
          layout={basicLayout}
          type="detail"
          fieldDefs={fieldDefs}
          record={record}
          entityType="Task"
          mode="detail"
        />
      );

      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    it('should render with custom panel label', () => {
      const layoutWithCustomLabel: DetailLayout = [
        {
          label: 'Original',
          customLabel: 'Custom Panel Name',
          rows: [[{ name: 'name' }]],
        },
      ];

      render(
        <LayoutRenderer
          layout={layoutWithCustomLabel}
          type="detail"
          fieldDefs={fieldDefs}
          record={record}
          entityType="Task"
          mode="detail"
        />
      );

      expect(screen.getByText('Custom Panel Name')).toBeInTheDocument();
      expect(screen.queryByText('Original')).not.toBeInTheDocument();
    });

    it('should hide panels with hidden=true', () => {
      const layoutWithHidden: DetailLayout = [
        {
          label: 'Visible Panel',
          rows: [[{ name: 'name' }]],
        },
        {
          label: 'Hidden Panel',
          hidden: true,
          rows: [[{ name: 'status' }]],
        },
      ];

      render(
        <LayoutRenderer
          layout={layoutWithHidden}
          type="detail"
          fieldDefs={fieldDefs}
          record={record}
          entityType="Task"
          mode="detail"
        />
      );

      expect(screen.getByText('Visible Panel')).toBeInTheDocument();
      expect(screen.queryByText('Hidden Panel')).not.toBeInTheDocument();
    });

    it('should skip fields not in fieldDefs', () => {
      const layoutWithMissing: DetailLayout = [
        {
          rows: [[{ name: 'name' }, { name: 'nonExistentField' }]],
        },
      ];

      render(
        <LayoutRenderer
          layout={layoutWithMissing}
          type="detail"
          fieldDefs={fieldDefs}
          record={record}
          entityType="Task"
          mode="detail"
        />
      );

      expect(screen.getByTestId('field-name')).toBeInTheDocument();
      expect(screen.queryByTestId('field-nonExistentField')).not.toBeInTheDocument();
    });

    it('should handle false cells in rows', () => {
      const layoutWithFalse: DetailLayout = [
        {
          rows: [[{ name: 'name' }, false as unknown as { name: string }]],
        },
      ];

      render(
        <LayoutRenderer
          layout={layoutWithFalse}
          type="detail"
          fieldDefs={fieldDefs}
          record={record}
          entityType="Task"
          mode="detail"
        />
      );

      expect(screen.getByTestId('field-name')).toBeInTheDocument();
    });

    it('should render empty rows gracefully', () => {
      const layoutWithEmpty: DetailLayout = [
        {
          rows: [[], [{ name: 'name' }]],
        },
      ];

      render(
        <LayoutRenderer
          layout={layoutWithEmpty}
          type="detail"
          fieldDefs={fieldDefs}
          record={record}
          entityType="Task"
          mode="detail"
        />
      );

      expect(screen.getByTestId('field-name')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    const layout: DetailLayout = [
      {
        rows: [[{ name: 'name' }, { name: 'email' }]],
      },
    ];

    const fieldDefs: Record<string, FieldDef> = {
      name: { type: 'varchar', required: true },
      email: { type: 'email' },
    };

    it('should render in edit mode', () => {
      const handleChange = vi.fn();

      render(
        <LayoutRenderer
          layout={layout}
          type="detail"
          fieldDefs={fieldDefs}
          record={{ name: 'Test', email: 'test@example.com' }}
          entityType="Contact"
          mode="edit"
          onChange={handleChange}
        />
      );

      expect(screen.getByTestId('field-name')).toHaveAttribute('data-mode', 'edit');
      expect(screen.getByTestId('field-email')).toHaveAttribute('data-mode', 'edit');
    });

    it('should use formData for edit values', () => {
      render(
        <LayoutRenderer
          layout={layout}
          type="detail"
          fieldDefs={fieldDefs}
          record={{ name: 'Original', email: 'original@example.com' }}
          entityType="Contact"
          mode="edit"
          formData={{ name: 'Updated', email: 'updated@example.com' }}
        />
      );

      expect(screen.getByTestId('field-name')).toHaveTextContent('Updated');
      expect(screen.getByTestId('field-email')).toHaveTextContent('updated@example.com');
    });

    it('should show required indicator for required fields', () => {
      render(
        <LayoutRenderer
          layout={layout}
          type="detail"
          fieldDefs={fieldDefs}
          record={{ name: 'Test', email: 'test@example.com' }}
          entityType="Contact"
          mode="edit"
        />
      );

      // Should have at least one required indicator
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('panel styles', () => {
    const fieldDefs: Record<string, FieldDef> = {
      name: { type: 'varchar' },
    };

    it('should apply default panel style', () => {
      const layout: DetailLayout = [
        {
          style: 'default',
          rows: [[{ name: 'name' }]],
        },
      ];

      const { container } = render(
        <LayoutRenderer
          layout={layout}
          type="detail"
          fieldDefs={fieldDefs}
          record={{ name: 'Test' }}
          entityType="Task"
          mode="detail"
        />
      );

      expect(container.querySelector('.border-border')).toBeInTheDocument();
    });

    it('should apply success panel style', () => {
      const layout: DetailLayout = [
        {
          style: 'success',
          rows: [[{ name: 'name' }]],
        },
      ];

      const { container } = render(
        <LayoutRenderer
          layout={layout}
          type="detail"
          fieldDefs={fieldDefs}
          record={{ name: 'Test' }}
          entityType="Task"
          mode="detail"
        />
      );

      expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
    });

    it('should apply danger panel style', () => {
      const layout: DetailLayout = [
        {
          style: 'danger',
          rows: [[{ name: 'name' }]],
        },
      ];

      const { container } = render(
        <LayoutRenderer
          layout={layout}
          type="detail"
          fieldDefs={fieldDefs}
          record={{ name: 'Test' }}
          entityType="Task"
          mode="detail"
        />
      );

      expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
    });
  });

  describe('field labels', () => {
    const layout: DetailLayout = [
      {
        rows: [
          [{ name: 'firstName' }],
          [{ name: 'lastName', label: 'Surname' }],
          [{ name: 'email', noLabel: true }],
        ],
      },
    ];

    const fieldDefs: Record<string, FieldDef> = {
      firstName: { type: 'varchar' },
      lastName: { type: 'varchar' },
      email: { type: 'email' },
    };

    it('should format field names as labels', () => {
      render(
        <LayoutRenderer
          layout={layout}
          type="detail"
          fieldDefs={fieldDefs}
          record={{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }}
          entityType="Contact"
          mode="detail"
        />
      );

      expect(screen.getByText('First Name')).toBeInTheDocument();
    });

    it('should use custom label when provided', () => {
      render(
        <LayoutRenderer
          layout={layout}
          type="detail"
          fieldDefs={fieldDefs}
          record={{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }}
          entityType="Contact"
          mode="detail"
        />
      );

      expect(screen.getByText('Surname')).toBeInTheDocument();
      expect(screen.queryByText('Last Name')).not.toBeInTheDocument();
    });

    it('should hide label when noLabel is true', () => {
      render(
        <LayoutRenderer
          layout={layout}
          type="detail"
          fieldDefs={fieldDefs}
          record={{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }}
          entityType="Contact"
          mode="detail"
        />
      );

      // Email label should not be present
      expect(screen.queryByText('Email')).not.toBeInTheDocument();
    });
  });

  describe('list layout', () => {
    const listLayout: ListLayout = [
      { name: 'name', width: 30 },
      { name: 'status', width: 20 },
      { name: 'assignedUser', width: 20, align: 'center' },
      { name: 'createdAt', width: 30, align: 'right' },
    ];

    const fieldDefs: Record<string, FieldDef> = {
      name: { type: 'varchar' },
      status: { type: 'enum' },
      assignedUser: { type: 'link' },
      createdAt: { type: 'varchar' },
    };

    const record = {
      name: 'Test Task',
      status: 'Active',
      assignedUser: 'John Doe',
      createdAt: '2024-01-15',
    };

    it('should render a list layout', () => {
      render(
        <LayoutRenderer
          layout={listLayout}
          type="list"
          fieldDefs={fieldDefs}
          record={record}
          entityType="Task"
          mode="list"
        />
      );

      expect(screen.getByTestId('field-name')).toHaveTextContent('Test Task');
      expect(screen.getByTestId('field-status')).toHaveTextContent('Active');
    });

    it('should hide columns with hidden=true', () => {
      const layoutWithHidden: ListLayout = [
        { name: 'name', width: 30 },
        { name: 'status', width: 20, hidden: true },
      ];

      render(
        <LayoutRenderer
          layout={layoutWithHidden}
          type="list"
          fieldDefs={fieldDefs}
          record={record}
          entityType="Task"
          mode="list"
        />
      );

      expect(screen.getByTestId('field-name')).toBeInTheDocument();
      expect(screen.queryByTestId('field-status')).not.toBeInTheDocument();
    });

    it('should skip columns not in fieldDefs', () => {
      const layoutWithMissing: ListLayout = [
        { name: 'name', width: 30 },
        { name: 'nonExistent', width: 20 },
      ];

      render(
        <LayoutRenderer
          layout={layoutWithMissing}
          type="list"
          fieldDefs={fieldDefs}
          record={record}
          entityType="Task"
          mode="list"
        />
      );

      expect(screen.getByTestId('field-name')).toBeInTheDocument();
      expect(screen.queryByTestId('field-nonExistent')).not.toBeInTheDocument();
    });

    it('should apply text alignment styles', () => {
      const { container } = render(
        <LayoutRenderer
          layout={listLayout}
          type="list"
          fieldDefs={fieldDefs}
          record={record}
          entityType="Task"
          mode="list"
        />
      );

      expect(container.querySelector('.text-center')).toBeInTheDocument();
      expect(container.querySelector('.text-right')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    const layout: DetailLayout = [
      {
        rows: [[{ name: 'name' }]],
      },
    ];

    const fieldDefs: Record<string, FieldDef> = {
      name: { type: 'varchar' },
    };

    it('should apply className to detail layout container', () => {
      const { container } = render(
        <LayoutRenderer
          layout={layout}
          type="detail"
          fieldDefs={fieldDefs}
          record={{ name: 'Test' }}
          entityType="Task"
          mode="detail"
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should apply className to list layout container', () => {
      const listLayout: ListLayout = [{ name: 'name' }];

      const { container } = render(
        <LayoutRenderer
          layout={listLayout}
          type="list"
          fieldDefs={fieldDefs}
          record={{ name: 'Test' }}
          entityType="Task"
          mode="list"
          className="list-class"
        />
      );

      expect(container.firstChild).toHaveClass('list-class');
    });
  });
});
