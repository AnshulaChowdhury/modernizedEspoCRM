/**
 * ModalProvider Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModalProvider, useModal } from './ModalProvider';

// Mock child modal components
vi.mock('./ConfirmationModal', () => ({
  ConfirmationModal: ({
    config,
    onConfirm,
    onCancel,
  }: {
    config: { title: string; message: string };
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="confirmation-modal">
      <span data-testid="confirm-title">{config.title}</span>
      <span data-testid="confirm-message">{config.message}</span>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('./RecordSelectModal', () => ({
  RecordSelectModal: ({
    config,
    onSelect,
    onCancel,
  }: {
    config: { entityType: string; title?: string };
    onSelect: (record: { id: string; name: string } | null) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="record-select-modal">
      <span data-testid="select-entity">{config.entityType}</span>
      <button onClick={() => onSelect({ id: '123', name: 'Test Record' })}>
        Select Record
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('./QuickCreateModal', () => ({
  QuickCreateModal: ({
    config,
    onCreate,
    onCancel,
  }: {
    config: { entityType: string; title?: string };
    onCreate: (record: { id: string; name: string } | null) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="quick-create-modal">
      <span data-testid="create-entity">{config.entityType}</span>
      <button onClick={() => onCreate({ id: '456', name: 'New Record' })}>
        Create Record
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Test component that uses useModal
function TestComponent({
  onResult,
}: {
  onResult?: (result: unknown) => void;
}) {
  const { confirm, selectRecord, quickCreate, closeModal } = useModal();

  const handleConfirm = async () => {
    const result = await confirm({
      title: 'Test Confirm',
      message: 'Are you sure?',
    });
    onResult?.(result);
  };

  const handleSelectRecord = async () => {
    const result = await selectRecord({
      entityType: 'Account',
      title: 'Select Account',
    });
    onResult?.(result);
  };

  const handleQuickCreate = async () => {
    const result = await quickCreate({
      entityType: 'Contact',
      title: 'Create Contact',
    });
    onResult?.(result);
  };

  return (
    <div>
      <button onClick={handleConfirm}>Open Confirm</button>
      <button onClick={handleSelectRecord}>Open Select</button>
      <button onClick={handleQuickCreate}>Open Create</button>
      <button onClick={closeModal}>Close Modal</button>
    </div>
  );
}

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

describe('ModalProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useModal hook', () => {
    it('should throw error when used outside ModalProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function InvalidComponent() {
        useModal();
        return null;
      }

      expect(() => render(<InvalidComponent />)).toThrow(
        'useModal must be used within a ModalProvider'
      );

      consoleSpy.mockRestore();
    });

    it('should provide modal context when inside ModalProvider', () => {
      function ValidComponent() {
        const modal = useModal();
        return <span data-testid="has-modal">{modal ? 'yes' : 'no'}</span>;
      }

      render(
        <ModalProvider>
          <ValidComponent />
        </ModalProvider>
      );

      expect(screen.getByTestId('has-modal')).toHaveTextContent('yes');
    });
  });

  describe('confirm modal', () => {
    it('should open confirmation modal when confirm() is called', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Open Confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      expect(screen.getByTestId('confirm-title')).toHaveTextContent('Test Confirm');
      expect(screen.getByTestId('confirm-message')).toHaveTextContent('Are you sure?');
    });

    it('should resolve with true when confirmed', async () => {
      const handleResult = vi.fn();

      render(
        <ModalProvider>
          <TestComponent onResult={handleResult} />
        </ModalProvider>,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Open Confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(handleResult).toHaveBeenCalledWith(true);
      });

      expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
    });

    it('should resolve with false when cancelled', async () => {
      const handleResult = vi.fn();

      render(
        <ModalProvider>
          <TestComponent onResult={handleResult} />
        </ModalProvider>,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Open Confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(handleResult).toHaveBeenCalledWith(false);
      });

      expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
    });
  });

  describe('record select modal', () => {
    it('should open record select modal when selectRecord() is called', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId('record-select-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Open Select'));

      await waitFor(() => {
        expect(screen.getByTestId('record-select-modal')).toBeInTheDocument();
      });

      expect(screen.getByTestId('select-entity')).toHaveTextContent('Account');
    });

    it('should resolve with selected record', async () => {
      const handleResult = vi.fn();

      render(
        <ModalProvider>
          <TestComponent onResult={handleResult} />
        </ModalProvider>,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Open Select'));

      await waitFor(() => {
        expect(screen.getByTestId('record-select-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Record'));

      await waitFor(() => {
        expect(handleResult).toHaveBeenCalledWith({ id: '123', name: 'Test Record' });
      });

      expect(screen.queryByTestId('record-select-modal')).not.toBeInTheDocument();
    });

    it('should resolve with null when cancelled', async () => {
      const handleResult = vi.fn();

      render(
        <ModalProvider>
          <TestComponent onResult={handleResult} />
        </ModalProvider>,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Open Select'));

      await waitFor(() => {
        expect(screen.getByTestId('record-select-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(handleResult).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('quick create modal', () => {
    it('should open quick create modal when quickCreate() is called', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId('quick-create-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Open Create'));

      await waitFor(() => {
        expect(screen.getByTestId('quick-create-modal')).toBeInTheDocument();
      });

      expect(screen.getByTestId('create-entity')).toHaveTextContent('Contact');
    });

    it('should resolve with created record', async () => {
      const handleResult = vi.fn();

      render(
        <ModalProvider>
          <TestComponent onResult={handleResult} />
        </ModalProvider>,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Open Create'));

      await waitFor(() => {
        expect(screen.getByTestId('quick-create-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Record'));

      await waitFor(() => {
        expect(handleResult).toHaveBeenCalledWith({ id: '456', name: 'New Record' });
      });

      expect(screen.queryByTestId('quick-create-modal')).not.toBeInTheDocument();
    });

    it('should resolve with null when cancelled', async () => {
      const handleResult = vi.fn();

      render(
        <ModalProvider>
          <TestComponent onResult={handleResult} />
        </ModalProvider>,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Open Create'));

      await waitFor(() => {
        expect(screen.getByTestId('quick-create-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(handleResult).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('closeModal', () => {
    it('should close open modal when closeModal() is called', async () => {
      // Test component that catches the rejection
      function CloseModalTestComponent() {
        const { confirm, closeModal } = useModal();

        const handleConfirm = () => {
          // Catch the rejection to avoid unhandled promise rejection
          confirm({
            title: 'Test',
            message: 'Test',
          }).catch(() => {
            // Expected rejection when closeModal is called
          });
        };

        return (
          <div>
            <button onClick={handleConfirm}>Open Confirm</button>
            <button onClick={closeModal}>Close Modal</button>
          </div>
        );
      }

      render(
        <ModalProvider>
          <CloseModalTestComponent />
        </ModalProvider>,
        { wrapper: createWrapper() }
      );

      fireEvent.click(screen.getByText('Open Confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Close Modal'));

      await waitFor(() => {
        expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('children rendering', () => {
    it('should render children', () => {
      render(
        <ModalProvider>
          <div data-testid="child">Child content</div>
        </ModalProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ModalProvider>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </ModalProvider>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });
});
