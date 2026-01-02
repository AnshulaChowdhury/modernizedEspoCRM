/**
 * RecordEdit Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock all external dependencies
vi.mock('@/api/client', () => ({
  get: vi.fn(),
  put: vi.fn(),
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
    formData,
    onChange,
  }: {
    mode: string;
    formData?: Record<string, unknown>;
    onChange?: (field: string, value: unknown) => void;
  }) => (
    <div data-testid="layout-renderer" data-mode={mode}>
      <input
        data-testid="name-input"
        value={(formData?.name as string) ?? ''}
        onChange={(e) => onChange?.('name', e.target.value)}
        placeholder="Name"
      />
    </div>
  ),
}));

vi.mock('@/lib/acl', () => ({
  useAcl: () => ({
    checkModel: vi.fn().mockReturnValue(true),
  }),
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

// Import after mocks
import { RecordEdit } from './RecordEdit';
import { get, put } from '@/api/client';

const mockGet = vi.mocked(get);
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

describe('RecordEdit', () => {
  const mockRecord = {
    id: '123',
    name: 'Acme Corporation',
    website: 'https://acme.com',
    description: 'A test company',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(mockRecord);
    mockPut.mockResolvedValue({ ...mockRecord, name: 'Updated Name' });
  });

  describe('rendering', () => {
    it('should render loading state initially', async () => {
      mockGet.mockImplementation(() => new Promise(() => {}));

      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render edit form after loading', async () => {
      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('layout-renderer')).toBeInTheDocument();
      });
    });

    it('should render in edit mode', async () => {
      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const layoutRenderer = screen.getByTestId('layout-renderer');
        expect(layoutRenderer).toHaveAttribute('data-mode', 'edit');
      });
    });

    it('should render error state', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText(/Error loading record/)).toBeInTheDocument();
      });
    });

    it('should render not found state when no record', async () => {
      mockGet.mockResolvedValue(null);

      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Record not found')).toBeInTheDocument();
      });
    });
  });

  describe('header', () => {
    it('should display edit title with record name', async () => {
      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Acme Corporation')).toBeInTheDocument();
      });
    });

    it('should have back button linking to view', async () => {
      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const backButton = screen.getByText('Back');
        expect(backButton.closest('a')).toHaveAttribute('href', '/Account/view/123');
      });
    });

    it('should have save button', async () => {
      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('should have cancel button', async () => {
      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });
  });

  describe('form interaction', () => {
    it('should populate form with existing record data', async () => {
      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const nameInput = screen.getByTestId('name-input');
        expect(nameInput).toHaveValue('Acme Corporation');
      });
    });

    it('should update form data when fields change', async () => {
      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId('name-input');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      expect(nameInput).toHaveValue('Updated Name');
    });
  });

  describe('form submission', () => {
    it('should call API when save is clicked', async () => {
      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toBeInTheDocument();
      });

      // Update the form
      const nameInput = screen.getByTestId('name-input');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      // Click save
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledWith('/Account/123', expect.any(Object));
      });
    });

    it('should navigate to view page after successful save', async () => {
      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId('name-input');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/Account/view/123');
      });
    });
  });

  describe('cancel', () => {
    it('should link cancel to view page', async () => {
      render(<RecordEdit entityType="Account" recordId="123" />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel').closest('a');
        expect(cancelButton).toHaveAttribute('href', '/Account/view/123');
      });
    });
  });

  describe('className prop', () => {
    it('should apply className to container', async () => {
      const { container } = render(
        <RecordEdit entityType="Account" recordId="123" className="custom-class" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByTestId('layout-renderer')).toBeInTheDocument();
      });

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
