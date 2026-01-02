import React, { useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Trash2,
  Square,
  CheckSquare,
  MinusSquare,
} from 'lucide-react';
import { get } from '@/api/client';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useListLayout, getDefaultListLayout } from '@/lib/layout';
import { FieldRenderer, initializeFieldTypes } from '@/fields';
import { useAcl } from '@/lib/acl';
import { useMassActions } from '@/hooks/useMassActions';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MassActionsBar } from '@/components/common/MassActionsBar';
import { AdvancedSearch, filtersToWhereClause, type SearchFilter } from '@/components/search/AdvancedSearch';
import { cn } from '@/lib/utils/cn';
import type { ListColumn } from '@/lib/layout/types';
import type { FieldDef } from '@/fields/types';

// Initialize field types
initializeFieldTypes();

interface RecordListProps {
  entityType: string;
  className?: string;
}

interface ListResponse {
  total: number;
  list: Record<string, unknown>[];
}

const PAGE_SIZE = 20;

export function RecordList({ entityType, className }: RecordListProps): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { metadata } = useMetadata();
  const { checkScope } = useAcl();
  const { layout: listLayout, isLoading: layoutLoading } = useListLayout(entityType);

  // Advanced search filters state
  const [filters, setFilters] = useState<SearchFilter[]>([]);

  // Mass actions
  const {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount,
    massDelete,
    isProcessing,
    processingAction,
  } = useMassActions({ entityType });

  // Get query params
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const orderBy = searchParams.get('orderBy') ?? 'createdAt';
  const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc';
  const searchQuery = searchParams.get('q') ?? '';

  // Get field definitions from metadata
  const fieldDefs = useMemo(() => {
    return metadata?.entityDefs?.[entityType]?.fields ?? {};
  }, [metadata, entityType]);

  // Get columns from layout or generate defaults
  const columns = useMemo<ListColumn[]>(() => {
    if (listLayout) {
      return listLayout;
    }
    return getDefaultListLayout(fieldDefs);
  }, [listLayout, fieldDefs]);

  // Fetch records
  const { data, isLoading, error } = useQuery<ListResponse, Error>({
    queryKey: ['entityList', entityType, page, orderBy, order, searchQuery, filters],
    queryFn: async () => {
      const offset = (page - 1) * PAGE_SIZE;
      const params = new URLSearchParams({
        maxSize: String(PAGE_SIZE),
        offset: String(offset),
        orderBy,
        order,
      });

      if (searchQuery) {
        params.append('textFilter', searchQuery);
      }

      // Add advanced filters as where clause
      if (filters.length > 0) {
        const whereClause = filtersToWhereClause(filters);
        params.append('where', JSON.stringify(whereClause));
      }

      const response = await get<ListResponse>(`/${entityType}?${params.toString()}`);
      return response;
    },
    enabled: !!entityType,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  // Handlers
  const handleSort = (column: string): void => {
    const newOrder = orderBy === column && order === 'asc' ? 'desc' : 'asc';
    setSearchParams((prev) => {
      prev.set('orderBy', column);
      prev.set('order', newOrder);
      prev.set('page', '1');
      return prev;
    });
  };

  const handlePageChange = (newPage: number): void => {
    setSearchParams((prev) => {
      prev.set('page', String(newPage));
      return prev;
    });
  };

  const handleSearch = (query: string): void => {
    setSearchParams((prev) => {
      if (query) {
        prev.set('q', query);
      } else {
        prev.delete('q');
      }
      prev.set('page', '1');
      return prev;
    });
  };

  // Check permissions
  const canEdit = checkScope(entityType, 'edit');
  const canDelete = checkScope(entityType, 'delete');

  // Get all current page record IDs for select all
  const currentPageIds = useMemo(
    () => data?.list.map((r) => r.id as string) ?? [],
    [data?.list]
  );

  // Handle select all toggle
  const handleSelectAll = useCallback(() => {
    selectAll(currentPageIds);
  }, [selectAll, currentPageIds]);

  // Determine select all state
  const selectAllState = useMemo(() => {
    if (currentPageIds.length === 0) return 'none';
    const selectedOnPage = currentPageIds.filter((id) => selectedIds.has(id)).length;
    if (selectedOnPage === 0) return 'none';
    if (selectedOnPage === currentPageIds.length) return 'all';
    return 'some';
  }, [currentPageIds, selectedIds]);

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
        Error loading records: {error.message}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Advanced Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <AdvancedSearch
            entityType={entityType}
            filters={filters}
            onFiltersChange={setFilters}
            textFilter={searchQuery}
            onTextFilterChange={handleSearch}
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {data?.total ?? 0} records
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {/* Selection checkbox column */}
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center text-muted-foreground hover:text-foreground"
                    title={selectAllState === 'all' ? 'Deselect all' : 'Select all'}
                  >
                    {selectAllState === 'all' ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : selectAllState === 'some' ? (
                      <MinusSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                {columns.map((column) => {
                  if (column.hidden) return null;
                  const isSorted = orderBy === column.name;
                  const isSortable = !column.notSortable;

                  return (
                    <th
                      key={column.name}
                      className={cn(
                        'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                        isSortable && 'cursor-pointer hover:bg-muted'
                      )}
                      style={{ width: column.width ? `${column.width}%` : undefined }}
                      onClick={() => isSortable && handleSort(column.name)}
                    >
                      <div className="flex items-center gap-1">
                        {formatColumnLabel(column.name)}
                        {isSortable && (
                          <span className="ml-1">
                            {isSorted ? (
                              order === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.list.map((record) => {
                const recordId = record.id as string;
                const recordSelected = isSelected(recordId);

                return (
                  <tr
                    key={recordId}
                    className={cn(
                      'hover:bg-muted/30',
                      recordSelected && 'bg-primary/5'
                    )}
                  >
                    {/* Selection checkbox */}
                    <td className="px-4 py-3 w-10">
                      <button
                        onClick={() => toggleSelection(recordId)}
                        className="flex items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        {recordSelected ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    {columns.map((column) => {
                      if (column.hidden) return null;
                      const fieldDef = fieldDefs[column.name] as FieldDef | undefined;
                      const value = record[column.name];

                      return (
                        <td
                          key={column.name}
                          className={cn(
                            'px-4 py-3 text-sm',
                            column.align === 'right' && 'text-right',
                            column.align === 'center' && 'text-center'
                          )}
                        >
                          {column.link ? (
                            <Link
                              to={`/${entityType}/view/${recordId}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {fieldDef ? (
                                <FieldRenderer
                                  name={column.name}
                                  value={value}
                                  fieldDef={fieldDef}
                                  mode="list"
                                  entityType={entityType}
                                  record={record}
                                />
                              ) : (
                                String(value ?? '')
                              )}
                            </Link>
                          ) : fieldDef ? (
                            <FieldRenderer
                              name={column.name}
                              value={value}
                              fieldDef={fieldDef}
                              mode="list"
                              entityType={entityType}
                              record={record}
                            />
                          ) : (
                            String(value ?? '—')
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/${entityType}/view/${recordId}`}>
                          <Button variant="ghost" size="sm" title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {canEdit && (
                          <Link to={`/${entityType}/edit/${recordId}`}>
                            <Button variant="ghost" size="sm" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data?.list.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.filter((c) => !c.hidden).length + 2}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mass Actions Bar */}
      <MassActionsBar
        selectedCount={selectedCount}
        onMassDelete={massDelete}
        onClearSelection={clearSelection}
        isProcessing={isProcessing}
        processingAction={processingAction}
        canDelete={canDelete}
        canEdit={canEdit}
      />
    </div>
  );
}

function formatColumnLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export default RecordList;
