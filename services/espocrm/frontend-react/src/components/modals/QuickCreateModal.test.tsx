/**
 * QuickCreateModal Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { QuickCreateModalConfig } from './types';

// Mock API client
vi.mock('@/api/client', () => ({
  post: vi.fn(),
}));

// Mock metadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: () => ({
    metadata: {
      entityDefs: {
        Contact: {
          label: 'Contact',
          fields: {
            firstName: { type: 'varchar', required: true },
            lastName: { type: 'varchar', required: true },
            emailAddress: { type: 'email' },
          },
        },
      },
    },
    isLoading: false,
  }),
}));

// Mock layout
vi.mock('@/lib/layout', () => ({
  useDetailLayout: () => ({
    layout: [
      {
        label: 'Overview',
        rows: [
          [{ name: 'firstName' }, { name: 'lastName' }],
          [{ name: 'emailAddress', fullWidth: true }],
        ],
      },
    ],
    isLoading: false,
  }),
  getDefaultDetailLayout: () => [],
  LayoutRenderer: ({
    formData,
    onChange,
  }: {
    formData?: Record<string, unknown>;
    onChange?: (field: string, value: unknown) => void;
  }) => (
    <div data-testid="layout-renderer">
      <input
        data-testid="firstName-input"
        value={(formData?.firstName as string) ?? ''}
        onChange={(e) => onChange?.('firstName', e.target.value)}
        placeholder="First Name"
      />
      <input
        data-testid="lastName-input"
        value={(formData?.lastName as string) ?? ''}
        onChange={(e) => onChange?.('lastName', e.target.value)}
        placeholder="Last Name"
      />
    </div>
  ),
}));

// Mock validation
vi.mock('@/lib/validation', () => ({
  useFormValidation: () => ({
    validate: (data: Record<string, unknown>) => {
      const errors: Record<string, string> = {};
      if (!data.firstName) errors.firstName = 'First Name is required';
      if (!data.lastName) errors.lastName = 'Last Name is required';
      return { isValid: Object.keys(errors).length === 0, errors };
    },
    validateField: (field: string, value: unknown) => {
      if ((field === 'firstName' || field === 'lastName') && !value) {
        return `${field} is required`;
      }
      return null;
    },
    isReady: true,
  }),
}));

// Mock fields init
vi.mock('@/fields', () => ({
  initializeFieldTypes: vi.fn(),
}));

// Import after mocks
import { QuickCreateModal } from './QuickCreateModal';
import { post } from '@/api/client';

const mockPost = vi.mocked(post);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('QuickCreateModal', () => {
  const defaultConfig: QuickCreateModalConfig = {
    entityType: 'Contact',
  };

  const mockOnCreate = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ id: '123', name: 'John Doe' });
  });

  describe('rendering', () => {
    it('should render with default title based on entity type', async () => {
      render(
        <QuickCreateModal
          config={defaultConfig}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Create Contact')).toBeInTheDocument();
    });

    it('should render with custom title', async () => {
      render(
        <QuickCreateModal
          config={{ ...defaultConfig, title: 'New Contact' }}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('New Contact')).toBeInTheDocument();
    });

    it('should render layout form', async () => {
      render(
        <QuickCreateModal
          config={defaultConfig}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('layout-renderer')).toBeInTheDocument();
    });

    it('should render Create button', async () => {
      render(
        <QuickCreateModal
          config={defaultConfig}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('should render Cancel button', async () => {
      render(
        <QuickCreateModal
          config={defaultConfig}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('default values', () => {
    it('should populate form with default values', async () => {
      render(
        <QuickCreateModal
          config={{
            ...defaultConfig,
            defaultValues: { firstName: 'John', lastName: 'Doe' },
          }}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('firstName-input')).toHaveValue('John');
      expect(screen.getByTestId('lastName-input')).toHaveValue('Doe');
    });
  });

  describe('form interaction', () => {
    it('should update form data on input change', async () => {
      render(
        <QuickCreateModal
          config={defaultConfig}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      const firstNameInput = screen.getByTestId('firstName-input');
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      expect(firstNameInput).toHaveValue('Jane');
    });
  });

  describe('form submission', () => {
    it('should call API when Create is clicked with valid data', async () => {
      render(
        <QuickCreateModal
          config={{
            ...defaultConfig,
            defaultValues: { firstName: 'John', lastName: 'Doe' },
          }}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/Contact', expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
        }));
      });
    });

    it('should call onCreate with created record after success', async () => {
      render(
        <QuickCreateModal
          config={{
            ...defaultConfig,
            defaultValues: { firstName: 'John', lastName: 'Doe' },
          }}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith({ id: '123', name: 'John Doe' });
      });
    });

    it('should show Creating... text while submitting', async () => {
      mockPost.mockImplementation(() => new Promise(() => {}));

      render(
        <QuickCreateModal
          config={{
            ...defaultConfig,
            defaultValues: { firstName: 'John', lastName: 'Doe' },
          }}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });
  });

  describe('validation', () => {
    it('should show validation errors when form is invalid', async () => {
      render(
        <QuickCreateModal
          config={defaultConfig}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('First Name is required')).toBeInTheDocument();
      });

      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should not submit when validation fails', async () => {
      render(
        <QuickCreateModal
          config={defaultConfig}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('First Name is required')).toBeInTheDocument();
      });

      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should show error message when API fails', async () => {
      mockPost.mockRejectedValue(new Error('Server error'));

      render(
        <QuickCreateModal
          config={{
            ...defaultConfig,
            defaultValues: { firstName: 'John', lastName: 'Doe' },
          }}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText(/Error creating record/)).toBeInTheDocument();
      });
    });
  });

  describe('cancel', () => {
    it('should call onCancel when Cancel is clicked', async () => {
      render(
        <QuickCreateModal
          config={defaultConfig}
          onCreate={mockOnCreate}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});
