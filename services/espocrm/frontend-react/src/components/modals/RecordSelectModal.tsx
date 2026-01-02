import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { get } from '@/api/client';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { BaseModal } from './BaseModal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils/cn';
import type { RecordSelectModalConfig, SelectedRecord } from './types';

interface RecordSelectModalProps {
  config: RecordSelectModalConfig;
  onSelect: (record: SelectedRecord | SelectedRecord[] | null) => void;
  onCancel: () => void;
}

interface ListResponse {
  total: number;
  list: Array<{ id: string; name: string; [key: string]: unknown }>;
}

const PAGE_SIZE = 10;

export function RecordSelectModal({ config, onSelect, onCancel }: RecordSelectModalProps) {
  const { entityType, title, multiple = false, filters, excludeIds = [] } = config;
  const { metadata } = useMetadata();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRecords, setSelectedRecords] = useState<SelectedRecord[]>([]);

  // Get entity label from metadata
  const entityLabel = String(metadata?.entityDefs?.[entityType]?.label ?? entityType);

  // Fetch records
  const { data, isLoading, error } = useQuery<ListResponse, Error>({
    queryKey: ['recordSelect', entityType, page, searchQuery, filters],
    queryFn: async () => {
      const offset = (page - 1) * PAGE_SIZE;
      const params = new URLSearchParams({
        maxSize: String(PAGE_SIZE),
        offset: String(offset),
        orderBy: 'name',
        order: 'asc',
      });

      if (searchQuery) {
        params.append('textFilter', searchQuery);
      }

      if (filters) {
        params.append('where', JSON.stringify(filters));
      }

      const response = await get<ListResponse>(`/${entityType}?${params.toString()}`);
      return response;
    },
    enabled: !!entityType,
  });

  // Filter out excluded IDs
  const filteredList = useMemo(() => {
    if (!data?.list) return [];
    return data.list.filter((record) => !excludeIds.includes(record.id));
  }, [data?.list, excludeIds]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  }, []);

  const handleRecordClick = useCallback(
    (record: SelectedRecord) => {
      if (multiple) {
        setSelectedRecords((prev) => {
          const exists = prev.find((r) => r.id === record.id);
          if (exists) {
            return prev.filter((r) => r.id !== record.id);
          }
          return [...prev, record];
        });
      } else {
        onSelect(record);
      }
    },
    [multiple, onSelect]
  );

  const handleConfirmSelection = useCallback(() => {
    if (multiple) {
      onSelect(selectedRecords.length > 0 ? selectedRecords : null);
    }
  }, [multiple, selectedRecords, onSelect]);

  const isRecordSelected = useCallback(
    (id: string) => selectedRecords.some((r) => r.id === id),
    [selectedRecords]
  );

  return (
    <BaseModal
      open={true}
      onOpenChange={(open) => !open && onCancel()}
      title={title ?? `Select ${entityLabel}`}
      size="lg"
      footer={
        multiple ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSelection} disabled={selectedRecords.length === 0}>
              Select ({selectedRecords.length})
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${entityLabel.toLowerCase()}...`}
            value={searchQuery}
            onChange={handleSearch}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Record list */}
        <div className="min-h-[300px] max-h-[400px] overflow-y-auto rounded-md border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">{error.message}</div>
          ) : filteredList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No records found</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredList.map((record) => {
                const selected = isRecordSelected(record.id);
                return (
                  <li key={record.id}>
                    <button
                      type="button"
                      onClick={() =>
                        handleRecordClick({
                          id: record.id,
                          name: record.name,
                        })
                      }
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors',
                        selected && 'bg-blue-50 hover:bg-blue-100'
                      )}
                    >
                      <span className="font-medium text-gray-900">{record.name}</span>
                      {selected && <Check className="h-4 w-4 text-blue-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
