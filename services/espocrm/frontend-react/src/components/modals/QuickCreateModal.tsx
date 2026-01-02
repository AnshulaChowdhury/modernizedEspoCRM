import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/api/client';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useDetailLayout, getDefaultDetailLayout, LayoutRenderer } from '@/lib/layout';
import { useFormValidation } from '@/lib/validation';
import { initializeFieldTypes } from '@/fields';
import { BaseModal } from './BaseModal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { QuickCreateModalConfig, SelectedRecord } from './types';
import type { FieldDef } from '@/fields/types';

initializeFieldTypes();

interface QuickCreateModalProps {
  config: QuickCreateModalConfig;
  onCreate: (record: SelectedRecord | null) => void;
  onCancel: () => void;
}

export function QuickCreateModal({ config, onCreate, onCancel }: QuickCreateModalProps) {
  const { entityType, title, defaultValues: initialDefaults = {}, requiredFields = [] } = config;
  const queryClient = useQueryClient();
  const { metadata, isLoading: metadataLoading } = useMetadata();
  const { layout: detailLayout, isLoading: layoutLoading } = useDetailLayout(entityType);
  const [formData, setFormData] = useState<Record<string, unknown>>(initialDefaults);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get entity label from metadata
  const entityLabel = String(metadata?.entityDefs?.[entityType]?.label ?? entityType);

  // Get field definitions from metadata
  const fieldDefs = useMemo(() => {
    const defs = metadata?.entityDefs?.[entityType]?.fields ?? {};
    const typedDefs: Record<string, FieldDef> = {};
    for (const [key, value] of Object.entries(defs)) {
      typedDefs[key] = value as FieldDef;
    }
    return typedDefs;
  }, [metadata, entityType]);

  // Use Zod-based form validation from metadata
  const { validate: zodValidate, validateField, isReady: validationReady } = useFormValidation(
    entityType,
    {
      skipReadOnly: true,
      excludeFields: ['id', 'deleted', 'createdAt', 'modifiedAt', 'createdBy', 'modifiedBy'],
    }
  );

  // Compute default values
  const defaults = useMemo(() => {
    const result: Record<string, unknown> = {};
    for (const [key, fieldDef] of Object.entries(fieldDefs)) {
      if (fieldDef.default !== undefined) {
        result[key] = fieldDef.default;
      }
    }
    return { ...result, ...initialDefaults };
  }, [fieldDefs, initialDefaults]);

  // Merge defaults with user-edited form data
  const mergedFormData = useMemo(() => {
    return { ...defaults, ...formData };
  }, [defaults, formData]);

  // Get simplified layout - prefer quick create fields or first few fields
  const layout = useMemo(() => {
    if (detailLayout) {
      // Filter to show only required fields + a few common ones for quick create
      const quickCreateFields = new Set([
        'name',
        'firstName',
        'lastName',
        'emailAddress',
        'phoneNumber',
        ...requiredFields,
      ]);

      // Map panels but filter to quick-relevant fields
      return detailLayout.map((panel) => ({
        ...panel,
        rows: (panel.rows ?? [])
          .map((row) =>
            row.filter((cell) => {
              if (cell === false) return false;
              const fieldName = cell.name;
              const fieldDef = fieldDefs[fieldName];
              return (
                fieldDef?.required ||
                quickCreateFields.has(fieldName) ||
                requiredFields.includes(fieldName)
              );
            })
          )
          .filter((row) => row.length > 0),
      })).filter((panel) => (panel.rows?.length ?? 0) > 0);
    }
    return getDefaultDetailLayout(fieldDefs);
  }, [detailLayout, fieldDefs, requiredFields]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await post<{ id: string; name: string; [key: string]: unknown }>(
        `/${entityType}`,
        data
      );
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entityList', entityType] });
      queryClient.invalidateQueries({ queryKey: ['recordSelect', entityType] });
      onCreate({ id: data.id, name: data.name ?? String(data.id) });
    },
  });

  // Handle field change with real-time validation
  const handleChange = useCallback(
    (field: string, value: unknown): void => {
      const updatedFormData = { ...defaults, ...formData, [field]: value };
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Validate the field on change
      if (validationReady) {
        const fieldError = validateField(field, value, updatedFormData);
        setValidationErrors((prev) => {
          if (fieldError) {
            return { ...prev, [field]: fieldError };
          } else {
            const next = { ...prev };
            delete next[field];
            return next;
          }
        });
      }
    },
    [defaults, formData, validateField, validationReady]
  );

  // Validate form using Zod schemas
  const validate = useCallback((): boolean => {
    if (!validationReady) {
      // Fallback to basic required check if validation not ready
      const errors: Record<string, string> = {};
      for (const [fieldName, fieldDef] of Object.entries(fieldDefs)) {
        if (fieldDef.required || requiredFields.includes(fieldName)) {
          const value = mergedFormData[fieldName];
          if (value === null || value === undefined || value === '') {
            errors[fieldName] = `${formatFieldName(fieldName)} is required`;
          }
        }
      }
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    }

    // Use comprehensive Zod validation
    const result = zodValidate(mergedFormData);
    setValidationErrors(result.errors);
    return result.isValid;
  }, [validationReady, zodValidate, mergedFormData, fieldDefs, requiredFields]);

  // Handle save
  const handleSave = (): void => {
    if (!validate()) {
      return;
    }
    createMutation.mutate(mergedFormData);
  };

  const isLoading = metadataLoading || layoutLoading;

  return (
    <BaseModal
      open={true}
      onOpenChange={(open) => !open && onCancel()}
      title={title ?? `Create ${entityLabel}`}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={createMutation.isPending || isLoading}>
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Error display */}
          {createMutation.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
              Error creating record: {createMutation.error.message}
            </div>
          )}

          {/* Validation errors */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <ul className="list-disc list-inside text-red-600 text-sm">
                {Object.values(validationErrors).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Layout-based form */}
          <LayoutRenderer
            layout={layout}
            type="detail"
            fieldDefs={fieldDefs}
            record={{}}
            entityType={entityType}
            mode="edit"
            formData={mergedFormData}
            onChange={handleChange}
          />
        </div>
      )}
    </BaseModal>
  );
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
