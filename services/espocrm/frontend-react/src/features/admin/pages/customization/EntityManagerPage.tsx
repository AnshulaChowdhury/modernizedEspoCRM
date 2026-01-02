/**
 * EntityManagerPage - Main entity manager listing page
 * Uses global MetadataProvider like Backbone's this.getMetadata().get('scopes')
 */
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { EntityList } from '../../modules/entity-manager/components/EntityList';
import { entityManagerApi } from '../../modules/entity-manager/api';
import { useAdminStore } from '../../store';
import { useMetadata } from '@/lib/metadata/useMetadata';

export function EntityManagerPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const { rebuild } = useAdminStore();
  const { metadata, isLoading, error } = useMetadata();

  // Get scopes from global metadata (like Backbone's this.getMetadata().get('scopes'))
  // Cast to EntityScope since metadata uses passthrough() and contains all properties
  const scopes = (metadata?.scopes ?? {}) as unknown as Record<string, import('../../modules/entity-manager/types').EntityScope>;

  const deleteMutation = useMutation({
    mutationFn: async (scope: string) => {
      await entityManagerApi.deleteEntity(scope);
      await rebuild();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['metadata'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Failed to load entities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <EntityList
        scopes={scopes}
        onDelete={(scope) => deleteMutation.mutate(scope)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}

export default EntityManagerPage;
