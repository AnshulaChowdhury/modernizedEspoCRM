/**
 * RecordCreate Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock all external dependencies
vi.mock('@/api/client', () => ({
  post: vi.fn(),
}));

vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: () => ({
    metadata: {
      entityDefs: {
        Account: {
          fields: {
            name: { type: 'varchar', required: true },
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
  LayoutRenderer: ({
    mode,
    onChange,
    formData,
  }: {
    mode: string;
    onChange?: (field: string, value: unknown) => void;
    formData?: Record<string, unknown>;
  }) => (
    <div data-testid="layout-renderer" data-mode={mode}>
      <input
        data-testid="name-input"
        value={(formData?.name as string) ?? ''}
        onChange={(e) => onChange?.('name', e.target.value)}
        placeholder="Name"
      />
      <input
        data-testid="website-input"
        value={(formData?.website as string) ?? ''}
        onChange={(e) => onChange?.('website', e.target.value)}
        placeholder="Website"
      />
    </div>
  ),
}));

vi.mock('@/lib/validation', () => ({
  useFormValidation: () => ({
    validate: () => ({ isValid: true, errors: {} }),
    validateField: () => null,
    isReady: true,
  }),
}));

vi.mock('@/fields', () => ({
  initializeFieldTypes: vi.fn(),
}));

vi.mock('@/components/common/DuplicateCheck', () => ({
  DuplicateCheck: () => null,
}));

// Import after mocks
import { RecordCreate } from './RecordCreate';
import { post } from '@/api/client';

const mockPost = vi.mocked(post);

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

describe('RecordCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ id: '123', name: 'New Account' });
  });

  describe('rendering', () => {
    it('should render the create form', async () => {
      render(<RecordCreate entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('layout-renderer')).toBeInTheDocument();
      });
    });

    it('should render in edit mode for input', async () => {
      render(<RecordCreate entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        const layoutRenderer = screen.getByTestId('layout-renderer');
        expect(layoutRenderer).toHaveAttribute('data-mode', 'edit');
      });
    });
  });

  describe('header', () => {
    it('should display create title', async () => {
      render(<RecordCreate entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Create Account')).toBeInTheDocument();
      });
    });

    it('should have back button linking to list', async () => {
      render(<RecordCreate entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        const backButton = screen.getByText('Back');
        expect(backButton.closest('a')).toHaveAttribute('href', '/Account');
      });
    });

    it('should have create button', async () => {
      render(<RecordCreate entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Create')).toBeInTheDocument();
      });
    });

    it('should have cancel button', async () => {
      render(<RecordCreate entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });
  });

  describe('form interaction', () => {
    it('should update form data when fields change', async () => {
      render(<RecordCreate entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId('name-input');
      fireEvent.change(nameInput, { target: { value: 'Test Account' } });

      expect(nameInput).toHaveValue('Test Account');
    });
  });

  describe('form submission', () => {
    it('should call API when create is clicked', async () => {
      render(<RecordCreate entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toBeInTheDocument();
      });

      // Fill in the form
      const nameInput = screen.getByTestId('name-input');
      fireEvent.change(nameInput, { target: { value: 'New Account' } });

      // Click create
      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/Account', expect.any(Object));
      });
    });

    it('should navigate to view page after successful create', async () => {
      render(<RecordCreate entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId('name-input');
      fireEvent.change(nameInput, { target: { value: 'New Account' } });

      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/Account/view/123');
      });
    });
  });

  describe('cancel', () => {
    it('should navigate back when cancel is clicked', async () => {
      render(<RecordCreate entityType="Account" />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel').closest('a');
      expect(cancelButton).toHaveAttribute('href', '/Account');
    });
  });

  describe('className prop', () => {
    it('should apply className to container', async () => {
      const { container } = render(
        <RecordCreate entityType="Account" className="custom-class" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByTestId('layout-renderer')).toBeInTheDocument();
      });

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
