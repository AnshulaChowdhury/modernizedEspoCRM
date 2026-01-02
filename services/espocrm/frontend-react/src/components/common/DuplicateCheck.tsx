import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ExternalLink, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { get } from '@/api/client';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { FieldRenderer, initializeFieldTypes } from '@/fields';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils/cn';
import type { FieldDef } from '@/fields/types';

initializeFieldTypes();

interface DuplicateCheckProps {
  entityType: string;
  /** Current form data to check for duplicates */
  formData: Record<string, unknown>;
  /** Record ID to exclude from results (when editing) */
  excludeId?: string;
  /** Callback when user selects a duplicate to merge with */
  onSelectDuplicate?: (record: Record<string, unknown>) => void;
  /** Callback to ignore duplicates and proceed */
  onIgnoreDuplicates?: () => void;
  /** Fields to use for duplicate checking */
  checkFields?: string[];
  className?: string;
}

interface DuplicateRecord {
  id: string;
  name?: string;
  [key: string]: unknown;
}

interface DuplicateResponse {
  total: number;
  list: DuplicateRecord[];
}

export function DuplicateCheck({
  entityType,
  formData,
  excludeId,
  onSelectDuplicate,
  onIgnoreDuplicates,
  checkFields,
  className,
}: DuplicateCheckProps): React.ReactElement | null {
  const { metadata } = useMetadata();
  const [dismissed, setDismissed] = useState(false);

  // Get duplicate check fields from metadata or props
  const duplicateFields = useMemo(() => {
    if (checkFields && checkFields.length > 0) {
      return checkFields;
    }

    // Get from entity definition
    const clientDefs = metadata?.clientDefs?.[entityType] as
      | { duplicateCheck?: { fields?: string[] } }
      | undefined;

    return clientDefs?.duplicateCheck?.fields ?? ['name', 'emailAddress'];
  }, [metadata, entityType, checkFields]);

  // Get field definitions
  const fieldDefs = useMemo(() => {
    return (metadata?.entityDefs?.[entityType]?.fields ?? {}) as Record<string, FieldDef>;
  }, [metadata, entityType]);

  // Build where clause for duplicate check
  const whereClause = useMemo(() => {
    const conditions: unknown[] = [];

    for (const field of duplicateFields) {
      const value = formData[field];
      if (value && value !== '') {
        conditions.push({
          type: 'equals',
          attribute: field,
          value,
        });
      }
    }

    // Exclude current record if editing
    if (excludeId) {
      conditions.push({
        type: 'notEquals',
        attribute: 'id',
        value: excludeId,
      });
    }

    return conditions;
  }, [duplicateFields, formData, excludeId]);

  // Check if we have enough data to search
  const hasSearchData = whereClause.length > (excludeId ? 1 : 0);

  // Query for duplicates
  const { data, isLoading, error } = useQuery<DuplicateResponse, Error>({
    queryKey: ['duplicateCheck', entityType, JSON.stringify(whereClause)],
    queryFn: async () => {
      const params = new URLSearchParams({
        where: JSON.stringify([{ type: 'or', value: whereClause }]),
        maxSize: '5',
      });

      const response = await get<DuplicateResponse>(`/${entityType}?${params.toString()}`);
      return response;
    },
    enabled: hasSearchData && !dismissed,
    staleTime: 10000, // 10 seconds
  });

  // Reset dismissed state when form data changes significantly
  useEffect(() => {
    setDismissed(false);
  }, [JSON.stringify(duplicateFields.map((f) => formData[f]))]);

  const duplicates = data?.list ?? [];

  // Don't show anything if no duplicates or dismissed
  if (dismissed || !hasSearchData || duplicates.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <LoadingSpinner size="sm" />
        Checking for duplicates...
      </div>
    );
  }

  if (error) {
    return null; // Silently fail
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-yellow-300 bg-yellow-50 p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800">
            Possible duplicates found
          </h4>
          <p className="text-sm text-yellow-700 mt-1">
            We found {duplicates.length} record{duplicates.length !== 1 ? 's' : ''} that
            may be duplicates. Please review before saving.
          </p>

          {/* Duplicate list */}
          <div className="mt-3 space-y-2">
            {duplicates.map((record) => (
              <DuplicateRecordRow
                key={record.id}
                record={record}
                entityType={entityType}
                fieldDefs={fieldDefs}
                duplicateFields={duplicateFields}
                onSelect={onSelectDuplicate ? () => onSelectDuplicate(record) : undefined}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3">
            {onIgnoreDuplicates && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDismissed(true);
                  onIgnoreDuplicates();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Ignore & Continue
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DuplicateRecordRowProps {
  record: DuplicateRecord;
  entityType: string;
  fieldDefs: Record<string, FieldDef>;
  duplicateFields: string[];
  onSelect?: () => void;
}

function DuplicateRecordRow({
  record,
  entityType,
  fieldDefs,
  duplicateFields,
  onSelect,
}: DuplicateRecordRowProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3 p-2 rounded bg-white border border-yellow-200">
      <div className="flex-1 min-w-0">
        <Link
          to={`/${entityType}/view/${record.id}`}
          className="font-medium text-primary hover:underline flex items-center gap-1"
          target="_blank"
          rel="noopener noreferrer"
        >
          {record.name ?? record.id}
          <ExternalLink className="h-3 w-3" />
        </Link>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          {duplicateFields.map((field) => {
            const value = record[field];
            if (value === null || value === undefined) return null;

            const fieldDef = fieldDefs[field];

            return (
              <div key={field} className="text-xs text-muted-foreground">
                <span className="font-medium">{formatFieldName(field)}:</span>{' '}
                {fieldDef ? (
                  <FieldRenderer
                    name={field}
                    value={value}
                    fieldDef={fieldDef}
                    mode="list"
                    entityType={entityType}
                    record={record}
                  />
                ) : (
                  String(value)
                )}
              </div>
            );
          })}
        </div>
      </div>

      {onSelect && (
        <Button variant="outline" size="sm" onClick={onSelect}>
          <Check className="h-4 w-4 mr-2" />
          Use This
        </Button>
      )}
    </div>
  );
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Hook for duplicate checking
 */
interface UseDuplicateCheckOptions {
  entityType: string;
  formData: Record<string, unknown>;
  excludeId?: string;
  checkFields?: string[];
  enabled?: boolean;
}

interface UseDuplicateCheckResult {
  duplicates: DuplicateRecord[];
  isLoading: boolean;
  hasDuplicates: boolean;
}

export function useDuplicateCheck({
  entityType,
  formData,
  excludeId,
  checkFields,
  enabled = true,
}: UseDuplicateCheckOptions): UseDuplicateCheckResult {
  const { metadata } = useMetadata();

  // Get duplicate check fields
  const duplicateFields = useMemo(() => {
    if (checkFields && checkFields.length > 0) {
      return checkFields;
    }

    const clientDefs = metadata?.clientDefs?.[entityType] as
      | { duplicateCheck?: { fields?: string[] } }
      | undefined;

    return clientDefs?.duplicateCheck?.fields ?? ['name', 'emailAddress'];
  }, [metadata, entityType, checkFields]);

  // Build where clause
  const whereClause = useMemo(() => {
    const conditions: unknown[] = [];

    for (const field of duplicateFields) {
      const value = formData[field];
      if (value && value !== '') {
        conditions.push({
          type: 'equals',
          attribute: field,
          value,
        });
      }
    }

    if (excludeId) {
      conditions.push({
        type: 'notEquals',
        attribute: 'id',
        value: excludeId,
      });
    }

    return conditions;
  }, [duplicateFields, formData, excludeId]);

  const hasSearchData = whereClause.length > (excludeId ? 1 : 0);

  const { data, isLoading } = useQuery<DuplicateResponse, Error>({
    queryKey: ['duplicateCheck', entityType, JSON.stringify(whereClause)],
    queryFn: async () => {
      const params = new URLSearchParams({
        where: JSON.stringify([{ type: 'or', value: whereClause }]),
        maxSize: '5',
      });

      const response = await get<DuplicateResponse>(`/${entityType}?${params.toString()}`);
      return response;
    },
    enabled: enabled && hasSearchData,
    staleTime: 10000,
  });

  return {
    duplicates: data?.list ?? [],
    isLoading,
    hasDuplicates: (data?.list?.length ?? 0) > 0,
  };
}

export default DuplicateCheck;
