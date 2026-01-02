import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { get, del, put } from '@/api/client';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useDetailLayout, getDefaultDetailLayout, LayoutRenderer } from '@/lib/layout';
import { initializeFieldTypes } from '@/fields';
import { useAcl } from '@/lib/acl';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  RelationshipPanels,
  StreamFeed,
  ActivitiesPanel,
  HistoryPanel,
} from '@/components/views';
import { cn } from '@/lib/utils/cn';
import type { FieldDef } from '@/fields/types';

// Initialize field types
initializeFieldTypes();

interface RecordDetailProps {
  entityType: string;
  recordId: string;
  className?: string;
}

export function RecordDetail({
  entityType,
  recordId,
  className,
}: RecordDetailProps): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { metadata } = useMetadata();
  const { checkModel } = useAcl();
  const { layout: detailLayout, isLoading: layoutLoading } = useDetailLayout(entityType);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());

  // Get field definitions from metadata
  const fieldDefs = useMemo(() => {
    const defs = metadata?.entityDefs?.[entityType]?.fields ?? {};
    // Convert to FieldDef type
    const typedDefs: Record<string, FieldDef> = {};
    for (const [key, value] of Object.entries(defs)) {
      typedDefs[key] = value as FieldDef;
    }
    return typedDefs;
  }, [metadata, entityType]);

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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await del(`/${entityType}/${recordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityList', entityType] });
      navigate(`/${entityType}`);
    },
  });

  // Inline edit save handler
  const handleInlineEditSave = useCallback(
    async (fieldName: string, value: unknown) => {
      setSavingFields((prev) => new Set(prev).add(fieldName));

      try {
        const response = await put<Record<string, unknown>>(
          `/${entityType}/${recordId}`,
          { [fieldName]: value }
        );

        // Update the cache with new data
        queryClient.setQueryData(['entity', entityType, recordId], response);
        queryClient.invalidateQueries({ queryKey: ['entityList', entityType] });
      } catch (error) {
        console.error('Failed to save field:', fieldName, error);
        // Could show a toast notification here
      } finally {
        setSavingFields((prev) => {
          const next = new Set(prev);
          next.delete(fieldName);
          return next;
        });
      }
    },
    [entityType, recordId, queryClient]
  );

  // Check permissions
  const canEdit = record ? checkModel(entityType, record, 'edit') : false;
  const canDelete = record ? checkModel(entityType, record, 'delete') : false;

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

  const recordName = (record.name as string) ?? recordId;

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
            <h1 className="text-2xl font-bold text-foreground">{recordName}</h1>
            <p className="text-sm text-muted-foreground">{entityType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link to={`/${entityType}/edit/${recordId}`}>
              <Button variant="outline">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Layout-based content */}
          <LayoutRenderer
            layout={layout}
            type="detail"
            fieldDefs={fieldDefs}
            record={record}
            entityType={entityType}
            mode="detail"
            inlineEdit={canEdit}
            onInlineEditSave={handleInlineEditSave}
            savingFields={savingFields}
          />

          {/* Related Records */}
          <RelationshipPanels
            entityType={entityType}
            recordId={recordId}
          />

          {/* Activity Stream */}
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-4">Activity</h3>
            <StreamFeed
              entityType={entityType}
              recordId={recordId}
            />
          </div>
        </div>

        {/* Right Column - Side Panels */}
        <div className="space-y-4">
          <ActivitiesPanel
            entityType={entityType}
            recordId={recordId}
          />
          <HistoryPanel
            entityType={entityType}
            recordId={recordId}
            defaultCollapsed
          />
        </div>
      </div>

      {/* System Information */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">System Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">ID:</span>
            <span className="ml-2 font-mono">{record.id as string}</span>
          </div>
          {typeof record.createdAt === 'string' && (
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2">
                {new Date(record.createdAt).toLocaleString()}
              </span>
            </div>
          )}
          {typeof record.modifiedAt === 'string' && (
            <div>
              <span className="text-muted-foreground">Modified:</span>
              <span className="ml-2">
                {new Date(record.modifiedAt).toLocaleString()}
              </span>
            </div>
          )}
          {typeof record.createdByName === 'string' && (
            <div>
              <span className="text-muted-foreground">Created By:</span>
              <span className="ml-2">{record.createdByName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Delete {entityType}</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete "{recordName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordDetail;
