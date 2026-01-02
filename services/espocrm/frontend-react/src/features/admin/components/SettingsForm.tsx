/**
 * SettingsForm - Reusable settings form component
 * Renders fields from metadata and handles save/cancel actions
 */
import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { FieldRenderer } from '@/fields';
import type { FieldDef } from '@/fields/types';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { cn } from '@/lib/utils/cn';

interface SettingsFormProps {
  /** Entity type or scope for settings */
  scope: string;
  /** Initial values */
  initialValues: Record<string, unknown>;
  /** Fields to display (if not all) */
  fields?: string[];
  /** Callback on save */
  onSave: (values: Record<string, unknown>) => Promise<void>;
  /** Whether form is in loading state */
  isLoading?: boolean;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Title for the form */
  title?: string;
  /** Description for the form */
  description?: string;
}

export function SettingsForm({
  scope,
  initialValues,
  fields,
  onSave,
  isLoading = false,
  isSaving = false,
  title,
  description,
}: SettingsFormProps): React.ReactElement {
  const { metadata } = useMetadata();
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [isDirty, setIsDirty] = useState(false);

  // Update values when initialValues change
  useEffect(() => {
    setValues(initialValues);
    setIsDirty(false);
  }, [initialValues]);

  // Get field definitions from metadata
  const entityDefs = metadata?.entityDefs?.[scope];
  const fieldDefs = entityDefs?.fields ?? {};

  // Filter fields if specified
  const fieldsToRender = fields ?? Object.keys(fieldDefs);

  const handleFieldChange = (fieldName: string) => (value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await onSave(values);
    setIsDirty(false);
  };

  const handleReset = () => {
    setValues(initialValues);
    setIsDirty(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      {(title || description) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && <h2 className="text-lg font-medium text-gray-900">{title}</h2>}
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      )}

      {/* Form fields */}
      <div className="p-6 space-y-6">
        {fieldsToRender.map((fieldName) => {
          const rawFieldDef = fieldDefs[fieldName];
          if (!rawFieldDef) return null;

          // Skip system fields
          if (rawFieldDef.notStorable && !rawFieldDef.isCustom) return null;

          const label = typeof rawFieldDef.label === 'string' ? rawFieldDef.label : fieldName;
          const tooltip = typeof rawFieldDef.tooltip === 'string' ? rawFieldDef.tooltip : null;

          // Build FieldDef with proper type casting for FieldRenderer
          const fieldDef: FieldDef = {
            type: rawFieldDef.type ?? 'varchar',
            required: rawFieldDef.required,
            readOnly: rawFieldDef.readOnly,
            disabled: rawFieldDef.disabled,
            options: rawFieldDef.options?.map(String),
            maxLength: rawFieldDef.maxLength,
            min: rawFieldDef.min,
            max: rawFieldDef.max,
            entity: rawFieldDef.entity,
          };

          return (
            <div key={fieldName} className="grid grid-cols-3 gap-4 items-start">
              <label className="text-sm font-medium text-gray-700 pt-2">
                {label}
                {rawFieldDef.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="col-span-2">
                <FieldRenderer
                  name={fieldName}
                  value={values[fieldName]}
                  mode="edit"
                  fieldDef={fieldDef}
                  entityType={scope}
                  onChange={handleFieldChange(fieldName)}
                  disabled={rawFieldDef.readOnly}
                />
                {tooltip && (
                  <p className="mt-1 text-xs text-gray-500">{tooltip}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <button
          type="button"
          onClick={handleReset}
          disabled={!isDirty || isSaving}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            isDirty && !isSaving
              ? 'text-gray-700 hover:bg-gray-200'
              : 'text-gray-400 cursor-not-allowed'
          )}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            isDirty && !isSaving
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
      </div>
    </div>
  );
}

export default SettingsForm;
