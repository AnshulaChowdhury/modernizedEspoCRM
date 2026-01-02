/**
 * EntityManagerScopePage - View/configure a specific entity
 * Uses global MetadataProvider like Backbone's this.getMetadata()
 */
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Edit,
  Settings,
  Layout,
  Tag,
  Trash2,
} from 'lucide-react';
import { entityManagerApi } from '../../modules/entity-manager/api';
import { EntityRelationships } from '../../modules/entity-manager/components/EntityRelationships';
import { useAdminStore } from '../../store';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { cn } from '@/lib/utils/cn';
import type { CreateRelationshipData } from '../../modules/entity-manager/types';

export function EntityManagerScopePage(): React.ReactElement {
  const { scope } = useParams<{ scope: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { rebuild } = useAdminStore();
  const { metadata, isLoading: metadataLoading } = useMetadata();

  // Get scope and entity definitions from global metadata
  // Cast to proper types since metadata uses passthrough() and contains all properties
  const scopeData = scope ? (metadata?.scopes?.[scope] as unknown as import('../../modules/entity-manager/types').EntityScope | undefined) : undefined;
  const entityDefs = scope ? metadata?.entityDefs?.[scope] : undefined;

  // Fetch relationships (these are computed from entityDefs links)
  const { data: relationships, isLoading: relsLoading } = useQuery({
    queryKey: ['entityManager', 'relationships', scope],
    queryFn: () => entityManagerApi.getRelationships(scope!),
    enabled: !!scope && !!entityDefs,
  });

  const isLoading = metadataLoading || relsLoading;

  // Get available entities for relationships
  const availableEntities = useMemo(() => {
    if (!metadata?.scopes) return [];
    return Object.entries(metadata.scopes)
      .filter(([, s]) => s.entity)
      .map(([name]) => name)
      .sort();
  }, [metadata?.scopes]);

  // Create relationship mutation
  const createRelMutation = useMutation({
    mutationFn: async (data: CreateRelationshipData) => {
      await entityManagerApi.createRelationship(scope!, data);
      await rebuild();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['metadata'] });
      queryClient.invalidateQueries({ queryKey: ['entityManager', 'relationships', scope] });
    },
  });

  // Delete relationship mutation
  const deleteRelMutation = useMutation({
    mutationFn: async (link: string) => {
      await entityManagerApi.deleteRelationship(scope!, link);
      await rebuild();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['metadata'] });
      queryClient.invalidateQueries({ queryKey: ['entityManager', 'relationships', scope] });
    },
  });

  // Delete entity mutation
  const deleteEntityMutation = useMutation({
    mutationFn: async () => {
      await entityManagerApi.deleteEntity(scope!);
      await rebuild();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['metadata'] });
      navigate('/Admin/entityManager');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!scopeData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Entity not found: {scope}</p>
        </div>
      </div>
    );
  }

  const fieldCount = entityDefs?.fields ? Object.keys(entityDefs.fields).length : 0;
  const linkCount = entityDefs?.links ? Object.keys(entityDefs.links).length : 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/Admin/entityManager')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {scopeData.iconClass ? (
              <i className={cn(scopeData.iconClass, 'text-xl text-gray-600')} />
            ) : (
              <Database className="h-6 w-6 text-gray-600" />
            )}
            <h1 className="text-2xl font-semibold text-gray-900">{scope}</h1>
            {scopeData.isCustom && (
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                Custom
              </span>
            )}
            {scopeData.disabled && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                Disabled
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Type: {scopeData.type || 'Base'} • {fieldCount} fields • {linkCount} relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/Admin/entityManager/scope/${scope}/edit`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          {scopeData.isCustom && (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${scope}"? This action cannot be undone.`)) {
                  deleteEntityMutation.mutate();
                }
              }}
              disabled={deleteEntityMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => navigate(`/Admin/fieldManager/scope/${scope}`)}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <Tag className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Field Manager</div>
            <div className="text-sm text-gray-500">{fieldCount} fields defined</div>
          </div>
        </button>

        <button
          onClick={() => navigate(`/Admin/layouts/scope/${scope}`)}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-green-100 rounded-lg">
            <Layout className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Layout Manager</div>
            <div className="text-sm text-gray-500">Configure list, detail, etc.</div>
          </div>
        </button>

        <button
          onClick={() => navigate(`/Admin/dynamicLogic?scope=${scope}`)}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
        >
          <div className="p-2 bg-purple-100 rounded-lg">
            <Settings className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Dynamic Logic</div>
            <div className="text-sm text-gray-500">Field visibility rules</div>
          </div>
        </button>
      </div>

      {/* Entity properties */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Properties</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-500">Type</div>
            <div className="font-medium text-gray-900">{scopeData.type || 'Base'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Stream</div>
            <div className="font-medium text-gray-900">{scopeData.stream ? 'Enabled' : 'Disabled'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Tab</div>
            <div className="font-medium text-gray-900">{scopeData.tab ? 'Shown' : 'Hidden'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Kanban</div>
            <div className="font-medium text-gray-900">{scopeData.kanban ? 'Enabled' : 'Disabled'}</div>
          </div>
          {scopeData.color && (
            <div>
              <div className="text-sm text-gray-500">Color</div>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: scopeData.color }}
                />
                <span className="font-medium text-gray-900">{scopeData.color}</span>
              </div>
            </div>
          )}
          {scopeData.statusField && (
            <div>
              <div className="text-sm text-gray-500">Status Field</div>
              <div className="font-medium text-gray-900">{scopeData.statusField}</div>
            </div>
          )}
        </div>
      </div>

      {/* Relationships */}
      <EntityRelationships
        scope={scope!}
        relationships={relationships ?? []}
        availableEntities={availableEntities}
        onCreate={(data) => createRelMutation.mutateAsync(data)}
        onDelete={(link) => deleteRelMutation.mutateAsync(link)}
        isCreating={createRelMutation.isPending}
        isDeleting={deleteRelMutation.isPending}
      />
    </div>
  );
}

export default EntityManagerScopePage;
