/**
 * EntityListPage Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EntityListPage from './EntityListPage';

// Mock API client
vi.mock('@/api/client', () => ({
  get: vi.fn().mockResolvedValue({ total: 0, list: [] }),
}));

// Mock useMetadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: () => ({
    metadata: {
      entityDefs: {
        Account: {
          fields: {
            name: { type: 'varchar' },
            status: { type: 'enum', options: ['Active', 'Inactive'] },
            createdAt: { type: 'datetime' },
          },
        },
      },
      scopes: { Account: { entity: true } },
    },
    isLoading: false,
    error: null,
    isEntityEnabled: (entityType: string) => entityType === 'Account',
  }),
}));

// Mock useAcl
vi.mock('@/lib/acl', () => ({
  useAcl: () => ({
    checkScope: () => true,
  }),
}));

// Mock child components to simplify tests
vi.mock('../components', () => ({
  RecordList: () => <div data-testid="record-list">Record List</div>,
}));

vi.mock('@/components/views/KanbanBoard', () => ({
  KanbanBoard: () => <div data-testid="kanban-board">Kanban Board</div>,
}));

vi.mock('@/components/views/CalendarView', () => ({
  CalendarView: () => <div data-testid="calendar-view">Calendar View</div>,
}));

vi.mock('@/components/export/ExportModal', () => ({
  ExportModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="export-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
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
        <MemoryRouter initialEntries={['/Account']}>
          <Routes>
            <Route path="/:entityType" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('EntityListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders entity title', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });
      expect(screen.getByText('Account')).toBeInTheDocument();
    });

    it('renders record list by default', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('record-list')).toBeInTheDocument();
    });

    it('renders create button when user has create permission', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });
      expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders export button', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('renders view mode toggle buttons', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });
      expect(screen.getByTitle('List view')).toBeInTheDocument();
      expect(screen.getByTitle('Calendar view')).toBeInTheDocument();
    });

    it('renders kanban toggle when entity has enum field', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });
      expect(screen.getByTitle('Kanban view')).toBeInTheDocument();
    });
  });

  describe('view mode switching', () => {
    it('shows list view by default', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('record-list')).toBeInTheDocument();
    });

    it('switches to kanban view', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByTitle('Kanban view'));
      expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    });

    it('switches to calendar view', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByTitle('Calendar view'));
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
    });

    it('switches back to list view', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByTitle('Calendar view'));
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();

      fireEvent.click(screen.getByTitle('List view'));
      expect(screen.getByTestId('record-list')).toBeInTheDocument();
    });
  });

  describe('export modal', () => {
    it('opens export modal when export button clicked', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole('button', { name: /export/i }));
      expect(screen.getByTestId('export-modal')).toBeInTheDocument();
    });

    it('closes export modal', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole('button', { name: /export/i }));
      expect(screen.getByTestId('export-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('export-modal')).not.toBeInTheDocument();
    });
  });

  describe('create link', () => {
    it('links to create page', () => {
      render(<EntityListPage />, { wrapper: createWrapper() });

      const createLink = screen.getByRole('link', { name: /create account/i });
      expect(createLink).toHaveAttribute('href', '/Account/create');
    });
  });
});

// Note: Additional tests for disabled entity and loading states would require
// more complex mock setup with beforeEach overrides. The main functionality
// is covered by the tests above.
