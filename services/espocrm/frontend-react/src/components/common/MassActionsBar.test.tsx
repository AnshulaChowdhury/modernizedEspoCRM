/**
 * MassActionsBar Component Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MassActionsBar } from './MassActionsBar';

// Mock useModal hook
const mockConfirm = vi.fn();
vi.mock('@/components/modals', () => ({
  useModal: () => ({
    confirm: mockConfirm,
  }),
}));

describe('MassActionsBar', () => {
  const defaultProps = {
    selectedCount: 5,
    onMassDelete: vi.fn(),
    onClearSelection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockResolvedValue(false); // Default: cancel confirmation
  });

  describe('visibility', () => {
    it('returns null when no items selected', () => {
      const { container } = render(
        <MassActionsBar {...defaultProps} selectedCount={0} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders when items are selected', () => {
      render(<MassActionsBar {...defaultProps} />);
      expect(screen.getByText('5 selected')).toBeInTheDocument();
    });

    it('shows singular text for 1 item', () => {
      render(<MassActionsBar {...defaultProps} selectedCount={1} />);
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });
  });

  describe('clear selection', () => {
    it('shows clear selection button', () => {
      render(<MassActionsBar {...defaultProps} />);
      expect(screen.getByTitle('Clear selection')).toBeInTheDocument();
    });

    it('calls onClearSelection when clear button clicked', () => {
      const onClearSelection = vi.fn();
      render(<MassActionsBar {...defaultProps} onClearSelection={onClearSelection} />);

      fireEvent.click(screen.getByTitle('Clear selection'));
      expect(onClearSelection).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete action', () => {
    it('shows delete button when canDelete is true', () => {
      render(<MassActionsBar {...defaultProps} canDelete />);
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('hides delete button when canDelete is false', () => {
      render(<MassActionsBar {...defaultProps} canDelete={false} />);
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('shows confirmation dialog on delete click', async () => {
      render(<MassActionsBar {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith({
          title: 'Delete Records',
          message: expect.stringContaining('5 records'),
          confirmLabel: 'Delete 5 Records',
          cancelLabel: 'Cancel',
          variant: 'destructive',
        });
      });
    });

    it('shows singular message for 1 record', async () => {
      render(<MassActionsBar {...defaultProps} selectedCount={1} />);

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('1 record?'),
            confirmLabel: 'Delete 1 Record',
          })
        );
      });
    });

    it('calls onMassDelete when confirmed', async () => {
      mockConfirm.mockResolvedValue(true);
      const onMassDelete = vi.fn();
      render(<MassActionsBar {...defaultProps} onMassDelete={onMassDelete} />);

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(onMassDelete).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onMassDelete when cancelled', async () => {
      mockConfirm.mockResolvedValue(false);
      const onMassDelete = vi.fn();
      render(<MassActionsBar {...defaultProps} onMassDelete={onMassDelete} />);

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalled();
      });
      expect(onMassDelete).not.toHaveBeenCalled();
    });

    it('disables delete button when processing', () => {
      render(<MassActionsBar {...defaultProps} isProcessing />);
      expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
    });

    it('shows loading spinner during delete processing', () => {
      render(
        <MassActionsBar
          {...defaultProps}
          isProcessing
          processingAction="delete"
        />
      );
      // The button should show loading state
      expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
    });
  });

  describe('update action', () => {
    it('shows update button when onMassUpdate provided and canEdit is true', () => {
      render(
        <MassActionsBar
          {...defaultProps}
          onMassUpdate={vi.fn()}
          canEdit
        />
      );
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('hides update button when onMassUpdate not provided', () => {
      render(<MassActionsBar {...defaultProps} canEdit />);
      expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument();
    });

    it('hides update button when canEdit is false', () => {
      render(
        <MassActionsBar
          {...defaultProps}
          onMassUpdate={vi.fn()}
          canEdit={false}
        />
      );
      expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument();
    });

    it('calls onMassUpdate when clicked', () => {
      const onMassUpdate = vi.fn();
      render(<MassActionsBar {...defaultProps} onMassUpdate={onMassUpdate} canEdit />);

      fireEvent.click(screen.getByRole('button', { name: /update/i }));
      expect(onMassUpdate).toHaveBeenCalledTimes(1);
    });

    it('disables update button when processing', () => {
      render(
        <MassActionsBar
          {...defaultProps}
          onMassUpdate={vi.fn()}
          canEdit
          isProcessing
        />
      );
      expect(screen.getByRole('button', { name: /update/i })).toBeDisabled();
    });
  });

  describe('export action', () => {
    it('shows export button when onMassExport provided', () => {
      render(<MassActionsBar {...defaultProps} onMassExport={vi.fn()} />);
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('hides export button when onMassExport not provided', () => {
      render(<MassActionsBar {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
    });

    it('calls onMassExport when clicked', () => {
      const onMassExport = vi.fn();
      render(<MassActionsBar {...defaultProps} onMassExport={onMassExport} />);

      fireEvent.click(screen.getByRole('button', { name: /export/i }));
      expect(onMassExport).toHaveBeenCalledTimes(1);
    });

    it('disables export button when processing', () => {
      render(
        <MassActionsBar
          {...defaultProps}
          onMassExport={vi.fn()}
          isProcessing
        />
      );
      expect(screen.getByRole('button', { name: /export/i })).toBeDisabled();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<MassActionsBar {...defaultProps} className="custom-class" />);
      const bar = screen.getByText('5 selected').closest('div');
      expect(bar?.parentElement).toHaveClass('custom-class');
    });

    it('is fixed positioned at bottom', () => {
      render(<MassActionsBar {...defaultProps} />);
      const bar = screen.getByText('5 selected').closest('div');
      expect(bar?.parentElement).toHaveClass('fixed');
      expect(bar?.parentElement).toHaveClass('bottom-4');
    });
  });
});
