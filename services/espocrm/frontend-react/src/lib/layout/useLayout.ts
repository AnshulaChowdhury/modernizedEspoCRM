import { useQuery } from '@tanstack/react-query';
import { get } from '@/api/client';
import type { DetailLayout, ListLayout } from './types';

type LayoutType = 'detail' | 'detailSmall' | 'list' | 'listSmall' | 'edit' | 'filters' | 'relationships' | 'sidePanelsDetail' | 'bottomPanelsDetail';

interface UseLayoutOptions {
  /** Whether to enable the query */
  enabled?: boolean;
}

/**
 * Hook to fetch a layout for an entity type
 */
export function useLayout<T extends DetailLayout | ListLayout = DetailLayout>(
  entityType: string,
  layoutType: LayoutType,
  options: UseLayoutOptions = {}
): {
  layout: T | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { enabled = true } = options;

  const { data, isLoading, error } = useQuery<T, Error>({
    queryKey: ['layout', entityType, layoutType],
    queryFn: async () => {
      const response = await get<T>(`/${entityType}/layout/${layoutType}`);
      return response;
    },
    enabled: enabled && !!entityType,
    staleTime: Infinity, // Layouts rarely change
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  return {
    layout: data,
    isLoading,
    error: error,
  };
}

/**
 * Hook to fetch detail layout
 */
export function useDetailLayout(
  entityType: string,
  options: UseLayoutOptions = {}
): {
  layout: DetailLayout | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  return useLayout<DetailLayout>(entityType, 'detail', options);
}

/**
 * Hook to fetch list layout
 */
export function useListLayout(
  entityType: string,
  options: UseLayoutOptions = {}
): {
  layout: ListLayout | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  return useLayout<ListLayout>(entityType, 'list', options);
}

/**
 * Default detail layout when none is available
 */
export function getDefaultDetailLayout(
  fieldDefs: Record<string, { type: string }>
): DetailLayout {
  // Build a simple layout from field defs
  const fieldNames = Object.keys(fieldDefs).filter(
    (name) => !['id', 'deleted', 'createdAt', 'modifiedAt', 'createdById', 'modifiedById'].includes(name)
  );

  // Put name first if it exists
  const nameIndex = fieldNames.indexOf('name');
  if (nameIndex > 0) {
    fieldNames.splice(nameIndex, 1);
    fieldNames.unshift('name');
  }

  // Create rows with 2 columns
  const rows: Array<Array<{ name: string } | false>> = [];
  for (let i = 0; i < fieldNames.length; i += 2) {
    const name1 = fieldNames[i];
    const name2 = fieldNames[i + 1];
    if (!name1) continue;
    const cell1 = { name: name1 };
    const cell2 = name2 ? { name: name2 } : false;
    rows.push([cell1, cell2]);
  }

  return [
    {
      label: '',
      rows,
    },
  ];
}

/**
 * Default list layout when none is available
 */
export function getDefaultListLayout(
  fieldDefs: Record<string, { type: string }>
): ListLayout {
  const defaultColumns = ['name', 'status', 'createdAt', 'modifiedAt'];
  const columns: ListLayout = [];

  // Add name column first if it exists
  if (fieldDefs.name) {
    columns.push({ name: 'name', link: true });
  }

  // Add other common columns
  for (const col of defaultColumns) {
    if (col !== 'name' && fieldDefs[col]) {
      columns.push({ name: col });
    }
  }

  // If we have very few columns, add more fields
  if (columns.length < 4) {
    const additionalFields = Object.keys(fieldDefs)
      .filter((name) =>
        !defaultColumns.includes(name) &&
        !['id', 'deleted', 'description'].includes(name)
      )
      .slice(0, 4 - columns.length);

    for (const name of additionalFields) {
      columns.push({ name });
    }
  }

  return columns;
}
