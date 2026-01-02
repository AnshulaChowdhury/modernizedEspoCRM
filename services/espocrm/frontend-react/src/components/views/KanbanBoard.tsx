import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, GripVertical, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { get, put } from '@/api/client';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

interface KanbanBoardProps {
  entityType: string;
  /** Field to group by (must be an enum field) */
  groupField: string;
  /** Field to use as card title */
  titleField?: string;
  /** Additional fields to show on cards */
  cardFields?: string[];
  className?: string;
}

interface KanbanRecord {
  id: string;
  [key: string]: unknown;
}

interface ListResponse {
  total: number;
  list: KanbanRecord[];
}

export function KanbanBoard({
  entityType,
  groupField,
  titleField = 'name',
  cardFields = [],
  className,
}: KanbanBoardProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { metadata } = useMetadata();
  const [draggedCard, setDraggedCard] = useState<KanbanRecord | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Get enum options for the group field
  const groupOptions = useMemo<string[]>(() => {
    const fieldDef = metadata?.entityDefs?.[entityType]?.fields?.[groupField] as
      | { options?: string[] }
      | undefined;
    return fieldDef?.options ?? [];
  }, [metadata, entityType, groupField]);

  // Fetch all records
  const { data, isLoading, error } = useQuery<ListResponse, Error>({
    queryKey: ['kanban', entityType, groupField],
    queryFn: async () => {
      const response = await get<ListResponse>(
        `/${entityType}?maxSize=200&orderBy=createdAt&order=desc`
      );
      return response;
    },
    enabled: !!entityType,
  });

  // Group records by the group field
  const groupedRecords = useMemo(() => {
    const groups: Record<string, KanbanRecord[]> = {};

    // Initialize all groups
    for (const option of groupOptions) {
      groups[option] = [];
    }

    // Also add empty group for records without a value
    groups[''] = [];

    // Group records
    if (data?.list) {
      for (const record of data.list) {
        const groupValue = (record[groupField] as string) ?? '';
        if (!groups[groupValue]) {
          groups[groupValue] = [];
        }
        groups[groupValue].push(record);
      }
    }

    return groups;
  }, [data?.list, groupField, groupOptions]);

  // Move mutation
  const moveMutation = useMutation({
    mutationFn: async ({ recordId, newGroup }: { recordId: string; newGroup: string }) => {
      const response = await put<KanbanRecord>(`/${entityType}/${recordId}`, {
        [groupField]: newGroup || null,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', entityType, groupField] });
      queryClient.invalidateQueries({ queryKey: ['entityList', entityType] });
    },
  });

  // Drag handlers
  const handleDragStart = useCallback((record: KanbanRecord) => {
    setDraggedCard(record);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCard(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, columnId: string) => {
      e.preventDefault();
      if (draggedCard && draggedCard[groupField] !== columnId) {
        moveMutation.mutate({ recordId: draggedCard.id, newGroup: columnId });
      }
      setDraggedCard(null);
      setDragOverColumn(null);
    },
    [draggedCard, groupField, moveMutation]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        Error loading records: {error.message}
      </div>
    );
  }

  // Build columns from options plus empty
  const columns = [...groupOptions];
  const emptyRecords = groupedRecords[''];
  if (emptyRecords && emptyRecords.length > 0) {
    columns.unshift('');
  }

  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
      {columns.map((columnId) => (
        <KanbanColumn
          key={columnId || '__empty__'}
          columnId={columnId}
          title={columnId || '(No Value)'}
          records={groupedRecords[columnId] ?? []}
          entityType={entityType}
          titleField={titleField}
          cardFields={cardFields}
          isDragOver={dragOverColumn === columnId}
          onDragOver={(e) => handleDragOver(e, columnId)}
          onDrop={(e) => handleDrop(e, columnId)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}

interface KanbanColumnProps {
  columnId: string;
  title: string;
  records: KanbanRecord[];
  entityType: string;
  titleField: string;
  cardFields: string[];
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (record: KanbanRecord) => void;
  onDragEnd: () => void;
}

function KanbanColumn({
  columnId,
  title,
  records,
  entityType,
  titleField,
  cardFields,
  isDragOver,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
}: KanbanColumnProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex-shrink-0 w-72 bg-muted/30 rounded-lg p-3',
        isDragOver && 'ring-2 ring-primary'
      )}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {records.length}
          </span>
        </div>
        <Link to={`/${entityType}/create?${columnId ? `${columnId}=${columnId}` : ''}`}>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Cards */}
      <div className="space-y-2 min-h-[100px]">
        {records.map((record) => (
          <KanbanCard
            key={record.id}
            record={record}
            entityType={entityType}
            titleField={titleField}
            cardFields={cardFields}
            onDragStart={() => onDragStart(record)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  record: KanbanRecord;
  entityType: string;
  titleField: string;
  cardFields: string[];
  onDragStart: () => void;
  onDragEnd: () => void;
}

function KanbanCard({
  record,
  entityType,
  titleField,
  cardFields,
  onDragStart,
  onDragEnd,
}: KanbanCardProps): React.ReactElement {
  const [showMenu, setShowMenu] = useState(false);

  const title = (record[titleField] as string) ?? record.id;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'bg-background rounded-md border p-3 shadow-sm',
        'cursor-grab active:cursor-grabbing',
        'hover:border-primary/50 transition-colors'
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <Link
            to={`/${entityType}/view/${record.id}`}
            className="font-medium text-sm hover:text-primary truncate block"
          >
            {title}
          </Link>

          {/* Additional fields */}
          {cardFields.length > 0 && (
            <div className="mt-2 space-y-1">
              {cardFields.map((field) => {
                const value = record[field];
                if (value === null || value === undefined) return null;

                return (
                  <div key={field} className="text-xs text-muted-foreground truncate">
                    {String(value)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-background border rounded-md shadow-lg py-1 min-w-[120px]">
                <Link
                  to={`/${entityType}/view/${record.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Link>
                <Link
                  to={`/${entityType}/edit/${record.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted w-full text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default KanbanBoard;
