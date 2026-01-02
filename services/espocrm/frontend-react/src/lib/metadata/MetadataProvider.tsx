import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { useAuthStore } from '@/features/auth/store';
import {
  type Metadata,
  type MetadataContextType,
  type EntityDef,
  type FieldDef,
  type LinkDef,
  type ScopeDef,
  MetadataSchema,
} from './types';
import { MetadataContext } from './MetadataContext';

interface MetadataProviderProps {
  children: ReactNode;
}

export function MetadataProvider({
  children,
}: MetadataProviderProps): React.ReactElement {
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['metadata'],
    queryFn: async (): Promise<Metadata> => {
      const response: unknown = await get(API_ENDPOINTS.METADATA);
      return MetadataSchema.parse(response);
    },
    staleTime: Infinity, // Metadata rarely changes
    gcTime: Infinity,
    retry: 3,
    enabled: isAuthenticated, // Only fetch when user is authenticated
  });

  const contextValue = useMemo<MetadataContextType>(
    () => ({
      metadata: data ?? null,
      isLoading,
      error: error instanceof Error ? error : null,

      getEntityDef: (entityType: string): EntityDef | undefined => {
        return data?.entityDefs?.[entityType];
      },

      getFieldDef: (entityType: string, field: string): FieldDef | undefined => {
        const entityDef = data?.entityDefs?.[entityType];
        return entityDef?.fields?.[field];
      },

      getLinkDef: (entityType: string, link: string): LinkDef | undefined => {
        const entityDef = data?.entityDefs?.[entityType];
        return entityDef?.links?.[link];
      },

      getScopeDef: (scope: string): ScopeDef | undefined => {
        return data?.scopes?.[scope];
      },

      isEntityEnabled: (entityType: string): boolean => {
        const scopeDef = data?.scopes?.[entityType];
        // Match Backbone: scope must exist and not be disabled
        return scopeDef !== undefined && scopeDef.disabled !== true;
      },

      getEntityList: (): string[] => {
        if (!data?.scopes) return [];
        // Match Backbone: return all scopes that exist and are not disabled
        return Object.entries(data.scopes)
          .filter(([, scope]) => scope.disabled !== true)
          .map(([name]) => name)
          .sort();
      },
    }),
    [data, isLoading, error]
  );

  return (
    <MetadataContext.Provider value={contextValue}>
      {children}
    </MetadataContext.Provider>
  );
}
