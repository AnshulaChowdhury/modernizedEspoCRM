import React, { useState, useCallback } from 'react';
import { Check, X, Pencil, Loader2 } from 'lucide-react';
import { FieldRenderer } from './FieldRenderer';
import type { FieldDef } from './types';
import { cn } from '@/lib/utils/cn';

interface InlineEditableFieldProps {
  /** Field name */
  name: string;
  /** Current field value */
  value: unknown;
  /** Field definition from metadata */
  fieldDef: FieldDef;
  /** Entity type */
  entityType: string;
  /** Full record data */
  record?: Record<string, unknown>;
  /** Whether inline editing is enabled */
  inlineEditEnabled?: boolean;
  /** Whether currently saving this field */
  isSaving?: boolean;
  /** Save error if any */
  error?: Error | null;
  /** Callback when field is saved */
  onSave?: (fieldName: string, value: unknown) => void;
  /** Custom label */
  label?: string;
  /** Additional CSS class */
  className?: string;
}

export function InlineEditableField({
  name,
  value,
  fieldDef,
  entityType,
  record,
  inlineEditEnabled = true,
  isSaving = false,
  error,
  onSave,
  label,
  className,
}: InlineEditableFieldProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<unknown>(value);

  // Check if field is editable
  const isReadOnly = fieldDef.readOnly || fieldDef.disabled;
  const canEdit = inlineEditEnabled && !isReadOnly && onSave;

  const handleStartEdit = useCallback(() => {
    if (!canEdit) return;
    setEditValue(value);
    setIsEditing(true);
  }, [canEdit, value]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(name, editValue);
      setIsEditing(false);
    }
  }, [onSave, name, editValue]);

  const handleChange = useCallback((newValue: unknown) => {
    setEditValue(newValue);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCancel, handleSave]
  );

  // Render the field in edit mode
  if (isEditing) {
    return (
      <div className={cn('inline-edit-field', className)} onKeyDown={handleKeyDown}>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <FieldRenderer
              name={name}
              value={editValue}
              fieldDef={fieldDef}
              mode="edit"
              entityType={entityType}
              record={record}
              onChange={handleChange}
              label={label}
            />
          </div>
          <div className="flex items-center gap-1 pt-1 flex-shrink-0">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="p-1.5 rounded-md hover:bg-green-100 text-green-600 transition-colors"
                  title="Save (Ctrl+Enter)"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-1.5 rounded-md hover:bg-red-100 text-red-600 transition-colors"
                  title="Cancel (Escape)"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
        {error && (
          <div className="text-xs text-destructive mt-1">{error.message}</div>
        )}
      </div>
    );
  }

  // Render the field in detail mode with edit trigger
  return (
    <div
      className={cn(
        'inline-edit-field group',
        canEdit && 'cursor-pointer rounded-md px-2 -mx-2 py-1 -my-1 hover:bg-muted/50 transition-colors',
        className
      )}
      onClick={canEdit ? handleStartEdit : undefined}
      onKeyDown={
        canEdit
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleStartEdit();
              }
            }
          : undefined
      }
      role={canEdit ? 'button' : undefined}
      tabIndex={canEdit ? 0 : undefined}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <FieldRenderer
            name={name}
            value={value}
            fieldDef={fieldDef}
            mode="detail"
            entityType={entityType}
            record={record}
            label={label}
          />
        </div>
        {canEdit && (
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

export default InlineEditableField;
