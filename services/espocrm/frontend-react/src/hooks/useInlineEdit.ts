import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { put } from '@/api/client';

interface UseInlineEditOptions {
  entityType: string;
  recordId: string;
  fieldName: string;
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

interface UseInlineEditResult {
  /** Whether currently in edit mode */
  isEditing: boolean;
  /** Set edit mode */
  setIsEditing: (editing: boolean) => void;
  /** The current edit value */
  editValue: unknown;
  /** Set the edit value */
  setEditValue: (value: unknown) => void;
  /** Whether currently saving */
  isSaving: boolean;
  /** Save error if any */
  error: Error | null;
  /** Start editing with initial value */
  startEdit: (initialValue: unknown) => void;
  /** Cancel editing */
  cancelEdit: () => void;
  /** Save the current edit value */
  save: () => void;
  /** Save a specific value */
  saveValue: (value: unknown) => void;
}

export function useInlineEdit({
  entityType,
  recordId,
  fieldName,
  onSuccess,
  onError,
}: UseInlineEditOptions): UseInlineEditResult {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<unknown>(null);
  const [originalValue, setOriginalValue] = useState<unknown>(null);

  const mutation = useMutation({
    mutationFn: async (value: unknown) => {
      const response = await put<Record<string, unknown>>(
        `/${entityType}/${recordId}`,
        { [fieldName]: value }
      );
      return response;
    },
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData(['entity', entityType, recordId], data);
      queryClient.invalidateQueries({ queryKey: ['entityList', entityType] });
      setIsEditing(false);
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  const startEdit = useCallback((initialValue: unknown) => {
    setOriginalValue(initialValue);
    setEditValue(initialValue);
    setIsEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditValue(originalValue);
    setIsEditing(false);
    mutation.reset();
  }, [originalValue, mutation]);

  const save = useCallback(() => {
    mutation.mutate(editValue);
  }, [mutation, editValue]);

  const saveValue = useCallback(
    (value: unknown) => {
      mutation.mutate(value);
    },
    [mutation]
  );

  return {
    isEditing,
    setIsEditing,
    editValue,
    setEditValue,
    isSaving: mutation.isPending,
    error: mutation.error,
    startEdit,
    cancelEdit,
    save,
    saveValue,
  };
}

/**
 * Hook to manage multiple inline edits on a record
 */
interface UseRecordInlineEditOptions {
  entityType: string;
  recordId: string;
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: Error, fieldName: string) => void;
}

interface FieldEditState {
  isEditing: boolean;
  editValue: unknown;
  isSaving: boolean;
  error: Error | null;
}

interface UseRecordInlineEditResult {
  /** Get edit state for a field */
  getFieldState: (fieldName: string) => FieldEditState;
  /** Start editing a field */
  startEdit: (fieldName: string, initialValue: unknown) => void;
  /** Cancel editing a field */
  cancelEdit: (fieldName: string) => void;
  /** Update edit value for a field */
  setEditValue: (fieldName: string, value: unknown) => void;
  /** Save a field */
  saveField: (fieldName: string) => void;
  /** Check if any field is being edited */
  hasActiveEdit: boolean;
  /** Cancel all active edits */
  cancelAllEdits: () => void;
}

export function useRecordInlineEdit({
  entityType,
  recordId,
  onSuccess,
  onError,
}: UseRecordInlineEditOptions): UseRecordInlineEditResult {
  const queryClient = useQueryClient();
  const [editStates, setEditStates] = useState<
    Record<string, { isEditing: boolean; editValue: unknown; originalValue: unknown }>
  >({});
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, Error | null>>({});

  const getFieldState = useCallback(
    (fieldName: string): FieldEditState => {
      const state = editStates[fieldName];
      return {
        isEditing: state?.isEditing ?? false,
        editValue: state?.editValue ?? null,
        isSaving: savingFields.has(fieldName),
        error: errors[fieldName] ?? null,
      };
    },
    [editStates, savingFields, errors]
  );

  const startEdit = useCallback((fieldName: string, initialValue: unknown) => {
    setEditStates((prev) => ({
      ...prev,
      [fieldName]: {
        isEditing: true,
        editValue: initialValue,
        originalValue: initialValue,
      },
    }));
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
  }, []);

  const cancelEdit = useCallback((fieldName: string) => {
    setEditStates((prev) => {
      const newState = { ...prev };
      delete newState[fieldName];
      return newState;
    });
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
  }, []);

  const setEditValue = useCallback((fieldName: string, value: unknown) => {
    setEditStates((prev) => {
      const existing = prev[fieldName];
      if (!existing) return prev;
      return {
        ...prev,
        [fieldName]: {
          ...existing,
          editValue: value,
        },
      };
    });
  }, []);

  const saveField = useCallback(
    async (fieldName: string) => {
      const state = editStates[fieldName];
      if (!state) return;

      setSavingFields((prev) => new Set(prev).add(fieldName));
      setErrors((prev) => ({ ...prev, [fieldName]: null }));

      try {
        const response = await put<Record<string, unknown>>(
          `/${entityType}/${recordId}`,
          { [fieldName]: state.editValue }
        );

        // Update cache
        queryClient.setQueryData(['entity', entityType, recordId], response);
        queryClient.invalidateQueries({ queryKey: ['entityList', entityType] });

        // Clear edit state
        setEditStates((prev) => {
          const newState = { ...prev };
          delete newState[fieldName];
          return newState;
        });

        onSuccess?.(response);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Save failed');
        setErrors((prev) => ({ ...prev, [fieldName]: err }));
        onError?.(err, fieldName);
      } finally {
        setSavingFields((prev) => {
          const next = new Set(prev);
          next.delete(fieldName);
          return next;
        });
      }
    },
    [editStates, entityType, recordId, queryClient, onSuccess, onError]
  );

  const hasActiveEdit = Object.values(editStates).some((s) => s.isEditing);

  const cancelAllEdits = useCallback(() => {
    setEditStates({});
    setErrors({});
  }, []);

  return {
    getFieldState,
    startEdit,
    cancelEdit,
    setEditValue,
    saveField,
    hasActiveEdit,
    cancelAllEdits,
  };
}
