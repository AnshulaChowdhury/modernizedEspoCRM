import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, X } from 'lucide-react';
import { get, put } from '@/api/client';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useDetailLayout, getDefaultDetailLayout, LayoutRenderer } from '@/lib/layout';
import { useFormValidation } from '@/lib/validation';
import { initializeFieldTypes } from '@/fields';
// ACL is checked in parent component
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils/cn';
import type { FieldDef } from '@/fields/types';

// Initialize field types
initializeFieldTypes();

interface RecordEditProps {
  entityType: string;
  recordId: string;
  className?: string;
}

export function RecordEdit({
  entityType,
  recordId,
  className,
}: RecordEditProps): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { metadata } = useMetadata();
  const { layout: detailLayout, isLoading: layoutLoading } = useDetailLayout(entityType);
  const [localFormData, setLocalFormData] = useState<Record<string, unknown> | null>(null);
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

  // Get layout or generate default
  const layout = useMemo(() => {
    if (detailLayout) {
      return detailLayout;
    }
    return getDefaultDetailLayout(fieldDefs);
  }, [detailLayout, fieldDefs]);

  // Fetch record
  const { data: record, isLoading, error } = useQuery<Record<string, unknown>, Error>({
    queryKey: ['entity', entityType, recordId],
    queryFn: async () => {
      const response = await get<Record<string, unknown>>(`/${entityType}/${recordId}`);
      return response;
    },
    enabled: !!entityType && !!recordId,
  });

  // Use localFormData if user has edited, otherwise use record
  const formData = localFormData ?? record ?? {};

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      // Only send changed fields
      const changedFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (record && record[key] !== value) {
          changedFields[key] = value;
        }
      }

      if (Object.keys(changedFields).length === 0) {
        return record;
      }

      const response = await put<Record<string, unknown>>(
        `/${entityType}/${recordId}`,
        changedFields
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity', entityType, recordId] });
      queryClient.invalidateQueries({ queryKey: ['entityList', entityType] });
      navigate(`/${entityType}/view/${recordId}`);
    },
  });

  // Handle field change with real-time validation
  const handleChange = useCallback((field: string, value: unknown): void => {
    const updatedFormData = { ...(localFormData ?? record ?? {}), [field]: value };
    setLocalFormData(updatedFormData);

    // Validate the field on change (debounced feel through React batching)
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
  }, [localFormData, record, validateField, validationReady]);

  // Validate form using Zod schemas
  const validate = useCallback((): boolean => {
    if (!validationReady) {
      // Fallback to basic required check if validation not ready
      const errors: Record<string, string> = {};
      for (const [fieldName, fieldDef] of Object.entries(fieldDefs)) {
        if (fieldDef.required) {
          const value = formData[fieldName];
          if (value === null || value === undefined || value === '') {
            errors[fieldName] = `${formatFieldName(fieldName)} is required`;
          }
        }
      }
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    }

    // Use comprehensive Zod validation
    const result = zodValidate(formData);
    setValidationErrors(result.errors);
    return result.isValid;
  }, [validationReady, zodValidate, formData, fieldDefs]);

  // Handle save
  const handleSave = (): void => {
    if (!validate()) {
      return;
    }
    saveMutation.mutate(formData);
  };

  if (layoutLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        Error loading record: {error.message}
      </div>
    );
  }

  if (!record) {
    return (
      <div className="rounded-lg border p-4 text-muted-foreground">
        Record not found
      </div>
    );
  }

  const recordName = (formData.name as string) ?? recordId;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/${entityType}/view/${recordId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit {recordName}</h1>
            <p className="text-sm text-muted-foreground">{entityType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/${entityType}/view/${recordId}`}>
            <Button variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Error display */}
      {saveMutation.error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          Error saving record: {saveMutation.error.message}
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

      {/* Layout-based form */}
      <LayoutRenderer
        layout={layout}
        type="detail"
        fieldDefs={fieldDefs}
        record={record}
        entityType={entityType}
        mode="edit"
        formData={formData}
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

export default RecordEdit;
