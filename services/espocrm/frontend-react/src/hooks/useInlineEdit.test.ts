/**
 * useInlineEdit Hook Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useInlineEdit, useRecordInlineEdit } from './useInlineEdit';

// Mock API client
vi.mock('@/api/client', () => ({
  put: vi.fn(),
}));

import { put } from '@/api/client';

const mockPut = vi.mocked(put);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe('useInlineEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPut.mockResolvedValue({ id: 'test-id', name: 'Updated Name' });
  });

  it('initializes with default values', () => {
    const { result } = renderHook(
      () =>
        useInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
          fieldName: 'name',
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isEditing).toBe(false);
    expect(result.current.editValue).toBeNull();
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('startEdit sets editing mode and value', () => {
    const { result } = renderHook(
      () =>
        useInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
          fieldName: 'name',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('Initial Value');
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.editValue).toBe('Initial Value');
  });

  it('setEditValue updates the edit value', () => {
    const { result } = renderHook(
      () =>
        useInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
          fieldName: 'name',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('Initial');
    });

    act(() => {
      result.current.setEditValue('Updated');
    });

    expect(result.current.editValue).toBe('Updated');
  });

  it('cancelEdit restores original value and exits edit mode', () => {
    const { result } = renderHook(
      () =>
        useInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
          fieldName: 'name',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('Original');
    });

    act(() => {
      result.current.setEditValue('Modified');
    });

    expect(result.current.editValue).toBe('Modified');

    act(() => {
      result.current.cancelEdit();
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.editValue).toBe('Original');
  });

  it('save calls API with current edit value', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () =>
        useInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
          fieldName: 'name',
          onSuccess,
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('Initial');
    });

    act(() => {
      result.current.setEditValue('New Name');
    });

    act(() => {
      result.current.save();
    });

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/Account/acc-123', { name: 'New Name' });
    });
  });

  it('saveValue saves a specific value', async () => {
    const { result } = renderHook(
      () =>
        useInlineEdit({
          entityType: 'Contact',
          recordId: 'con-456',
          fieldName: 'email',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.saveValue('test@example.com');
    });

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/Contact/con-456', { email: 'test@example.com' });
    });
  });

  it('sets isSaving to true while saving', async () => {
    mockPut.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(
      () =>
        useInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
          fieldName: 'name',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.save();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(true);
    });
  });

  it('calls onSuccess callback after successful save', async () => {
    const onSuccess = vi.fn();
    mockPut.mockResolvedValue({ id: 'acc-123', name: 'Updated' });

    const { result } = renderHook(
      () =>
        useInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
          fieldName: 'name',
          onSuccess,
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('Initial');
    });

    act(() => {
      result.current.save();
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ id: 'acc-123', name: 'Updated' });
    });
  });

  it('calls onError callback on save failure', async () => {
    const onError = vi.fn();
    mockPut.mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(
      () =>
        useInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
          fieldName: 'name',
          onError,
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.save();
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('setIsEditing allows direct control', () => {
    const { result } = renderHook(
      () =>
        useInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
          fieldName: 'name',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setIsEditing(true);
    });

    expect(result.current.isEditing).toBe(true);

    act(() => {
      result.current.setIsEditing(false);
    });

    expect(result.current.isEditing).toBe(false);
  });

  it('exits edit mode after successful save', async () => {
    mockPut.mockResolvedValue({ id: 'acc-123', name: 'Updated' });

    const { result } = renderHook(
      () =>
        useInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
          fieldName: 'name',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('Initial');
    });

    expect(result.current.isEditing).toBe(true);

    act(() => {
      result.current.save();
    });

    await waitFor(() => {
      expect(result.current.isEditing).toBe(false);
    });
  });
});

describe('useRecordInlineEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPut.mockResolvedValue({ id: 'test-id', name: 'Updated' });
  });

  it('initializes with no active edits', () => {
    const { result } = renderHook(
      () =>
        useRecordInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.hasActiveEdit).toBe(false);
  });

  it('getFieldState returns default state for non-editing field', () => {
    const { result } = renderHook(
      () =>
        useRecordInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
        }),
      { wrapper: createWrapper() }
    );

    const state = result.current.getFieldState('name');
    expect(state.isEditing).toBe(false);
    expect(state.editValue).toBeNull();
    expect(state.isSaving).toBe(false);
    expect(state.error).toBeNull();
  });

  it('startEdit sets field to editing mode', () => {
    const { result } = renderHook(
      () =>
        useRecordInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('name', 'Initial Name');
    });

    const state = result.current.getFieldState('name');
    expect(state.isEditing).toBe(true);
    expect(state.editValue).toBe('Initial Name');
    expect(result.current.hasActiveEdit).toBe(true);
  });

  it('allows editing multiple fields simultaneously', () => {
    const { result } = renderHook(
      () =>
        useRecordInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('name', 'Name Value');
      result.current.startEdit('phone', '123-456-7890');
    });

    expect(result.current.getFieldState('name').isEditing).toBe(true);
    expect(result.current.getFieldState('phone').isEditing).toBe(true);
    expect(result.current.hasActiveEdit).toBe(true);
  });

  it('setEditValue updates specific field value', () => {
    const { result } = renderHook(
      () =>
        useRecordInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('name', 'Initial');
    });

    act(() => {
      result.current.setEditValue('name', 'Updated');
    });

    expect(result.current.getFieldState('name').editValue).toBe('Updated');
  });

  it('cancelEdit removes field from edit mode', () => {
    const { result } = renderHook(
      () =>
        useRecordInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('name', 'Initial');
    });

    expect(result.current.getFieldState('name').isEditing).toBe(true);

    act(() => {
      result.current.cancelEdit('name');
    });

    expect(result.current.getFieldState('name').isEditing).toBe(false);
    expect(result.current.hasActiveEdit).toBe(false);
  });

  it('cancelAllEdits clears all field edits', () => {
    const { result } = renderHook(
      () =>
        useRecordInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('name', 'Name');
      result.current.startEdit('phone', 'Phone');
      result.current.startEdit('email', 'Email');
    });

    expect(result.current.hasActiveEdit).toBe(true);

    act(() => {
      result.current.cancelAllEdits();
    });

    expect(result.current.hasActiveEdit).toBe(false);
    expect(result.current.getFieldState('name').isEditing).toBe(false);
    expect(result.current.getFieldState('phone').isEditing).toBe(false);
    expect(result.current.getFieldState('email').isEditing).toBe(false);
  });

  it('saveField calls API for specific field', async () => {
    const { result } = renderHook(
      () =>
        useRecordInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('name', 'New Name');
    });

    await act(async () => {
      await result.current.saveField('name');
    });

    expect(mockPut).toHaveBeenCalledWith('/Account/acc-123', { name: 'New Name' });
  });

  it('saveField clears edit state on success', async () => {
    const { result } = renderHook(
      () =>
        useRecordInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('name', 'New Name');
    });

    await act(async () => {
      await result.current.saveField('name');
    });

    expect(result.current.getFieldState('name').isEditing).toBe(false);
  });

  it('saveField sets error on failure', async () => {
    mockPut.mockRejectedValue(new Error('Save failed'));
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useRecordInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
          onError,
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEdit('name', 'New Name');
    });

    await act(async () => {
      await result.current.saveField('name');
    });

    expect(result.current.getFieldState('name').error).not.toBeNull();
    expect(onError).toHaveBeenCalled();
  });

  it('does not save if field is not in edit mode', async () => {
    const { result } = renderHook(
      () =>
        useRecordInlineEdit({
          entityType: 'Account',
          recordId: 'acc-123',
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.saveField('nonexistent');
    });

    expect(mockPut).not.toHaveBeenCalled();
  });
});
