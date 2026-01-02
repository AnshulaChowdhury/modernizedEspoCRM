/**
 * FieldManagerPage - Field list for an entity
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft } from 'lucide-react';
import { FieldList } from '../../modules/field-manager/components/FieldList';
import { fieldManagerApi } from '../../modules/field-manager/api';
import { useAdminStore } from '../../store';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useTranslation } from '@/hooks/useTranslation';

export function FieldManagerPage(): React.ReactElement {
  const { scope } = useParams<{ scope: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { rebuild } = useAdminStore();
  const { metadata, isLoading: metadataLoading } = useMetadata();
  const { translateField } = useTranslation();

  // Get fields from global metadata
  const fields = scope ? (metadata?.entityDefs?.[scope]?.fields ?? {}) : {};

  // Build labels from translation system (like Backbone does)
  const labels = React.useMemo(() => {
    if (!scope || !fields) return {};
    const result: Record<string, string> = {};
    Object.keys(fields).forEach((fieldName) => {
      result[fieldName] = translateField(scope, fieldName);
    });
    return result;
  }, [scope, fields, translateField]);

  // Delete field mutation
  const deleteMutation = useMutation({
    mutationFn: async (field: string) => {
      await fieldManagerApi.deleteField(scope!, field);
      await rebuild();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldManager', 'fields', scope] });
      queryClient.invalidateQueries({ queryKey: ['metadata'] });
    },
  });

  // Reset field mutation
  const resetMutation = useMutation({
    mutationFn: async (field: string) => {
      await fieldManagerApi.resetFieldToDefault(scope!, field);
      await rebuild();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldManager', 'fields', scope] });
      queryClient.invalidateQueries({ queryKey: ['metadata'] });
    },
  });

  if (!scope) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/Admin/entityManager')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Select an Entity</h1>
        </div>
        <p className="text-gray-500">
          Please select an entity from the Entity Manager to manage its fields.
        </p>
      </div>
    );
  }

  if (metadataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4">
        <button
          onClick={() => navigate(`/Admin/entityManager/scope/${scope}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {scope}
        </button>
      </div>
      <FieldList
        scope={scope}
        fields={fields ?? {}}
        labels={labels}
        onDelete={(field) => deleteMutation.mutate(field)}
        onReset={(field) => resetMutation.mutate(field)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}

export default FieldManagerPage;
