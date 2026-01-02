/**
 * Mass Actions Hook
 *
 * Provides functionality for bulk operations on records:
 * - Mass delete
 * - Mass update
 * - Mass export
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/api/client';

interface UseMassActionsOptions {
  entityType: string;
  onSuccess?: (action: string, count: number) => void;
  onError?: (action: string, error: Error) => void;
}

interface MassUpdateData {
  ids: string[];
  attributes: Record<string, unknown>;
}

interface UseMassActionsResult {
  /** Currently selected record IDs */
  selectedIds: Set<string>;
  /** Toggle selection of a single record */
  toggleSelection: (id: string) => void;
  /** Select all provided IDs */
  selectAll: (ids: string[]) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Check if a record is selected */
  isSelected: (id: string) => boolean;
  /** Check if all provided IDs are selected */
  isAllSelected: (ids: string[]) => boolean;
  /** Number of selected records */
  selectedCount: number;
  /** Delete all selected records */
  massDelete: () => Promise<void>;
  /** Update all selected records with given attributes */
  massUpdate: (attributes: Record<string, unknown>) => Promise<void>;
  /** Whether a mass action is in progress */
  isProcessing: boolean;
  /** Current action being processed */
  processingAction: string | null;
  /** Error from last action */
  error: Error | null;
}

export function useMassActions({
  entityType,
  onSuccess,
  onError,
}: UseMassActionsOptions): UseMassActionsResult {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Toggle selection of a single record
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all provided IDs
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      // If all are already selected, deselect all
      if (ids.every((id) => prev.has(id))) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      // Otherwise, select all
      return new Set([...prev, ...ids]);
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Check if a record is selected
  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  // Check if all provided IDs are selected
  const isAllSelected = useCallback(
    (ids: string[]) => ids.length > 0 && ids.every((id) => selectedIds.has(id)),
    [selectedIds]
  );

  // Mass delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // EspoCRM supports mass delete via POST to /EntityType/action/massDelete
      const response = await post<{ count: number }>(
        `/${entityType}/action/massDelete`,
        { ids }
      );
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entityList', entityType] });
      // Remove deleted IDs from any cached individual records
      for (const id of selectedIds) {
        queryClient.removeQueries({ queryKey: ['entity', entityType, id] });
      }
      clearSelection();
      onSuccess?.('delete', data.count);
    },
    onError: (err: Error) => {
      setError(err);
      onError?.('delete', err);
    },
  });

  // Mass update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ ids, attributes }: MassUpdateData) => {
      // EspoCRM supports mass update via POST to /EntityType/action/massUpdate
      const response = await post<{ count: number }>(
        `/${entityType}/action/massUpdate`,
        { ids, attributes }
      );
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entityList', entityType] });
      // Invalidate individual record caches
      for (const id of selectedIds) {
        queryClient.invalidateQueries({ queryKey: ['entity', entityType, id] });
      }
      clearSelection();
      onSuccess?.('update', data.count);
    },
    onError: (err: Error) => {
      setError(err);
      onError?.('update', err);
    },
  });

  // Mass delete handler
  const massDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setError(null);
    setProcessingAction('delete');
    try {
      await deleteMutation.mutateAsync(Array.from(selectedIds));
    } finally {
      setProcessingAction(null);
    }
  }, [selectedIds, deleteMutation]);

  // Mass update handler
  const massUpdate = useCallback(
    async (attributes: Record<string, unknown>) => {
      if (selectedIds.size === 0) return;
      setError(null);
      setProcessingAction('update');
      try {
        await updateMutation.mutateAsync({
          ids: Array.from(selectedIds),
          attributes,
        });
      } finally {
        setProcessingAction(null);
      }
    },
    [selectedIds, updateMutation]
  );

  const isProcessing = deleteMutation.isPending || updateMutation.isPending;

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    selectedCount: selectedIds.size,
    massDelete,
    massUpdate,
    isProcessing,
    processingAction,
    error,
  };
}
