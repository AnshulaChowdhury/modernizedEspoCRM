/**
 * LayoutManagerPage - Shows available layout types for an entity
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layout, Loader2, AlertCircle } from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useTranslation } from '@/hooks/useTranslation';
import { LayoutTypeList } from '../../modules/layout-manager/components/LayoutTypeList';

export function LayoutManagerPage(): React.ReactElement {
  const { scope } = useParams<{ scope: string }>();
  const navigate = useNavigate();
  const { metadata, isLoading } = useMetadata();
  const { translateEntity } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!scope) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">No entity specified</p>
        </div>
      </div>
    );
  }

  // Cast to access all properties since metadata uses passthrough()
  const scopeData = metadata?.scopes?.[scope] as Record<string, unknown> | undefined;
  // Backbone checks both .entity AND .layouts
  if (!scopeData?.entity || !scopeData?.layouts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">
            Layouts are not available for this entity: {scope}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/Admin/entityManager/scope/${scope}`)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Layout className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              Layout Manager
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Configure layouts for {translateEntity(scope)}
          </p>
        </div>
      </div>

      {/* Layout type list */}
      <LayoutTypeList
        scope={scope}
        baseUrl={`/Admin/layouts/scope/${scope}`}
      />
    </div>
  );
}

export default LayoutManagerPage;
