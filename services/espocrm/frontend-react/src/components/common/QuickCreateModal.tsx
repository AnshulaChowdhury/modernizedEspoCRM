/**
 * QuickCreateModal - Modal for quick-creating related records
 * Matches Backbone's quick-create functionality for link fields
 * Uses React Portal to render outside parent form hierarchy
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Save } from 'lucide-react';
import { apiClient, ApiError } from '@/api/client';

interface QuickCreateModalProps {
  entityType: 'TargetList' | 'Campaign';
  queryKey: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (record: { id: string; name: string }) => void;
}

export function QuickCreateModal({
  entityType,
  queryKey,
  isOpen,
  onClose,
  onCreated,
}: QuickCreateModalProps): React.ReactElement | null {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiClient.post(`/${entityType}`, data);
      return response.data as { id: string; name: string };
    },
    onSuccess: async (data) => {
      // Invalidate and refetch the query cache, then select the new record
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      await queryClient.refetchQueries({ queryKey: [queryKey] });
      onCreated(data);
      setName('');
      setError(null);
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create record');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError(null);
    createMutation.mutate({ name: name.trim() });
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const entityLabel = entityType === 'TargetList' ? 'Target List' : 'Campaign';

  // Use portal to render outside parent form hierarchy
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Create {entityLabel}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={`Enter ${entityLabel.toLowerCase()} name`}
              />
              {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default QuickCreateModal;
