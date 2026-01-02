import React, { useCallback } from 'react';
import { Trash2, Edit, Download, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModal } from '@/components/modals';
import { cn } from '@/lib/utils/cn';

interface MassActionsBarProps {
  /** Number of selected records */
  selectedCount: number;
  /** Handler for mass delete */
  onMassDelete: () => void;
  /** Handler for mass update */
  onMassUpdate?: () => void;
  /** Handler for mass export */
  onMassExport?: () => void;
  /** Handler to clear selection */
  onClearSelection: () => void;
  /** Whether an action is processing */
  isProcessing?: boolean;
  /** Current action being processed */
  processingAction?: string | null;
  /** Whether user can delete */
  canDelete?: boolean;
  /** Whether user can edit */
  canEdit?: boolean;
  /** Additional class name */
  className?: string;
}

export function MassActionsBar({
  selectedCount,
  onMassDelete,
  onMassUpdate,
  onMassExport,
  onClearSelection,
  isProcessing = false,
  processingAction,
  canDelete = true,
  canEdit = true,
  className,
}: MassActionsBarProps): React.ReactElement | null {
  const { confirm } = useModal();

  const handleDeleteClick = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Delete Records',
      message: `Are you sure you want to delete ${selectedCount} record${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`,
      confirmLabel: `Delete ${selectedCount} Record${selectedCount !== 1 ? 's' : ''}`,
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });

    if (confirmed) {
      onMassDelete();
    }
  }, [confirm, selectedCount, onMassDelete]);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'bg-primary text-primary-foreground rounded-lg shadow-lg',
        'px-4 py-3 flex items-center gap-4',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{selectedCount} selected</span>
        <button
          onClick={onClearSelection}
          className="p-1 rounded hover:bg-primary-foreground/20"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="h-6 w-px bg-primary-foreground/30" />

      <div className="flex items-center gap-2">
        {canEdit && onMassUpdate && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onMassUpdate}
            disabled={isProcessing}
          >
            {isProcessing && processingAction === 'update' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Edit className="h-4 w-4 mr-2" />
            )}
            Update
          </Button>
        )}

        {onMassExport && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onMassExport}
            disabled={isProcessing}
          >
            {isProcessing && processingAction === 'export' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        )}

        {canDelete && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isProcessing}
            className="text-destructive hover:text-destructive"
          >
            {isProcessing && processingAction === 'delete' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export default MassActionsBar;
