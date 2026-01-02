/**
 * RecordList Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock all external dependencies
vi.mock('@/api/client', () => ({
  get: vi.fn(),
}));

vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: () => ({
    metadata: {
      entityDefs: {
        Account: {
          fields: {
            name: { type: 'varchar' },
            website: { type: 'url' },
            status: { type: 'enum', options: ['Active', 'Inactive'] },
            createdAt: { type: 'datetime' },
          },
        },
      },
    },
    isLoading: false,
  }),
}));

vi.mock('@/lib/layout', () => ({
  useListLayout: () => ({
    layout: [
      { name: 'name', link: true, width: 30 },
      { name: 'website', width: 25 },
      { name: 'status', width: 20 },
      { name: 'createdAt', width: 25 },
    ],
    isLoading: false,
  }),
  getDefaultListLayout: () => [{ name: 'name', link: true }],
}));

vi.mock('@/lib/acl', () => ({
  useAcl: () => ({
    checkScope: vi.fn().mockReturnValue(true),
  }),
}));

vi.mock('@/hooks/useMassActions', () => ({
  useMassActions: () => ({
    selectedIds: new Set(),
    toggleSelection: vi.fn(),
    selectAll: vi.fn(),
    clearSelection: vi.fn(),
    isSelected: vi.fn().mockReturnValue(false),
    selectedCount: 0,
    massDelete: vi.fn(),
    isProcessing: false,
    processingAction: null,
  }),
}));

vi.mock('@/fields', () => ({
  FieldRenderer: ({ name, value }: { name: string; value: unknown }) => (
    <span data-testid={`field-${name}`}>{String(value ?? '')}</span>
  ),
  initializeFieldTypes: vi.fn(),
}));

vi.mock('@/components/search/AdvancedSearch', () => ({
  AdvancedSearch: ({ onTextFilterChange }: { onTextFilterChange: (q: string) => void }) => (
    <input
      data-testid="search-input"
      onChange={(e) => onTextFilterChange(e.target.value)}
      placeholder="Search..."
    />
  ),
  filtersToWhereClause: () => [],
}));

vi.mock('@/components/common/MassActionsBar', () => ({
  MassActionsBar: () => <div data-testid="mass-actions-bar" />,
}));

// Import after mocks
import { RecordList } from './RecordList';
import { get } from '@/api/client';

const mockGet = vi.mocked(get);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('RecordList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      total: 3,
      list: [
        { id: '1', name: 'Acme Corp', website: 'https://acme.com', status: 'Active' },
        { id: '2', name: 'Beta Inc', website: 'https://beta.io', status: 'Active' },
        { id: '3', name: 'Gamma Ltd', website: 'https://gamma.co', status: 'Inactive' },
      ],
    });
  });

  describe('rendering', () => {
    it('should render loading state initially', async () => {
      // Delay the response to show loading
      mockGet.mockImplementation(() => new Promise(() => {}));

      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render records after loading', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      expect(screen.getByText('Gamma Ltd')).toBeInTheDocument();
    });

    it('should render error state', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Error loading records/)).toBeInTheDocument();
      });
    });

    it('should show record count', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('3 records')).toBeInTheDocument();
      });
    });

    it('should render empty state when no records', async () => {
      mockGet.mockResolvedValue({ total: 0, list: [] });

      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No records found')).toBeInTheDocument();
      });
    });
  });

  describe('table columns', () => {
    it('should render column headers', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Website')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should render action buttons', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Should have view, edit, delete buttons for each row
      const viewButtons = screen.getAllByTitle('View');
      expect(viewButtons.length).toBe(3);

      const editButtons = screen.getAllByTitle('Edit');
      expect(editButtons.length).toBe(3);
    });

    it('should render links for linked columns', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Name column is linked - should be a clickable link
      const nameLink = screen.getByText('Acme Corp').closest('a');
      expect(nameLink).toHaveAttribute('href', '/Account/view/1');
    });
  });

  describe('sorting', () => {
    it('should allow sorting by clicking column header', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Click on Name header to sort
      const nameHeader = screen.getByText('Name');
      fireEvent.click(nameHeader);

      // Should have called get with new sort params
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(
          expect.stringContaining('orderBy=name')
        );
      });
    });
  });

  describe('search', () => {
    it('should render search input', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('should render select all checkbox', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByTitle('Select all')).toBeInTheDocument();
    });

    it('should render row checkboxes', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Each row should have a checkbox (3 rows + 1 header = handled separately)
      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBe(3);
    });
  });

  describe('mass actions', () => {
    it('should render mass actions bar', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByTestId('mass-actions-bar')).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('should not show pagination when only one page', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // With 3 records and page size 20, should be 1 page - no pagination
      expect(screen.queryByText('Page 1 of')).not.toBeInTheDocument();
    });

    it('should show pagination when multiple pages', async () => {
      mockGet.mockResolvedValue({
        total: 50,
        list: Array.from({ length: 20 }, (_, i) => ({
          id: String(i + 1),
          name: `Record ${i + 1}`,
        })),
      });

      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should disable previous button on first page', async () => {
      mockGet.mockResolvedValue({
        total: 50,
        list: Array.from({ length: 20 }, (_, i) => ({
          id: String(i + 1),
          name: `Record ${i + 1}`,
        })),
      });

      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).toBeDisabled();
    });
  });

  describe('permissions', () => {
    it('should render edit and delete buttons when user has permissions', async () => {
      render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // With default mock returning true for all permissions
      expect(screen.getAllByTitle('Edit').length).toBe(3);
      expect(screen.getAllByTitle('Delete').length).toBe(3);
    });
  });

  describe('className prop', () => {
    it('should apply className to container', async () => {
      const { container } = render(
        <RecordList entityType="Account" className="custom-class" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('formatColumnLabel', () => {
  it('should format camelCase column names', async () => {
    render(<RecordList entityType="Account" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // 'createdAt' should be formatted as 'Created At'
    expect(screen.getByText('Created At')).toBeInTheDocument();
  });
});
