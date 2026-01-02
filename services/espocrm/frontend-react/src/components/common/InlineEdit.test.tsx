/**
 * InlineEdit Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InlineEdit } from './InlineEdit';

describe('InlineEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('display mode', () => {
    it('renders children content', () => {
      render(<InlineEdit>Test Content</InlineEdit>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('shows pencil icon on hover', () => {
      render(<InlineEdit>Test Content</InlineEdit>);
      const container = screen.getByRole('button');
      expect(container).toBeInTheDocument();
    });

    it('renders as clickable button', () => {
      render(<InlineEdit>Test Content</InlineEdit>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders as non-interactive when disabled', () => {
      render(<InlineEdit enabled={false}>Test Content</InlineEdit>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<InlineEdit className="custom-class">Test Content</InlineEdit>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('edit mode activation', () => {
    it('calls onEditStart when clicked', () => {
      const onEditStart = vi.fn();
      render(
        <InlineEdit onEditStart={onEditStart}>
          Test Content
        </InlineEdit>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onEditStart).toHaveBeenCalledTimes(1);
    });

    it('enters edit mode on click', () => {
      render(
        <InlineEdit editComponent={<input data-testid="edit-input" />}>
          Test Content
        </InlineEdit>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByTestId('edit-input')).toBeInTheDocument();
    });

    it('enters edit mode on Enter key', () => {
      render(
        <InlineEdit editComponent={<input data-testid="edit-input" />}>
          Test Content
        </InlineEdit>
      );

      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(screen.getByTestId('edit-input')).toBeInTheDocument();
    });

    it('enters edit mode on Space key', () => {
      render(
        <InlineEdit editComponent={<input data-testid="edit-input" />}>
          Test Content
        </InlineEdit>
      );

      fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
      expect(screen.getByTestId('edit-input')).toBeInTheDocument();
    });

    it('does not enter edit mode when disabled', () => {
      const onEditStart = vi.fn();
      render(
        <InlineEdit
          enabled={false}
          onEditStart={onEditStart}
          editComponent={<input data-testid="edit-input" />}
        >
          Test Content
        </InlineEdit>
      );

      expect(screen.queryByTestId('edit-input')).not.toBeInTheDocument();
    });

    it('does not enter edit mode while saving', () => {
      const onEditStart = vi.fn();
      render(
        <InlineEdit
          isSaving
          onEditStart={onEditStart}
          editComponent={<input data-testid="edit-input" />}
        >
          Test Content
        </InlineEdit>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onEditStart).not.toHaveBeenCalled();
    });
  });

  describe('edit mode display', () => {
    it('shows edit component', () => {
      render(
        <InlineEdit
          isEditing
          setIsEditing={vi.fn()}
          editComponent={<input data-testid="edit-input" />}
        >
          Test Content
        </InlineEdit>
      );

      expect(screen.getByTestId('edit-input')).toBeInTheDocument();
    });

    it('shows save button', () => {
      render(
        <InlineEdit
          isEditing
          setIsEditing={vi.fn()}
          editComponent={<input />}
        >
          Test Content
        </InlineEdit>
      );

      expect(screen.getByTitle('Save (Ctrl+Enter)')).toBeInTheDocument();
    });

    it('shows cancel button', () => {
      render(
        <InlineEdit
          isEditing
          setIsEditing={vi.fn()}
          editComponent={<input />}
        >
          Test Content
        </InlineEdit>
      );

      expect(screen.getByTitle('Cancel (Escape)')).toBeInTheDocument();
    });

    it('shows saving indicator when isSaving', () => {
      render(
        <InlineEdit
          isEditing
          setIsEditing={vi.fn()}
          isSaving
          editComponent={<input />}
        >
          Test Content
        </InlineEdit>
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('disables buttons when saving', () => {
      render(
        <InlineEdit
          isEditing
          setIsEditing={vi.fn()}
          isSaving
          editComponent={<input />}
        >
          Test Content
        </InlineEdit>
      );

      expect(screen.getByTitle('Save (Ctrl+Enter)')).toBeDisabled();
      expect(screen.getByTitle('Cancel (Escape)')).toBeDisabled();
    });
  });

  describe('save action', () => {
    it('calls onSave when save button clicked', () => {
      const onSave = vi.fn();
      render(
        <InlineEdit
          isEditing
          setIsEditing={vi.fn()}
          onSave={onSave}
          editComponent={<input />}
        >
          Test Content
        </InlineEdit>
      );

      fireEvent.click(screen.getByTitle('Save (Ctrl+Enter)'));
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('saves with Ctrl+Enter', () => {
      const onSave = vi.fn();
      const { container } = render(
        <InlineEdit
          isEditing
          setIsEditing={vi.fn()}
          onSave={onSave}
          editComponent={<input />}
        >
          Test Content
        </InlineEdit>
      );

      const editContainer = container.querySelector('.inline-edit-container');
      fireEvent.keyDown(editContainer!, { key: 'Enter', ctrlKey: true });
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('saves with Meta+Enter (Mac)', () => {
      const onSave = vi.fn();
      const { container } = render(
        <InlineEdit
          isEditing
          setIsEditing={vi.fn()}
          onSave={onSave}
          editComponent={<input />}
        >
          Test Content
        </InlineEdit>
      );

      const editContainer = container.querySelector('.inline-edit-container');
      fireEvent.keyDown(editContainer!, { key: 'Enter', metaKey: true });
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancel action', () => {
    it('calls onEditCancel when cancel button clicked', () => {
      const onEditCancel = vi.fn();
      const setIsEditing = vi.fn();
      render(
        <InlineEdit
          isEditing
          setIsEditing={setIsEditing}
          onEditCancel={onEditCancel}
          editComponent={<input />}
        >
          Test Content
        </InlineEdit>
      );

      fireEvent.click(screen.getByTitle('Cancel (Escape)'));
      expect(onEditCancel).toHaveBeenCalledTimes(1);
      expect(setIsEditing).toHaveBeenCalledWith(false);
    });

    it('cancels with Escape key', () => {
      const onEditCancel = vi.fn();
      const setIsEditing = vi.fn();
      const { container } = render(
        <InlineEdit
          isEditing
          setIsEditing={setIsEditing}
          onEditCancel={onEditCancel}
          editComponent={<input />}
        >
          Test Content
        </InlineEdit>
      );

      const editContainer = container.querySelector('.inline-edit-container');
      fireEvent.keyDown(editContainer!, { key: 'Escape' });
      expect(onEditCancel).toHaveBeenCalledTimes(1);
      expect(setIsEditing).toHaveBeenCalledWith(false);
    });

    it('cancels when clicking outside', async () => {
      const onEditCancel = vi.fn();
      const setIsEditing = vi.fn();
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <InlineEdit
            isEditing
            setIsEditing={setIsEditing}
            onEditCancel={onEditCancel}
            editComponent={<input />}
          >
            Test Content
          </InlineEdit>
        </div>
      );

      fireEvent.mouseDown(screen.getByTestId('outside'));
      expect(onEditCancel).toHaveBeenCalledTimes(1);
      expect(setIsEditing).toHaveBeenCalledWith(false);
    });
  });

  describe('controlled mode', () => {
    it('uses controlled isEditing state', () => {
      const setIsEditing = vi.fn();
      const { rerender } = render(
        <InlineEdit
          isEditing={false}
          setIsEditing={setIsEditing}
          editComponent={<input data-testid="edit-input" />}
        >
          Test Content
        </InlineEdit>
      );

      expect(screen.queryByTestId('edit-input')).not.toBeInTheDocument();

      rerender(
        <InlineEdit
          isEditing={true}
          setIsEditing={setIsEditing}
          editComponent={<input data-testid="edit-input" />}
        >
          Test Content
        </InlineEdit>
      );

      expect(screen.getByTestId('edit-input')).toBeInTheDocument();
    });
  });
});
