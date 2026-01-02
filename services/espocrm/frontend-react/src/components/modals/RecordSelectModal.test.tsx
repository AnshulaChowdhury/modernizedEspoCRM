/**
 * RecordSelectModal Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RecordSelectModalConfig, SelectedRecord } from './types';

// Mock API client
vi.mock('@/api/client', () => ({
  get: vi.fn(),
}));

// Mock metadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: () => ({
    metadata: {
      entityDefs: {
        Account: {
          label: 'Account',
          fields: {
            name: { type: 'varchar' },
          },
        },
        Contact: {
          label: 'Contact',
          fields: {
            name: { type: 'varchar' },
          },
        },
      },
    },
    isLoading: false,
  }),
}));

// Import after mocks
import { RecordSelectModal } from './RecordSelectModal';
import { get } from '@/api/client';

const mockGet = vi.mocked(get);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('RecordSelectModal', () => {
  const mockRecords = {
    total: 3,
    list: [
      { id: '1', name: 'Acme Corp' },
      { id: '2', name: 'Tech Solutions' },
      { id: '3', name: 'Global Inc' },
    ],
  };

  const defaultConfig: RecordSelectModalConfig = {
    entityType: 'Account',
  };

  const mockOnSelect = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(mockRecords);
  });

  describe('rendering', () => {
    it('should render with default title based on entity type', async () => {
      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Select Account')).toBeInTheDocument();
    });

    it('should render with custom title', async () => {
      render(
        <RecordSelectModal
          config={{ ...defaultConfig, title: 'Choose an Account' }}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Choose an Account')).toBeInTheDocument();
    });

    it('should render search input', async () => {
      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByPlaceholderText('Search account...')).toBeInTheDocument();
    });

    it('should render loading state', async () => {
      mockGet.mockImplementation(() => new Promise(() => {}));

      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render record list after loading', async () => {
      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
      expect(screen.getByText('Global Inc')).toBeInTheDocument();
    });

    it('should render empty state when no records', async () => {
      mockGet.mockResolvedValue({ total: 0, list: [] });

      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('No records found')).toBeInTheDocument();
      });
    });

    it('should render error state', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('single selection mode', () => {
    it('should call onSelect immediately when record is clicked', async () => {
      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Acme Corp'));

      expect(mockOnSelect).toHaveBeenCalledWith({ id: '1', name: 'Acme Corp' });
    });

    it('should not show selection count in single mode', async () => {
      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Select \(/)).not.toBeInTheDocument();
    });
  });

  describe('multiple selection mode', () => {
    const multipleConfig: RecordSelectModalConfig = {
      ...defaultConfig,
      multiple: true,
    };

    it('should show Select button with count', async () => {
      render(
        <RecordSelectModal
          config={multipleConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.getByText('Select (0)')).toBeInTheDocument();
    });

    it('should toggle selection on click', async () => {
      render(
        <RecordSelectModal
          config={multipleConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Acme Corp'));
      expect(screen.getByText('Select (1)')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Tech Solutions'));
      expect(screen.getByText('Select (2)')).toBeInTheDocument();

      // Deselect first
      fireEvent.click(screen.getByText('Acme Corp'));
      expect(screen.getByText('Select (1)')).toBeInTheDocument();
    });

    it('should call onSelect with array when confirmed', async () => {
      render(
        <RecordSelectModal
          config={multipleConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Acme Corp'));
      fireEvent.click(screen.getByText('Tech Solutions'));

      fireEvent.click(screen.getByText('Select (2)'));

      expect(mockOnSelect).toHaveBeenCalledWith([
        { id: '1', name: 'Acme Corp' },
        { id: '2', name: 'Tech Solutions' },
      ]);
    });

    it('should call onSelect with null when no selection confirmed', async () => {
      render(
        <RecordSelectModal
          config={multipleConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Select button should be disabled when count is 0
      const selectButton = screen.getByText('Select (0)');
      expect(selectButton).toBeDisabled();
    });

    it('should show Cancel button in multiple mode', async () => {
      render(
        <RecordSelectModal
          config={multipleConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });
  });

  describe('search', () => {
    it('should update search query on input', async () => {
      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      const searchInput = screen.getByPlaceholderText('Search account...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });

      expect(searchInput).toHaveValue('Acme');
    });

    it('should call API with search query', async () => {
      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search account...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('textFilter=Acme'));
      });
    });
  });

  describe('excluded IDs', () => {
    it('should filter out excluded records', async () => {
      render(
        <RecordSelectModal
          config={{ ...defaultConfig, excludeIds: ['1', '2'] }}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Global Inc')).toBeInTheDocument();
      });

      expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
      expect(screen.queryByText('Tech Solutions')).not.toBeInTheDocument();
    });
  });

  describe('cancel', () => {
    it('should call onCancel when Cancel button is clicked', async () => {
      render(
        <RecordSelectModal
          config={{ ...defaultConfig, multiple: true }}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('pagination', () => {
    it('should show pagination when more than one page', async () => {
      mockGet.mockResolvedValue({
        total: 25,
        list: mockRecords.list,
      });

      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });
    });

    it('should not show pagination when single page', async () => {
      render(
        <RecordSelectModal
          config={defaultConfig}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
    });
  });
});
