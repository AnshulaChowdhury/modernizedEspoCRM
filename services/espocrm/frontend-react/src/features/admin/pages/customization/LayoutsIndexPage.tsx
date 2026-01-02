/**
 * LayoutsIndexPage - Shows all entities with available layouts
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Loader2, ChevronRight } from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useTranslation } from '@/hooks/useTranslation';

export function LayoutsIndexPage(): React.ReactElement {
  const navigate = useNavigate();
  const { metadata, isLoading } = useMetadata();
  const { translateEntity } = useTranslation();

  // Get all entities that have layouts enabled
  const scopeList = useMemo(() => {
    if (!metadata?.scopes) return [];

    const scopes: string[] = [];
    const scopesData = metadata.scopes as Record<string, Record<string, unknown>>;

    for (const [scope, data] of Object.entries(scopesData)) {
      // Backbone checks both .entity AND .layouts
      if (data.entity && data.layouts) {
        scopes.push(scope);
      }
    }

    // Sort by translated name
    return scopes.sort((a, b) =>
      translateEntity(a).localeCompare(translateEntity(b))
    );
  }, [metadata, translateEntity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Layout className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              Layout Manager
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Configure layouts for entities
          </p>
        </div>
      </div>

      {/* Entity list */}
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {scopeList.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No entities with layouts available.
          </div>
        ) : (
          scopeList.map(scope => (
            <button
              key={scope}
              onClick={() => navigate(`/Admin/layouts/scope/${scope}`)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="font-medium text-gray-900">
                {translateEntity(scope)}
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default LayoutsIndexPage;
