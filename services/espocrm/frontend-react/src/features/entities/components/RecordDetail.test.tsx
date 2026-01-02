/**
 * RecordDetail Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock all external dependencies
vi.mock('@/api/client', () => ({
  get: vi.fn(),
  del: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: () => ({
    metadata: {
      entityDefs: {
        Account: {
          fields: {
            name: { type: 'varchar' },
            website: { type: 'url' },
            description: { type: 'text' },
          },
        },
      },
    },
    isLoading: false,
  }),
}));

vi.mock('@/lib/layout', () => ({
  useDetailLayout: () => ({
    layout: [
      {
        label: 'Overview',
        rows: [
          [{ name: 'name' }, { name: 'website' }],
          [{ name: 'description', fullWidth: true }],
        ],
      },
    ],
    isLoading: false,
  }),
  getDefaultDetailLayout: () => [],
  LayoutRenderer: ({ mode }: { mode: string }) => (
    <div data-testid="layout-renderer" data-mode={mode}>
      Layout Content
    </div>
  ),
}));

vi.mock('@/lib/acl', () => ({
  useAcl: () => ({
    checkModel: vi.fn().mockReturnValue(true),
  }),
}));

vi.mock('@/fields', () => ({
  initializeFieldTypes: vi.fn(),
}));

vi.mock('@/components/views', () => ({
  RelationshipPanels: () => <div data-testid="relationship-panels">Relationships</div>,
  StreamFeed: () => <div data-testid="stream-feed">Stream</div>,
  ActivitiesPanel: () => <div data-testid="activities-panel">Activities</div>,
  HistoryPanel: () => <div data-testid="history-panel">History</div>,
}));

// Import after mocks
import { RecordDetail } from './RecordDetail';
import { get, del, put } from '@/api/client';

const mockGet = vi.mocked(get);
const mockDel = vi.mocked(del);
const mockPut = vi.mocked(put);

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

describe('RecordDetail', () => {
  const mockRecord = {
    id: '123',
    name: 'Acme Corporation',
    website: 'https://acme.com',
    description: 'A test company',
    createdAt: '2024-01-15T10:00:00Z',
    modifiedAt: '2024-01-16T14:30:00Z',
    createdByName: 'Admin User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(mockRecord);
    mockDel.mockResolvedValue(undefined);
    mockPut.mockResolvedValue(mockRecord);
  });

  describe('rendering', () => {
    it('should render loading state initially', async () => {
      mockGet.mockImplementation(() => new Promise(() => {}));

      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render record details after loading', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });
    });

    it('should render error state', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText(/Error loading record/)).toBeInTheDocument();
      });
    });

    it('should render not found state when no record', async () => {
      mockGet.mockResolvedValue(null);

      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Record not found')).toBeInTheDocument();
      });
    });
  });

  describe('header', () => {
    it('should display record name as title', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Acme Corporation' })).toBeInTheDocument();
      });
    });

    it('should display entity type', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Account')).toBeInTheDocument();
      });
    });

    it('should have back button linking to list', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back');
      expect(backButton.closest('a')).toHaveAttribute('href', '/Account');
    });
  });

  describe('actions', () => {
    it('should render Edit button when user has edit permission', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should render Delete button when user has delete permission', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should link Edit button to edit page', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      expect(editButton.closest('a')).toHaveAttribute('href', '/Account/edit/123');
    });
  });

  describe('delete confirmation', () => {
    it('should show delete confirmation modal when Delete is clicked', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Delete Account')).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete "Acme Corporation"/)
      ).toBeInTheDocument();
    });

    it('should close modal when Cancel is clicked', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));
      expect(screen.getByText('Delete Account')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
    });

    it('should call delete API when confirmed', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      // Find the Delete button in the modal (there are two "Delete" texts now)
      const modalButtons = screen.getAllByRole('button');
      const confirmDelete = modalButtons.find(
        (btn) => btn.textContent === 'Delete' && btn.closest('.fixed')
      );
      expect(confirmDelete).toBeTruthy();

      fireEvent.click(confirmDelete!);

      await waitFor(() => {
        expect(mockDel).toHaveBeenCalledWith('/Account/123');
      });
    });

    it('should navigate to list after successful delete', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      const modalButtons = screen.getAllByRole('button');
      const confirmDelete = modalButtons.find(
        (btn) => btn.textContent === 'Delete' && btn.closest('.fixed')
      );
      fireEvent.click(confirmDelete!);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/Account');
      });
    });
  });

  describe('layout renderer', () => {
    it('should render LayoutRenderer with detail mode', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      const layoutRenderer = screen.getByTestId('layout-renderer');
      expect(layoutRenderer).toHaveAttribute('data-mode', 'detail');
    });
  });

  describe('side panels', () => {
    it('should render relationship panels', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('relationship-panels')).toBeInTheDocument();
    });

    it('should render stream feed', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('stream-feed')).toBeInTheDocument();
    });

    it('should render activities panel', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('activities-panel')).toBeInTheDocument();
    });

    it('should render history panel', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('history-panel')).toBeInTheDocument();
    });
  });

  describe('system information', () => {
    it('should display record ID', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      expect(screen.getByText('ID:')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should display created date', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      expect(screen.getByText('Created:')).toBeInTheDocument();
    });

    it('should display modified date', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      expect(screen.getByText('Modified:')).toBeInTheDocument();
    });

    it('should display created by', async () => {
      render(<RecordDetail entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      expect(screen.getByText('Created By:')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('should apply className to container', async () => {
      const { container } = render(
        <RecordDetail entityType="Account" recordId="123" className="custom-class" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
