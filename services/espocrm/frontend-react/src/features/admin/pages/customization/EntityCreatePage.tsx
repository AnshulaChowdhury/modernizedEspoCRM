/**
 * EntityCreatePage - Create new entity page
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EntityForm } from '../../modules/entity-manager/components/EntityForm';
import { entityManagerApi } from '../../modules/entity-manager/api';
import { useAdminStore } from '../../store';
import { ApiError } from '@/api/client';
import type { CreateEntityData } from '../../modules/entity-manager/types';

export function EntityCreatePage(): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { rebuild } = useAdminStore();
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: CreateEntityData) => {
      await entityManagerApi.createEntity(data);
      await rebuild();
      return data.name; // Return the submitted name (not server response which may have 'C' prefix)
    },
    onSuccess: async (entityName) => {
      // Force refetch global metadata to include the new entity
      await queryClient.refetchQueries({ queryKey: ['metadata'] });
      // Use the submitted entity name (matching Backbone behavior)
      navigate(`/Admin/entityManager/scope/${entityName}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to create entity');
      } else {
        setError('Failed to create entity');
      }
    },
  });

  const handleSubmit = async (data: CreateEntityData) => {
    setError(null);
    try {
      await createMutation.mutateAsync(data);
    } catch {
      // Error is handled by onError callback
    }
  };

  return (
    <div>
      {error && (
        <div className="max-w-3xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      <EntityForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}

export default EntityCreatePage;
