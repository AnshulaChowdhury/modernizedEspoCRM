/**
 * DuplicateCheck Component Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DuplicateCheck, useDuplicateCheck } from './DuplicateCheck';
import { renderHook } from '@testing-library/react';

// Mock API client
vi.mock('@/api/client', () => ({
  get: vi.fn(),
}));

import { get } from '@/api/client';
const mockGet = vi.mocked(get);

// Mock useMetadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: () => ({
    metadata: {
      entityDefs: {
        Contact: {
          fields: {
            name: { type: 'varchar' },
            emailAddress: { type: 'email' },
            phone: { type: 'phone' },
          },
        },
      },
      clientDefs: {
        Contact: {
          duplicateCheck: {
            fields: ['name', 'emailAddress'],
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

describe('DuplicateCheck Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ total: 0, list: [] });
  });

  describe('rendering', () => {
    it('returns null when no form data provided', () => {
      const { container } = render(
        <DuplicateCheck
          entityType="Contact"
          formData={{}}
        />,
        { wrapper: createWrapper() }
      );
      expect(container.firstChild).toBeNull();
    });

    it('returns null when no duplicates found', async () => {
      mockGet.mockResolvedValue({ total: 0, list: [] });

      const { container } = render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'John Doe' }}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    // Note: The component currently returns null during loading if no duplicates are cached
    // The loading state is only shown after duplicates are found initially
    // This is tested via the useDuplicateCheck hook's isLoading state

    it('shows duplicate warning when duplicates found', async () => {
      mockGet.mockResolvedValue({
        total: 2,
        list: [
          { id: '1', name: 'John Doe', emailAddress: 'john@example.com' },
          { id: '2', name: 'Johnny Doe', emailAddress: 'johnny@example.com' },
        ],
      });

      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'John' }}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Possible duplicates found')).toBeInTheDocument();
      });

      expect(screen.getByText(/2 records/)).toBeInTheDocument();
    });

    it('shows singular text for 1 duplicate', async () => {
      mockGet.mockResolvedValue({
        total: 1,
        list: [
          { id: '1', name: 'John Doe', emailAddress: 'john@example.com' },
        ],
      });

      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'John' }}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText(/1 record.*that/)).toBeInTheDocument();
      });
    });
  });

  describe('duplicate records list', () => {
    it('displays duplicate record names', async () => {
      mockGet.mockResolvedValue({
        total: 2,
        list: [
          { id: '1', name: 'John Doe', emailAddress: 'john@example.com' },
          { id: '2', name: 'Jane Doe', emailAddress: 'jane@example.com' },
        ],
      });

      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'Doe' }}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Possible duplicates found')).toBeInTheDocument();
      });

      // Names appear as links
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent('John Doe');
      expect(links[1]).toHaveTextContent('Jane Doe');
    });

    it('shows links to view duplicate records', async () => {
      mockGet.mockResolvedValue({
        total: 1,
        list: [
          { id: '1', name: 'John Doe', emailAddress: 'john@example.com' },
        ],
      });

      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'Doe' }}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Possible duplicates found')).toBeInTheDocument();
      });

      const link = screen.getByRole('link', { name: /John Doe/i });
      expect(link).toHaveAttribute('href', '/Contact/view/1');
    });

    it('opens links in new tab', async () => {
      mockGet.mockResolvedValue({
        total: 1,
        list: [
          { id: '1', name: 'John Doe', emailAddress: 'john@example.com' },
        ],
      });

      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'Doe' }}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Possible duplicates found')).toBeInTheDocument();
      });

      const link = screen.getByRole('link', { name: /John Doe/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('actions', () => {
    beforeEach(() => {
      mockGet.mockResolvedValue({
        total: 1,
        list: [{ id: '1', name: 'John Doe' }],
      });
    });

    it('shows "Use This" button when onSelectDuplicate provided', async () => {
      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'John' }}
          onSelectDuplicate={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /use this/i })).toBeInTheDocument();
      });
    });

    it('calls onSelectDuplicate when "Use This" clicked', async () => {
      const onSelectDuplicate = vi.fn();
      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'John' }}
          onSelectDuplicate={onSelectDuplicate}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /use this/i }));
      });

      expect(onSelectDuplicate).toHaveBeenCalledWith({ id: '1', name: 'John Doe' });
    });

    it('shows "Ignore & Continue" button when onIgnoreDuplicates provided', async () => {
      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'John' }}
          onIgnoreDuplicates={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ignore.*continue/i })).toBeInTheDocument();
      });
    });

    it('calls onIgnoreDuplicates and dismisses when clicked', async () => {
      const onIgnoreDuplicates = vi.fn();
      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'John' }}
          onIgnoreDuplicates={onIgnoreDuplicates}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /ignore.*continue/i }));
      });

      expect(onIgnoreDuplicates).toHaveBeenCalled();
    });

    it('shows dismiss button', async () => {
      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'John' }}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
      });
    });

    it('hides warning when dismiss clicked', async () => {
      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'John' }}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
      });

      await waitFor(() => {
        expect(screen.queryByText('Possible duplicates found')).not.toBeInTheDocument();
      });
    });
  });

  describe('custom check fields', () => {
    it('uses provided checkFields instead of metadata', async () => {
      mockGet.mockResolvedValue({ total: 0, list: [] });

      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ phone: '123-456-7890' }}
          checkFields={['phone']}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Check that the query was made with phone field
      const callArgs = mockGet.mock.calls[0];
      expect(callArgs?.[0]).toContain('phone');
    });
  });

  describe('excludeId', () => {
    it('excludes current record ID from results', async () => {
      mockGet.mockResolvedValue({ total: 0, list: [] });

      render(
        <DuplicateCheck
          entityType="Contact"
          formData={{ name: 'John' }}
          excludeId="current-id"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // Check that excludeId was passed in query
      const callArgs = mockGet.mock.calls[0];
      expect(callArgs?.[0]).toContain('notEquals');
    });
  });
});

describe('useDuplicateCheck Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ total: 0, list: [] });
  });

  it('returns empty duplicates initially', () => {
    const { result } = renderHook(
      () => useDuplicateCheck({
        entityType: 'Contact',
        formData: {},
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current.duplicates).toEqual([]);
    expect(result.current.hasDuplicates).toBe(false);
  });

  it('returns duplicates when found', async () => {
    mockGet.mockResolvedValue({
      total: 2,
      list: [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' },
      ],
    });

    const { result } = renderHook(
      () => useDuplicateCheck({
        entityType: 'Contact',
        formData: { name: 'Test' },
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.duplicates.length).toBe(2);
      expect(result.current.hasDuplicates).toBe(true);
    });
  });

  it('respects enabled flag', async () => {
    const { result } = renderHook(
      () => useDuplicateCheck({
        entityType: 'Contact',
        formData: { name: 'Test' },
        enabled: false,
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockGet).not.toHaveBeenCalled();
    });

    expect(result.current.duplicates).toEqual([]);
  });

  it('returns isLoading state', () => {
    mockGet.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(
      () => useDuplicateCheck({
        entityType: 'Contact',
        formData: { name: 'Test' },
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
  });
});
