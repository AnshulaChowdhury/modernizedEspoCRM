/**
 * StreamFeed Component Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { StreamFeed } from './StreamFeed';

// Mock API client
vi.mock('@/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

import { get, post as apiPost, del } from '@/api/client';

const mockGet = vi.mocked(get);
const mockPost = vi.mocked(apiPost);
const mockDel = vi.mocked(del);

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

const sampleNotes = [
  {
    id: 'note-1',
    type: 'Post' as const,
    post: 'Hello world!',
    createdAt: new Date().toISOString(),
    createdByName: 'John Doe',
  },
  {
    id: 'note-2',
    type: 'Email' as const,
    post: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    createdByName: 'Jane Smith',
  },
];

describe('StreamFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      total: 2,
      list: sampleNotes,
    });
  });

  describe('rendering', () => {
    it('shows loading state initially', () => {
      mockGet.mockImplementation(() => new Promise(() => {}));

      render(<StreamFeed />, { wrapper: createWrapper() });

      // Should show loading spinner
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders stream notes after loading', async () => {
      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Hello world!')).toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows empty state when no notes', async () => {
      mockGet.mockResolvedValue({ total: 0, list: [] });

      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No activity yet')).toBeInTheDocument();
      });
    });

    it('shows error state on API error', async () => {
      mockGet.mockRejectedValue(new Error('API Error'));

      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Error loading stream/)).toBeInTheDocument();
      });
    });
  });

  describe('post form', () => {
    it('renders post textarea', async () => {
      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Write a post...')).toBeInTheDocument();
      });
    });

    it('renders post button', async () => {
      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument();
      });
    });

    it('renders internal checkbox', async () => {
      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Internal')).toBeInTheDocument();
      });
    });

    it('disables post button when textarea empty', async () => {
      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /post/i })).toBeDisabled();
      });
    });

    it('enables post button when text entered', async () => {
      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Write a post...');
        fireEvent.change(textarea, { target: { value: 'Test post' } });
      });

      expect(screen.getByRole('button', { name: /post/i })).not.toBeDisabled();
    });

    it('submits post when button clicked', async () => {
      mockPost.mockResolvedValue({ id: 'new-note' });

      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Write a post...');
        fireEvent.change(textarea, { target: { value: 'Test post' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /post/i }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/Note', expect.objectContaining({
          post: 'Test post',
          type: 'Post',
        }));
      });
    });

    it('clears textarea after successful post', async () => {
      mockPost.mockResolvedValue({ id: 'new-note' });

      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Write a post...');
        fireEvent.change(textarea, { target: { value: 'Test post' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /post/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Write a post...')).toHaveValue('');
      });
    });

    it('includes parent info when entityType and recordId provided', async () => {
      mockPost.mockResolvedValue({ id: 'new-note' });

      render(
        <StreamFeed entityType="Account" recordId="acc-001" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Write a post...');
        fireEvent.change(textarea, { target: { value: 'Test post' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /post/i }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/Note', expect.objectContaining({
          parentType: 'Account',
          parentId: 'acc-001',
        }));
      });
    });
  });

  describe('stream items', () => {
    it('shows author name', async () => {
      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('shows time ago', async () => {
      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        // There may be multiple time entries; just check at least one exists
        const timeElements = screen.getAllByText(/just now|ago/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });

    it('shows more options menu button', async () => {
      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Find the more options buttons (one for each note)
        const moreButtons = screen.getAllByRole('button').filter(
          (btn) => btn.querySelector('svg')
        );
        expect(moreButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('load more', () => {
    it('shows load more button when hasNextPage', async () => {
      mockGet.mockResolvedValue({
        total: 30,
        list: sampleNotes,
      });

      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
      });
    });

    it('hides load more button when all loaded', async () => {
      mockGet.mockResolvedValue({
        total: 2,
        list: sampleNotes,
      });

      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Hello world!')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });
  });

  describe('internal posts', () => {
    it('shows internal badge for internal posts', async () => {
      mockGet.mockResolvedValue({
        total: 1,
        list: [
          {
            ...sampleNotes[0],
            isInternal: true,
          },
        ],
      });

      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        // "Internal" appears twice: once in the form checkbox label, once as the badge
        // We check for at least 2 occurrences to confirm the badge is present
        const internalElements = screen.getAllByText('Internal');
        expect(internalElements.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('links', () => {
    it('shows link to parent entity', async () => {
      mockGet.mockResolvedValue({
        total: 1,
        list: [
          {
            ...sampleNotes[0],
            parentType: 'Account',
            parentId: 'acc-001',
            parentName: 'Acme Corp',
          },
        ],
      });

      render(<StreamFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'Acme Corp' });
        expect(link).toHaveAttribute('href', '/Account/view/acc-001');
      });
    });
  });

  describe('className prop', () => {
    it('applies custom className', async () => {
      const { container } = render(
        <StreamFeed className="custom-stream" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(container.firstChild).toHaveClass('custom-stream');
      });
    });
  });
});
