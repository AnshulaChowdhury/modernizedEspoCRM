/**
 * ConfirmationModal Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationModal } from './ConfirmationModal';
import type { ConfirmationModalConfig } from './types';

describe('ConfirmationModal', () => {
  const defaultConfig: ConfirmationModalConfig = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  describe('rendering', () => {
    it('should render title', () => {
      render(
        <ConfirmationModal
          config={defaultConfig}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('should render message', () => {
      render(
        <ConfirmationModal
          config={defaultConfig}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('should render default button labels', () => {
      render(
        <ConfirmationModal
          config={defaultConfig}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render custom button labels', () => {
      const config: ConfirmationModalConfig = {
        ...defaultConfig,
        confirmLabel: 'Yes, Delete',
        cancelLabel: 'No, Keep',
      };

      render(
        <ConfirmationModal
          config={config}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
      expect(screen.getByText('No, Keep')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      const handleConfirm = vi.fn();

      render(
        <ConfirmationModal
          config={defaultConfig}
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Confirm'));

      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
      const handleCancel = vi.fn();

      render(
        <ConfirmationModal
          config={defaultConfig}
          onConfirm={vi.fn()}
          onCancel={handleCancel}
        />
      );

      fireEvent.click(screen.getByText('Cancel'));

      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when modal is closed', () => {
      const handleCancel = vi.fn();

      render(
        <ConfirmationModal
          config={defaultConfig}
          onConfirm={vi.fn()}
          onCancel={handleCancel}
        />
      );

      // Press escape to close
      fireEvent.keyDown(document.body, { key: 'Escape' });

      expect(handleCancel).toHaveBeenCalled();
    });
  });

  describe('variants', () => {
    it('should render default variant', () => {
      render(
        <ConfirmationModal
          config={defaultConfig}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Confirm button should be present with default styling
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toBeInTheDocument();
    });

    it('should render destructive variant', () => {
      const config: ConfirmationModalConfig = {
        ...defaultConfig,
        variant: 'destructive',
      };

      render(
        <ConfirmationModal
          config={config}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Confirm button should be present (with destructive styling)
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toBeInTheDocument();
    });
  });
});
