/**
 * RelatedPanel - Generic panel for showing related records
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Link2, Plus, ExternalLink } from 'lucide-react';
import { apiClient } from '@/api/client';
import { SidePanel, PanelItem, PanelEmptyState } from './SidePanel';
import { useMetadata } from '@/lib/metadata/useMetadata';

interface RelatedRecord {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface RelatedPanelProps {
  /** Parent entity type */
  entityType: string;
  /** Parent record ID */
  recordId: string;
  /** Related entity type */
  relatedEntityType: string;
  /** Link name (relationship name) */
  linkName: string;
  /** Custom title (defaults to entity label) */
  title?: string;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Maximum records to show */
  maxSize?: number;
  /** Whether panel is initially collapsed */
  defaultCollapsed?: boolean;
  /** Field to display as subtitle */
  subtitleField?: string;
  /** Show "Create" button */
  allowCreate?: boolean;
  /** Show "View All" link */
  showViewAll?: boolean;
}

export function RelatedPanel({
  entityType,
  recordId,
  relatedEntityType,
  linkName,
  title,
  icon,
  maxSize = 5,
  defaultCollapsed = false,
  subtitleField,
  allowCreate = true,
  showViewAll = true,
}: RelatedPanelProps): React.ReactElement {
  const { metadata } = useMetadata();

  const entityLabel: string = title
    ?? String(metadata?.entityDefs?.[relatedEntityType]?.label ?? relatedEntityType);

  const {
    data: response,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['related', entityType, recordId, linkName],
    queryFn: async () => {
      const result = await apiClient.get<{ total: number; list: RelatedRecord[] }>(
        `/api/v1/${entityType}/${recordId}/${linkName}`,
        {
          params: {
            maxSize: maxSize + 1, // Fetch one extra to know if there are more
            orderBy: 'createdAt',
            order: 'desc',
          },
        }
      );
      return result.data;
    },
    staleTime: 60000, // 1 minute
  });

  const records = response?.list?.slice(0, maxSize) ?? [];
  const totalCount = response?.total ?? 0;
  const hasMore = totalCount > maxSize;

  return (
    <SidePanel
      title={entityLabel}
      icon={icon ?? <Link2 className="h-4 w-4" />}
      count={totalCount}
      isLoading={isLoading}
      onRefresh={() => refetch()}
      defaultCollapsed={defaultCollapsed}
      headerActions={
        allowCreate && (
          <Link
            to={`/${relatedEntityType}/create?parentType=${entityType}&parentId=${recordId}`}
            className="p-1 hover:bg-muted rounded"
            title={`Create ${entityLabel}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="h-4 w-4" />
          </Link>
        )
      }
    >
      {records.length === 0 ? (
        <PanelEmptyState message={`No ${entityLabel.toLowerCase()}`} />
      ) : (
        <div className="space-y-1">
          {records.map((record) => (
            <Link
              key={record.id}
              to={`/${relatedEntityType}/view/${record.id}`}
              className="block"
            >
              <PanelItem
                title={record.name ?? record.id}
                subtitle={subtitleField ? String(record[subtitleField] ?? '') : undefined}
                meta={<ExternalLink className="h-3 w-3" />}
              />
            </Link>
          ))}

          {showViewAll && hasMore && (
            <Link
              to={`/${entityType}/view/${recordId}/${linkName}`}
              className="block text-center text-sm text-primary hover:underline py-2"
            >
              View all {totalCount} {entityLabel.toLowerCase()}
            </Link>
          )}
        </div>
      )}
    </SidePanel>
  );
}

/**
 * Pre-configured panel for Contacts
 */
export function ContactsPanel({
  entityType,
  recordId,
  defaultCollapsed,
}: {
  entityType: string;
  recordId: string;
  defaultCollapsed?: boolean;
}): React.ReactElement {
  return (
    <RelatedPanel
      entityType={entityType}
      recordId={recordId}
      relatedEntityType="Contact"
      linkName="contacts"
      title="Contacts"
      subtitleField="title"
      defaultCollapsed={defaultCollapsed}
    />
  );
}

/**
 * Pre-configured panel for Opportunities
 */
export function OpportunitiesPanel({
  entityType,
  recordId,
  defaultCollapsed,
}: {
  entityType: string;
  recordId: string;
  defaultCollapsed?: boolean;
}): React.ReactElement {
  return (
    <RelatedPanel
      entityType={entityType}
      recordId={recordId}
      relatedEntityType="Opportunity"
      linkName="opportunities"
      title="Opportunities"
      subtitleField="stage"
      defaultCollapsed={defaultCollapsed}
    />
  );
}

/**
 * Pre-configured panel for Documents
 */
export function DocumentsPanel({
  entityType,
  recordId,
  defaultCollapsed,
}: {
  entityType: string;
  recordId: string;
  defaultCollapsed?: boolean;
}): React.ReactElement {
  return (
    <RelatedPanel
      entityType={entityType}
      recordId={recordId}
      relatedEntityType="Document"
      linkName="documents"
      title="Documents"
      defaultCollapsed={defaultCollapsed}
    />
  );
}
