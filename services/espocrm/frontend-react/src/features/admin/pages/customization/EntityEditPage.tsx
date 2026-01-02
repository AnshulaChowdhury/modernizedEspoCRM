/**
 * EntityEditPage - Edit entity properties page
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { EntityForm } from '../../modules/entity-manager/components/EntityForm';
import { entityManagerApi } from '../../modules/entity-manager/api';
import { useAdminStore } from '../../store';
import type { UpdateEntityData } from '../../modules/entity-manager/types';

export function EntityEditPage(): React.ReactElement {
  const { scope } = useParams<{ scope: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { rebuild } = useAdminStore();

  // Fetch scope metadata
  const { data: scopes, isLoading, error } = useQuery({
    queryKey: ['metadata', 'scopes'],
    queryFn: () => entityManagerApi.getScopes(),
    staleTime: 60000,
  });

  const scopeData = scopes?.[scope ?? ''];

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateEntityData) => {
      await entityManagerApi.updateEntity(scope!, data);
      await rebuild();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata', 'scopes'] });
      navigate(`/Admin/entityManager/scope/${scope}`);
    },
  });

  const handleSubmit = async (data: UpdateEntityData) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !scopeData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Entity not found: {scope}</p>
        </div>
      </div>
    );
  }

  return (
    <EntityForm
      mode="edit"
      initialData={{ ...scopeData, name: scope! }}
      onSubmit={handleSubmit}
      isSubmitting={updateMutation.isPending}
    />
  );
}

export default EntityEditPage;
