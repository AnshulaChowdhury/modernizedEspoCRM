/**
 * FieldAddPage - Add new field to an entity
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { FieldForm } from '../../modules/field-manager/components/FieldForm';
import { fieldManagerApi } from '../../modules/field-manager/api';
import { useAdminStore } from '../../store';
import type { CreateFieldData } from '../../modules/field-manager/types';

export function FieldAddPage(): React.ReactElement {
  const { scope } = useParams<{ scope: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { rebuild } = useAdminStore();

  const createMutation = useMutation({
    mutationFn: async (data: CreateFieldData) => {
      await fieldManagerApi.createField(scope!, data);
      await rebuild();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fieldManager', 'fields', scope] });
      navigate(`/Admin/fieldManager/scope/${scope}/field/${variables.name}`);
    },
  });

  if (!scope) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Entity scope is required</p>
        </div>
      </div>
    );
  }

  return (
    <FieldForm
      scope={scope}
      mode="create"
      onSubmit={(data) => createMutation.mutateAsync(data as CreateFieldData)}
      isSubmitting={createMutation.isPending}
    />
  );
}

export default FieldAddPage;
