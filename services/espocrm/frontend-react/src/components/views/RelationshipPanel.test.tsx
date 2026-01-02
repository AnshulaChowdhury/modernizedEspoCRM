/**
 * RelationshipPanel Component Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { RelationshipPanel, RelationshipPanels } from './RelationshipPanel';

// Mock API client
vi.mock('@/api/client', () => ({
  get: vi.fn(),
  del: vi.fn(),
}));

import { get, del } from '@/api/client';

const mockGet = vi.mocked(get);
const mockDel = vi.mocked(del);

// Mock useMetadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: () => ({
    metadata: {
      entityDefs: {
        Account: {
          links: {
            contacts: { type: 'hasMany', entity: 'Contact' },
            opportunities: { type: 'hasMany', entity: 'Opportunity' },
          },
          fields: {},
        },
        Contact: {
          links: {},
          fields: {
            name: { type: 'varchar' },
            emailAddress: { type: 'email' },
          },
        },
        Opportunity: {
          links: {},
          fields: {
            name: { type: 'varchar' },
            amount: { type: 'currency' },
          },
        },
      },
    },
  }),
}));

// Mock FieldRenderer
vi.mock('@/fields', () => ({
  FieldRenderer: ({ value }: { value: unknown }) => <span>{String(value)}</span>,
  initializeFieldTypes: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

const sampleRecords = [
  { id: 'con-001', name: 'John Doe', emailAddress: 'john@example.com' },
  { id: 'con-002', name: 'Jane Smith', emailAddress: 'jane@example.com' },
];

describe('RelationshipPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      total: 2,
      list: sampleRecords,
    });
  });

  describe('rendering', () => {
    it('renders panel title from link name', async () => {
      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Contacts')).toBeInTheDocument();
    });

    it('renders custom title when provided', async () => {
      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
          title="Related People"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Related People')).toBeInTheDocument();
    });

    it('shows total count badge', async () => {
      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('shows loading state', async () => {
      mockGet.mockImplementation(() => new Promise(() => {}));

      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows related records', async () => {
      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('shows empty state when no records', async () => {
      mockGet.mockResolvedValue({ total: 0, list: [] });

      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText(/no related contacts found/i)).toBeInTheDocument();
      });
    });

    it('shows error state on API error', async () => {
      mockGet.mockRejectedValue(new Error('API Error'));

      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading related records/i)).toBeInTheDocument();
      });
    });
  });

  describe('collapsing', () => {
    it('starts expanded by default', async () => {
      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('starts collapsed when defaultExpanded is false', () => {
      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
          defaultExpanded={false}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('toggles when header clicked', async () => {
      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click header to collapse
      fireEvent.click(screen.getByText('Contacts'));
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

      // Click header to expand
      fireEvent.click(screen.getByText('Contacts'));
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('record links', () => {
    it('renders links to view related records', async () => {
      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /john doe/i });
        expect(link).toHaveAttribute('href', '/Contact/view/con-001');
      });
    });
  });

  describe('show all', () => {
    it('shows "Show all" button when more records exist', async () => {
      mockGet.mockResolvedValue({
        total: 10,
        list: sampleRecords,
      });

      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
          maxSize={5}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /show all 10/i })).toBeInTheDocument();
      });
    });

    it('hides "Show all" when all records loaded', async () => {
      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('shows add button', async () => {
      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        // Find the add button (Plus icon)
        const addButton = screen.getAllByRole('link')[0];
        expect(addButton).toBeInTheDocument();
      });
    });

    it('shows link button for hasMany relationships', async () => {
      render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByTitle('Link existing')).toBeInTheDocument();
      });
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      const { container } = render(
        <RelationshipPanel
          entityType="Account"
          recordId="acc-001"
          linkName="contacts"
          className="custom-panel"
        />,
        { wrapper: createWrapper() }
      );

      expect(container.firstChild).toHaveClass('custom-panel');
    });
  });
});

describe('RelationshipPanels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ total: 0, list: [] });
  });

  it('renders all hasMany relationship panels', async () => {
    render(
      <RelationshipPanels
        entityType="Account"
        recordId="acc-001"
      />,
      { wrapper: createWrapper() }
    );

    // Should show both contacts and opportunities panels
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Opportunities')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <RelationshipPanels
        entityType="Account"
        recordId="acc-001"
        className="custom-panels"
      />,
      { wrapper: createWrapper() }
    );

    expect(container.firstChild).toHaveClass('custom-panels');
  });
});
