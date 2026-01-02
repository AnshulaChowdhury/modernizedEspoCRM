import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface InlineEditProps {
  /** The display value when not editing */
  children: React.ReactNode;
  /** Whether inline editing is enabled */
  enabled?: boolean;
  /** Whether the field is currently being saved */
  isSaving?: boolean;
  /** Callback when edit mode is entered */
  onEditStart?: () => void;
  /** Callback when edit is cancelled */
  onEditCancel?: () => void;
  /** Callback when save is requested */
  onSave?: () => void;
  /** The edit input/component to render */
  editComponent?: React.ReactNode;
  /** Whether currently in edit mode (controlled) */
  isEditing?: boolean;
  /** Callback to set edit mode (controlled) */
  setIsEditing?: (editing: boolean) => void;
  /** Additional class name */
  className?: string;
}

export function InlineEdit({
  children,
  enabled = true,
  isSaving = false,
  onEditStart,
  onEditCancel,
  onSave,
  editComponent,
  isEditing: controlledIsEditing,
  setIsEditing: controlledSetIsEditing,
  className,
}: InlineEditProps): React.ReactElement {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Support both controlled and uncontrolled modes
  const isEditing = controlledIsEditing ?? internalIsEditing;
  const setIsEditing = controlledSetIsEditing ?? setInternalIsEditing;

  const handleEditStart = useCallback(() => {
    if (!enabled || isSaving) return;
    setIsEditing(true);
    onEditStart?.();
  }, [enabled, isSaving, setIsEditing, onEditStart]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    onEditCancel?.();
  }, [setIsEditing, onEditCancel]);

  const handleSave = useCallback(() => {
    onSave?.();
  }, [onSave]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isEditing) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [isEditing, handleCancel, handleSave]
  );

  // Handle click outside to cancel
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, handleCancel]);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  if (isEditing) {
    return (
      <div
        ref={containerRef}
        className={cn('inline-edit-container', className)}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1">{editComponent}</div>
          <div className="flex items-center gap-1 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-50"
              title="Save (Ctrl+Enter)"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="p-1 rounded hover:bg-red-100 text-red-600 disabled:opacity-50"
              title="Cancel (Escape)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {isSaving && (
          <div className="text-xs text-muted-foreground mt-1">Saving...</div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'group inline-edit-display cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 transition-colors',
        className
      )}
      onClick={handleEditStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleEditStart();
        }
      }}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1">{children}</div>
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export default InlineEdit;
