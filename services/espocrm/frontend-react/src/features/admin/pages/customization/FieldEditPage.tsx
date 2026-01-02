/**
 * FieldEditPage - Edit existing field
 */
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { FieldForm } from '../../modules/field-manager/components/FieldForm';
import { fieldManagerApi } from '../../modules/field-manager/api';
import { useAdminStore } from '../../store';
import { useMetadata } from '@/lib/metadata/useMetadata';
import type { UpdateFieldData } from '../../modules/field-manager/types';

export function FieldEditPage(): React.ReactElement {
  const { scope, field } = useParams<{ scope: string; field: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { rebuild } = useAdminStore();
  const { metadata } = useMetadata();

  // Fetch field definition
  const { data: fieldDef, isLoading, error: fieldError } = useQuery({
    queryKey: ['fieldManager', 'field', scope, field],
    queryFn: () => fieldManagerApi.getField(scope!, field!),
    enabled: !!scope && !!field,
  });

  // Get foreignScope for link fields from metadata
  const foreignScope = useMemo(() => {
    if (!scope || !field || !metadata || !fieldDef) return null;
    if (fieldDef.type !== 'link' && fieldDef.type !== 'linkMultiple') return null;

    // Try to get from links metadata first, then from fields
    const links = metadata.entityDefs?.[scope]?.links as Record<string, { entity?: string }> | undefined;
    const fields = metadata.entityDefs?.[scope]?.fields as Record<string, { entity?: string }> | undefined;

    return links?.[field]?.entity ?? fields?.[field]?.entity ?? null;
  }, [scope, field, metadata, fieldDef]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateFieldData) => {
      await fieldManagerApi.updateField(scope!, field!, data);
      await rebuild();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldManager', 'fields', scope] });
      queryClient.invalidateQueries({ queryKey: ['fieldManager', 'field', scope, field] });
      navigate(`/Admin/fieldManager/scope/${scope}`);
    },
  });

  if (!scope || !field) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Entity scope and field name are required</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fieldError || !fieldDef) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Field not found: {field}</p>
        </div>
      </div>
    );
  }

  return (
    <FieldForm
      scope={scope}
      mode="edit"
      fieldName={field}
      initialData={fieldDef}
      foreignScope={foreignScope}
      onSubmit={(data) => updateMutation.mutateAsync(data)}
      isSubmitting={updateMutation.isPending}
    />
  );
}

export default FieldEditPage;
