/**
 * useMassActions Hook Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMassActions } from './useMassActions';

// Mock API client
vi.mock('@/api/client', () => ({
  post: vi.fn(),
}));

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
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useMassActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ count: 3 });
  });

  describe('selection management', () => {
    it('should start with empty selection', () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.selectedCount).toBe(0);
    });

    it('should toggle selection', () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.toggleSelection('1');
      });

      expect(result.current.selectedIds.has('1')).toBe(true);
      expect(result.current.selectedCount).toBe(1);

      // Toggle off
      act(() => {
        result.current.toggleSelection('1');
      });

      expect(result.current.selectedIds.has('1')).toBe(false);
      expect(result.current.selectedCount).toBe(0);
    });

    it('should select multiple items', () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.toggleSelection('1');
        result.current.toggleSelection('2');
        result.current.toggleSelection('3');
      });

      expect(result.current.selectedCount).toBe(3);
    });

    it('should check if item is selected', () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.toggleSelection('1');
      });

      expect(result.current.isSelected('1')).toBe(true);
      expect(result.current.isSelected('2')).toBe(false);
    });

    it('should select all provided IDs', () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2', '3']);
      });

      expect(result.current.selectedCount).toBe(3);
      expect(result.current.isSelected('1')).toBe(true);
      expect(result.current.isSelected('2')).toBe(true);
      expect(result.current.isSelected('3')).toBe(true);
    });

    it('should deselect all when all are already selected', () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2', '3']);
      });

      expect(result.current.selectedCount).toBe(3);

      act(() => {
        result.current.selectAll(['1', '2', '3']);
      });

      expect(result.current.selectedCount).toBe(0);
    });

    it('should check if all provided IDs are selected', () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2']);
      });

      expect(result.current.isAllSelected(['1', '2'])).toBe(true);
      expect(result.current.isAllSelected(['1', '2', '3'])).toBe(false);
    });

    it('should return false for isAllSelected with empty array', () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isAllSelected([])).toBe(false);
    });

    it('should clear selection', () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2', '3']);
      });

      expect(result.current.selectedCount).toBe(3);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedCount).toBe(0);
    });
  });

  describe('mass delete', () => {
    it('should call delete API with selected IDs', async () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2', '3']);
      });

      await act(async () => {
        await result.current.massDelete();
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/Account/action/massDelete',
        { ids: expect.arrayContaining(['1', '2', '3']) }
      );
    });

    it('should clear selection after delete', async () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2']);
      });

      await act(async () => {
        await result.current.massDelete();
      });

      expect(result.current.selectedCount).toBe(0);
    });

    it('should call onSuccess callback after delete', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account', onSuccess }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2', '3']);
      });

      await act(async () => {
        await result.current.massDelete();
      });

      expect(onSuccess).toHaveBeenCalledWith('delete', 3);
    });

    it('should handle delete error', async () => {
      const onError = vi.fn();
      const error = new Error('Delete failed');
      mockPost.mockRejectedValue(error);

      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account', onError }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2']);
      });

      await act(async () => {
        try {
          await result.current.massDelete();
        } catch {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledWith('delete', error);
      expect(result.current.error).toBe(error);
    });

    it('should not call API if no items selected', async () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.massDelete();
      });

      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should set processingAction during delete', async () => {
      // Use a deferred promise pattern
      let resolvePromise!: (value: { count: number }) => void;
      const deferredPromise = new Promise<{ count: number }>((resolve) => {
        resolvePromise = resolve;
      });
      mockPost.mockReturnValue(deferredPromise);

      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2']);
      });

      // Start the delete (don't await)
      let deletePromise: Promise<void>;
      act(() => {
        deletePromise = result.current.massDelete();
      });

      // Check processing action is set
      expect(result.current.processingAction).toBe('delete');
      expect(result.current.isProcessing).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise({ count: 2 });
        await deletePromise;
      });

      expect(result.current.processingAction).toBe(null);
    });
  });

  describe('mass update', () => {
    it('should call update API with selected IDs and attributes', async () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Contact' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2']);
      });

      await act(async () => {
        await result.current.massUpdate({ status: 'Active' });
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/Contact/action/massUpdate',
        {
          ids: expect.arrayContaining(['1', '2']),
          attributes: { status: 'Active' },
        }
      );
    });

    it('should clear selection after update', async () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Contact' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2']);
      });

      await act(async () => {
        await result.current.massUpdate({ status: 'Active' });
      });

      expect(result.current.selectedCount).toBe(0);
    });

    it('should call onSuccess callback after update', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Contact', onSuccess }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.selectAll(['1', '2', '3']);
      });

      await act(async () => {
        await result.current.massUpdate({ status: 'Active' });
      });

      expect(onSuccess).toHaveBeenCalledWith('update', 3);
    });

    it('should not call API if no items selected', async () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Contact' }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.massUpdate({ status: 'Active' });
      });

      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe('isProcessing', () => {
    it('should be false initially', () => {
      const { result } = renderHook(
        () => useMassActions({ entityType: 'Account' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isProcessing).toBe(false);
    });
  });
});
