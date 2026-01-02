/**
 * DashboardPage Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

// Mock API client
vi.mock('@/api/client', () => ({
  get: vi.fn(),
}));

import { get } from '@/api/client';

const mockGet = vi.mocked(get);

// Mock useAuthStore
vi.mock('@/features/auth/store', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', name: 'John Doe', userName: 'johndoe' },
  }),
}));

// Mock useMetadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: () => ({
    metadata: {
      entityDefs: {
        Account: { fields: {} },
        Contact: { fields: {} },
        Lead: { fields: {} },
        Opportunity: { fields: {} },
        Email: { fields: {} },
        Meeting: { fields: {} },
        Task: { fields: {} },
      },
    },
    isEntityEnabled: (entityType: string) => ['Account', 'Contact', 'Lead', 'Opportunity', 'Email', 'Meeting', 'Task'].includes(entityType),
  }),
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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation(async (url: string) => {
      if (url === '/GlobalStream?maxSize=10') {
        return {
          total: 2,
          list: [
            {
              id: 'note-1',
              type: 'Create',
              parentType: 'Account',
              parentId: 'acc-001',
              parentName: 'Acme Corp',
              createdAt: new Date().toISOString(),
              createdByName: 'Admin',
            },
            {
              id: 'note-2',
              type: 'Update',
              parentType: 'Contact',
              parentId: 'con-001',
              parentName: 'Jane Smith',
              createdAt: new Date().toISOString(),
              createdByName: 'John Doe',
            },
          ],
        };
      }
      if (url === '/Task') {
        return {
          total: 2,
          list: [
            {
              id: 'task-1',
              name: 'Follow up with client',
              status: 'Not Started',
              priority: 'High',
              dateEnd: new Date().toISOString(),
            },
            {
              id: 'task-2',
              name: 'Prepare report',
              status: 'Not Started',
              priority: 'Normal',
            },
          ],
        };
      }
      // Entity count requests
      return { total: 42, list: [] };
    });
  });

  describe('rendering', () => {
    it('renders dashboard title', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders welcome message with user name', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });
      expect(screen.getByText('Welcome back, John Doe')).toBeInTheDocument();
    });

    it('renders entity count cards', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Accounts')).toBeInTheDocument();
      expect(screen.getByText('Contacts')).toBeInTheDocument();
      expect(screen.getByText('Leads')).toBeInTheDocument();
      expect(screen.getByText('Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Emails')).toBeInTheDocument();
      expect(screen.getByText('Meetings')).toBeInTheDocument();
    });

    it('renders My Tasks section', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });
      expect(screen.getByText('My Tasks')).toBeInTheDocument();
    });

    it('renders Activity Stream section', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });
      expect(screen.getByText('Activity Stream')).toBeInTheDocument();
    });

    it('renders React Migration notice', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });
      expect(screen.getByText('React Migration')).toBeInTheDocument();
    });
  });

  describe('entity counts', () => {
    it('displays entity count after loading', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Should display count (42) for each entity
        const counts = screen.getAllByText('42');
        expect(counts.length).toBeGreaterThan(0);
      });
    });

    it('links to entity list page', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });

      const accountLink = screen.getByText('Accounts').closest('a');
      expect(accountLink).toHaveAttribute('href', '/Account');
    });
  });

  describe('tasks dashlet', () => {
    it('displays task list after loading', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Follow up with client')).toBeInTheDocument();
        expect(screen.getByText('Prepare report')).toBeInTheDocument();
      });
    });

    it('shows task priority badge', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('High')).toBeInTheDocument();
        expect(screen.getByText('Normal')).toBeInTheDocument();
      });
    });

    it('links task to detail page', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const taskLink = screen.getByText('Follow up with client');
        expect(taskLink).toHaveAttribute('href', '/Task/view/task-1');
      });
    });

    it('shows empty state when no tasks', async () => {
      mockGet.mockImplementation(async (url: string) => {
        if (url === '/Task') {
          return { total: 0, list: [] };
        }
        return { total: 0, list: [] };
      });

      render(<DashboardPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No pending tasks')).toBeInTheDocument();
      });
    });
  });

  describe('activity stream', () => {
    it('displays activity items after loading', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('shows creator names', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
      });
    });

    it('links parent entity to detail page', async () => {
      render(<DashboardPage />, { wrapper: createWrapper() });

      await waitFor(
        () => {
          const acmeLink = screen.getByRole('link', { name: 'Acme Corp' });
          expect(acmeLink).toHaveAttribute('href', '/Account/view/acc-001');
        },
        { timeout: 3000 }
      );
    });

    it('shows empty state when no activity', async () => {
      mockGet.mockImplementation(async (url: string) => {
        if (url === '/GlobalStream?maxSize=10') {
          return { total: 0, list: [] };
        }
        return { total: 0, list: [] };
      });

      render(<DashboardPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No recent activity')).toBeInTheDocument();
      });
    });
  });

  describe('loading states', () => {
    it('shows loading state while fetching data', async () => {
      mockGet.mockImplementation(() => new Promise(() => {}));

      render(<DashboardPage />, { wrapper: createWrapper() });

      // Should have loading skeletons (animated pulse elements)
      const { container } = render(<DashboardPage />, { wrapper: createWrapper() });
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });
});
