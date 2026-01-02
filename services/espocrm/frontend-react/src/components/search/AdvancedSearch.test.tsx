/**
 * AdvancedSearch Component Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdvancedSearch, filtersToWhereClause, SearchFilter } from './AdvancedSearch';

// Mock useMetadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: () => ({
    metadata: {
      entityDefs: {
        Account: {
          fields: {
            name: { type: 'varchar' },
            status: { type: 'enum', options: ['Active', 'Inactive', 'Pending'] },
            amount: { type: 'float' },
            createdAt: { type: 'datetime' },
            isActive: { type: 'bool' },
            description: { type: 'text' },
          },
        },
      },
    },
  }),
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
});

describe('AdvancedSearch', () => {
  const defaultProps = {
    entityType: 'Account',
    filters: [] as SearchFilter[],
    onFiltersChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('text search', () => {
    it('renders search input', () => {
      render(<AdvancedSearch {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search Account...')).toBeInTheDocument();
    });

    it('shows current text filter value', () => {
      render(<AdvancedSearch {...defaultProps} textFilter="test query" />);
      expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    });

    it('calls onTextFilterChange when typing', () => {
      const onTextFilterChange = vi.fn();
      render(
        <AdvancedSearch
          {...defaultProps}
          onTextFilterChange={onTextFilterChange}
        />
      );

      fireEvent.change(screen.getByPlaceholderText('Search Account...'), {
        target: { value: 'new search' },
      });

      expect(onTextFilterChange).toHaveBeenCalledWith('new search');
    });
  });

  describe('filter button', () => {
    it('renders filter button', () => {
      render(<AdvancedSearch {...defaultProps} />);
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    it('shows filter count badge when filters exist', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'equals', value: 'Test' },
        { id: '2', field: 'status', operator: 'equals', value: 'Active' },
      ];

      render(<AdvancedSearch {...defaultProps} filters={filters} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('toggles filter panel on click', () => {
      render(<AdvancedSearch {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /filters/i }));
      expect(screen.getByText('Add filter')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /filters/i }));
      expect(screen.queryByText('Add filter')).not.toBeInTheDocument();
    });
  });

  describe('clear button', () => {
    it('shows clear button when text filter exists', () => {
      render(<AdvancedSearch {...defaultProps} textFilter="test" />);
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('shows clear button when filters exist', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'equals', value: 'Test' },
      ];

      render(<AdvancedSearch {...defaultProps} filters={filters} />);
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('hides clear button when no filters or text', () => {
      render(<AdvancedSearch {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    it('clears all filters and text when clicked', () => {
      const onFiltersChange = vi.fn();
      const onTextFilterChange = vi.fn();
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'equals', value: 'Test' },
      ];

      render(
        <AdvancedSearch
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
          textFilter="test"
          onTextFilterChange={onTextFilterChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /clear/i }));

      expect(onFiltersChange).toHaveBeenCalledWith([]);
      expect(onTextFilterChange).toHaveBeenCalledWith('');
    });
  });

  describe('filter panel', () => {
    it('opens automatically when filters exist', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'equals', value: 'Test' },
      ];

      render(<AdvancedSearch {...defaultProps} filters={filters} />);
      expect(screen.getByText('Add filter')).toBeInTheDocument();
    });

    it('shows existing filters', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'equals', value: 'Test' },
      ];

      render(<AdvancedSearch {...defaultProps} filters={filters} />);

      // Check that the filter row exists with correct field selected
      const fieldSelect = screen.getAllByRole('combobox')[0];
      expect(fieldSelect).toHaveValue('name');
    });
  });

  describe('adding filters', () => {
    it('adds a new filter when "Add filter" clicked', () => {
      const onFiltersChange = vi.fn();
      render(
        <AdvancedSearch {...defaultProps} onFiltersChange={onFiltersChange} />
      );

      fireEvent.click(screen.getByRole('button', { name: /filters/i }));
      fireEvent.click(screen.getByRole('button', { name: /add filter/i }));

      expect(onFiltersChange).toHaveBeenCalledWith([
        expect.objectContaining({
          field: expect.any(String),
          operator: expect.any(String),
        }),
      ]);
    });
  });

  describe('updating filters', () => {
    it('updates field when changed', () => {
      const onFiltersChange = vi.fn();
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'equals', value: 'Test' },
      ];

      render(
        <AdvancedSearch
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      );

      const fieldSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(fieldSelect, { target: { value: 'status' } });

      expect(onFiltersChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: '1',
          field: 'status',
        }),
      ]);
    });

    it('updates operator when changed', () => {
      const onFiltersChange = vi.fn();
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'equals', value: 'Test' },
      ];

      render(
        <AdvancedSearch
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      );

      const operatorSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(operatorSelect, { target: { value: 'contains' } });

      expect(onFiltersChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: '1',
          operator: 'contains',
        }),
      ]);
    });

    it('updates value when changed', () => {
      const onFiltersChange = vi.fn();
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'equals', value: 'Test' },
      ];

      render(
        <AdvancedSearch
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      );

      const valueInput = screen.getByPlaceholderText('Value');
      fireEvent.change(valueInput, { target: { value: 'New Value' } });

      expect(onFiltersChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: '1',
          value: 'New Value',
        }),
      ]);
    });
  });

  describe('removing filters', () => {
    it('removes filter when X clicked', () => {
      const onFiltersChange = vi.fn();
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'equals', value: 'Test' },
        { id: '2', field: 'status', operator: 'equals', value: 'Active' },
      ];

      render(
        <AdvancedSearch
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      );

      // Click the first remove button
      const removeButtons = screen.getAllByRole('button').filter(
        (btn) => btn.className.includes('destructive')
      );
      fireEvent.click(removeButtons[0]);

      expect(onFiltersChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: '2' }),
      ]);
    });
  });

  describe('field type operators', () => {
    it('shows text operators for varchar field', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'equals', value: '' },
      ];

      render(<AdvancedSearch {...defaultProps} filters={filters} />);

      const operatorSelect = screen.getAllByRole('combobox')[1];
      expect(operatorSelect).toContainElement(screen.getByText('equals'));
      expect(operatorSelect).toContainElement(screen.getByText('contains'));
      expect(operatorSelect).toContainElement(screen.getByText('starts with'));
    });

    it('shows boolean operators for bool field', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'isActive', operator: 'isTrue', value: '' },
      ];

      render(<AdvancedSearch {...defaultProps} filters={filters} />);

      const operatorSelect = screen.getAllByRole('combobox')[1];
      expect(operatorSelect).toContainElement(screen.getByText('is true'));
      expect(operatorSelect).toContainElement(screen.getByText('is false'));
    });

    it('shows date operators for datetime field', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'createdAt', operator: 'today', value: '' },
      ];

      render(<AdvancedSearch {...defaultProps} filters={filters} />);

      const operatorSelect = screen.getAllByRole('combobox')[1];
      expect(operatorSelect).toContainElement(screen.getByText('today'));
      expect(operatorSelect).toContainElement(screen.getByText('in past'));
      expect(operatorSelect).toContainElement(screen.getByText('in future'));
    });
  });

  describe('value inputs', () => {
    it('shows text input for varchar fields', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'equals', value: '' },
      ];

      render(<AdvancedSearch {...defaultProps} filters={filters} />);
      expect(screen.getByPlaceholderText('Value')).toHaveAttribute('type', 'text');
    });

    it('shows select for enum fields', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'status', operator: 'equals', value: '' },
      ];

      render(<AdvancedSearch {...defaultProps} filters={filters} />);

      // Should have a select with enum options
      const selects = screen.getAllByRole('combobox');
      const valueSelect = selects[2]; // Third select is for value
      expect(valueSelect).toContainElement(screen.getByText('Active'));
      expect(valueSelect).toContainElement(screen.getByText('Inactive'));
      expect(valueSelect).toContainElement(screen.getByText('Pending'));
    });

    it('shows number input for float fields', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'amount', operator: 'greaterThan', value: '' },
      ];

      render(<AdvancedSearch {...defaultProps} filters={filters} />);
      expect(screen.getByPlaceholderText('Value')).toHaveAttribute('type', 'number');
    });

    it('shows date input for datetime fields with value operator', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'createdAt', operator: 'equals', value: '' },
      ];

      const { container } = render(<AdvancedSearch {...defaultProps} filters={filters} />);
      // Date inputs are rendered as type="date" but may appear as textbox in some environments
      const dateInput = container.querySelector('input[type="date"]');
      expect(dateInput).toBeInTheDocument();
    });

    it('hides value input for no-value operators', () => {
      const filters: SearchFilter[] = [
        { id: '1', field: 'name', operator: 'isEmpty', value: null },
      ];

      render(<AdvancedSearch {...defaultProps} filters={filters} />);
      expect(screen.queryByPlaceholderText('Value')).not.toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      const { container } = render(
        <AdvancedSearch {...defaultProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('filtersToWhereClause', () => {
  it('converts filters to where clause format', () => {
    const filters: SearchFilter[] = [
      { id: '1', field: 'name', operator: 'equals', value: 'Test' },
      { id: '2', field: 'status', operator: 'in', value: ['Active', 'Pending'] },
    ];

    const result = filtersToWhereClause(filters);

    expect(result).toEqual([
      { type: 'equals', attribute: 'name', value: 'Test' },
      { type: 'in', attribute: 'status', value: ['Active', 'Pending'] },
    ]);
  });

  it('returns empty array for no filters', () => {
    expect(filtersToWhereClause([])).toEqual([]);
  });
});
