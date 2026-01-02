import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, X } from 'lucide-react';
import { post } from '@/api/client';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useDetailLayout, getDefaultDetailLayout, LayoutRenderer } from '@/lib/layout';
import { useFormValidation } from '@/lib/validation';
import { initializeFieldTypes } from '@/fields';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DuplicateCheck } from '@/components/common/DuplicateCheck';
import { cn } from '@/lib/utils/cn';
import type { FieldDef } from '@/fields/types';

// Initialize field types
initializeFieldTypes();

interface RecordCreateProps {
  entityType: string;
  className?: string;
}

export function RecordCreate({
  entityType,
  className,
}: RecordCreateProps): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { metadata, isLoading: metadataLoading } = useMetadata();
  const { layout: detailLayout, isLoading: layoutLoading } = useDetailLayout(entityType);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
  const defaultValues = useMemo(() => {
    const defaults: Record<string, unknown> = {};
    for (const [key, fieldDef] of Object.entries(fieldDefs)) {
      if (fieldDef.default !== undefined) {
        defaults[key] = fieldDef.default;
      }
    }
    return defaults;
  }, [fieldDefs]);

  // Merge defaults with user-edited form data
  const mergedFormData = useMemo(() => {
    return { ...defaultValues, ...formData };
  }, [defaultValues, formData]);

  // Get layout or generate default
  const layout = useMemo(() => {
    if (detailLayout) {
      return detailLayout;
    }
    return getDefaultDetailLayout(fieldDefs);
  }, [detailLayout, fieldDefs]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await post<Record<string, unknown>>(`/${entityType}`, data);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entityList', entityType] });
      navigate(`/${entityType}/view/${data.id}`);
    },
  });

  // Handle field change with real-time validation
  const handleChange = useCallback((field: string, value: unknown): void => {
    const updatedFormData = { ...defaultValues, ...formData, [field]: value };
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
  }, [defaultValues, formData, validateField, validationReady]);

  // Validate form using Zod schemas
  const validate = useCallback((): boolean => {
    if (!validationReady) {
      // Fallback to basic required check if validation not ready
      const errors: Record<string, string> = {};
      for (const [fieldName, fieldDef] of Object.entries(fieldDefs)) {
        if (fieldDef.required) {
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
  }, [validationReady, zodValidate, mergedFormData, fieldDefs]);

  // Handle save
  const handleSave = (): void => {
    if (!validate()) {
      return;
    }
    createMutation.mutate(mergedFormData);
  };

  if (metadataLoading || layoutLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/${entityType}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create {entityType}</h1>
            <p className="text-sm text-muted-foreground">Fill in the details below</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/${entityType}`}>
            <Button variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>

      {/* Error display */}
      {createMutation.error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          Error creating record: {createMutation.error.message}
        </div>
      )}

      {/* Validation errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <ul className="list-disc list-inside text-destructive text-sm">
            {Object.values(validationErrors).map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Duplicate detection */}
      <DuplicateCheck
        entityType={entityType}
        formData={mergedFormData}
        onSelectDuplicate={(record) => {
          // Navigate to the existing record
          navigate(`/${entityType}/view/${record.id}`);
        }}
      />

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
  );
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export default RecordCreate;
