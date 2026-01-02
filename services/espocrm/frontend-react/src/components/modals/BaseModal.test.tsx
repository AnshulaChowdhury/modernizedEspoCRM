/**
 * BaseModal Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BaseModal } from './BaseModal';

describe('BaseModal', () => {
  describe('rendering', () => {
    it('should render when open is true', () => {
      render(
        <BaseModal open={true} onOpenChange={vi.fn()} title="Test Modal">
          <p>Modal content</p>
        </BaseModal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(
        <BaseModal open={false} onOpenChange={vi.fn()} title="Test Modal">
          <p>Modal content</p>
        </BaseModal>
      );

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('should render title', () => {
      render(
        <BaseModal open={true} onOpenChange={vi.fn()} title="My Title">
          <p>Content</p>
        </BaseModal>
      );

      expect(screen.getByText('My Title')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(
        <BaseModal
          open={true}
          onOpenChange={vi.fn()}
          title="Title"
          description="This is a description"
        >
          <p>Content</p>
        </BaseModal>
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      render(
        <BaseModal open={true} onOpenChange={vi.fn()} title="Title">
          <p>Content</p>
        </BaseModal>
      );

      // Description element should not exist
      expect(screen.queryByText('This is a description')).not.toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <BaseModal open={true} onOpenChange={vi.fn()} title="Title">
          <div data-testid="child">Child Component</div>
        </BaseModal>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      render(
        <BaseModal
          open={true}
          onOpenChange={vi.fn()}
          title="Title"
          footer={<button>Save</button>}
        >
          <p>Content</p>
        </BaseModal>
      );

      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('should render modal with sm size', () => {
      render(
        <BaseModal open={true} onOpenChange={vi.fn()} title="Title" size="sm">
          <p>Content</p>
        </BaseModal>
      );

      // Modal is rendered with content
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render modal with md size by default', () => {
      render(
        <BaseModal open={true} onOpenChange={vi.fn()} title="Title">
          <p>Content</p>
        </BaseModal>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render modal with lg size', () => {
      render(
        <BaseModal open={true} onOpenChange={vi.fn()} title="Title" size="lg">
          <p>Content</p>
        </BaseModal>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('onOpenChange', () => {
    it('should call onOpenChange when escape key is pressed', () => {
      const handleOpenChange = vi.fn();

      render(
        <BaseModal open={true} onOpenChange={handleOpenChange} title="Title">
          <p>Content</p>
        </BaseModal>
      );

      // Press escape key
      fireEvent.keyDown(document.body, { key: 'Escape' });

      expect(handleOpenChange).toHaveBeenCalled();
    });
  });
});
