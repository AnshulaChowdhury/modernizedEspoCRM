import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Link as LinkIcon,
  Unlink,
  Pencil,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { get, del } from '@/api/client';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { FieldRenderer, initializeFieldTypes } from '@/fields';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils/cn';
import type { FieldDef } from '@/fields/types';

initializeFieldTypes();

interface RelationshipPanelProps {
  /** Parent entity type */
  entityType: string;
  /** Parent record ID */
  recordId: string;
  /** Link name (relationship name) */
  linkName: string;
  /** Optional custom title */
  title?: string;
  /** Columns to display */
  columns?: string[];
  /** Whether panel is initially expanded */
  defaultExpanded?: boolean;
  /** Maximum records to show initially */
  maxSize?: number;
  className?: string;
}

interface RelatedRecord {
  id: string;
  name?: string;
  [key: string]: unknown;
}

interface ListResponse {
  total: number;
  list: RelatedRecord[];
}

export function RelationshipPanel({
  entityType,
  recordId,
  linkName,
  title,
  columns,
  defaultExpanded = true,
  maxSize = 5,
  className,
}: RelationshipPanelProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { metadata } = useMetadata();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  // Get link definition from metadata
  const linkDef = useMemo(() => {
    const links = metadata?.entityDefs?.[entityType]?.links ?? {};
    return links[linkName] as { type?: string; entity?: string; foreign?: string } | undefined;
  }, [metadata, entityType, linkName]);

  const relatedEntityType = linkDef?.entity ?? linkName;
  const linkType = linkDef?.type ?? 'hasMany';

  // Get field definitions for related entity
  const fieldDefs = useMemo(() => {
    return (metadata?.entityDefs?.[relatedEntityType]?.fields ?? {}) as Record<string, FieldDef>;
  }, [metadata, relatedEntityType]);

  // Determine columns to show
  const displayColumns = useMemo(() => {
    if (columns && columns.length > 0) {
      return columns;
    }
    // Default columns
    return ['name'];
  }, [columns]);

  // Fetch related records
  const { data, isLoading, error } = useQuery<ListResponse, Error>({
    queryKey: ['relationship', entityType, recordId, linkName],
    queryFn: async () => {
      const response = await get<ListResponse>(
        `/${entityType}/${recordId}/${linkName}?maxSize=${showAll ? 200 : maxSize}`
      );
      return response;
    },
    enabled: !!entityType && !!recordId && !!linkName && isExpanded,
  });

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: async (relatedId: string) => {
      await del(`/${entityType}/${recordId}/${linkName}`, { data: { id: relatedId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['relationship', entityType, recordId, linkName],
      });
    },
  });

  const panelTitle = title ?? formatLinkName(linkName);
  const hasMore = data && data.total > data.list.length;

  return (
    <div className={cn('rounded-lg border', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className="font-semibold text-sm">{panelTitle}</h3>
          {data && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {data.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link to={`/${relatedEntityType}/create?${linkDef?.foreign ?? entityType.toLowerCase()}Id=${recordId}`}>
            <Button variant="ghost" size="sm" className="h-7">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
          {linkType === 'hasMany' && (
            <Button variant="ghost" size="sm" className="h-7" title="Link existing">
              <LinkIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="px-4 py-3 text-sm text-destructive">
              Error loading related records
            </div>
          ) : data?.list.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No related {panelTitle.toLowerCase()} found
            </div>
          ) : (
            <>
              <div className="divide-y">
                {data?.list.map((record) => (
                  <RelatedRecordRow
                    key={record.id}
                    record={record}
                    entityType={relatedEntityType}
                    columns={displayColumns}
                    fieldDefs={fieldDefs}
                    onUnlink={() => unlinkMutation.mutate(record.id)}
                    isUnlinking={unlinkMutation.isPending}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="px-4 py-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="w-full"
                  >
                    {showAll ? 'Show less' : `Show all ${data.total}`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface RelatedRecordRowProps {
  record: RelatedRecord;
  entityType: string;
  columns: string[];
  fieldDefs: Record<string, FieldDef>;
  onUnlink: () => void;
  isUnlinking: boolean;
}

function RelatedRecordRow({
  record,
  entityType,
  columns,
  fieldDefs,
  onUnlink,
  isUnlinking,
}: RelatedRecordRowProps): React.ReactElement {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="px-4 py-3 flex items-center gap-4 hover:bg-muted/30"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Fields */}
      <div className="flex-1 min-w-0 flex items-center gap-4">
        {columns.map((column, idx) => {
          const fieldDef = fieldDefs[column];
          const value = record[column];

          // First column is linked
          if (idx === 0) {
            return (
              <Link
                key={column}
                to={`/${entityType}/view/${record.id}`}
                className="font-medium text-primary hover:underline truncate"
              >
                {fieldDef ? (
                  <FieldRenderer
                    name={column}
                    value={value}
                    fieldDef={fieldDef}
                    mode="list"
                    entityType={entityType}
                    record={record}
                  />
                ) : (
                  String(value ?? record.name ?? record.id)
                )}
              </Link>
            );
          }

          return (
            <div key={column} className="text-sm text-muted-foreground truncate">
              {fieldDef ? (
                <FieldRenderer
                  name={column}
                  value={value}
                  fieldDef={fieldDef}
                  mode="list"
                  entityType={entityType}
                  record={record}
                />
              ) : (
                String(value ?? '')
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div
        className={cn(
          'flex items-center gap-1 transition-opacity',
          showActions ? 'opacity-100' : 'opacity-0'
        )}
      >
        <Link to={`/${entityType}/view/${record.id}`}>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
        <Link to={`/${entityType}/edit/${record.id}`}>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={onUnlink}
          disabled={isUnlinking}
          title="Unlink"
        >
          <Unlink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function formatLinkName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Component to render all relationship panels for a record
 */
interface RelationshipPanelsProps {
  entityType: string;
  recordId: string;
  className?: string;
}

export function RelationshipPanels({
  entityType,
  recordId,
  className,
}: RelationshipPanelsProps): React.ReactElement {
  const { metadata } = useMetadata();

  // Get all links for this entity
  const links = useMemo(() => {
    const linkDefs = metadata?.entityDefs?.[entityType]?.links ?? {};
    const result: Array<{ name: string; def: { type?: string; entity?: string } }> = [];

    for (const [name, def] of Object.entries(linkDefs)) {
      const linkDef = def as { type?: string; entity?: string; layoutRelationshipsDisabled?: boolean };

      // Only show hasMany and hasChildren relationships
      if (
        (linkDef.type === 'hasMany' || linkDef.type === 'hasChildren') &&
        !linkDef.layoutRelationshipsDisabled
      ) {
        result.push({ name, def: linkDef });
      }
    }

    return result;
  }, [metadata, entityType]);

  if (links.length === 0) {
    return <></>;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {links.map(({ name }) => (
        <RelationshipPanel
          key={name}
          entityType={entityType}
          recordId={recordId}
          linkName={name}
        />
      ))}
    </div>
  );
}

export default RelationshipPanel;
