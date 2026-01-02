/**
 * LayoutEditorPage - Renders the appropriate layout editor based on type
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layout, Loader2, AlertCircle } from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ListLayoutEditor,
  DetailLayoutEditor,
  RowsLayoutEditor,
} from '../../modules/layout-manager/editors';

export function LayoutEditorPage(): React.ReactElement {
  const { scope, type } = useParams<{ scope: string; type: string }>();
  const navigate = useNavigate();
  const { metadata, isLoading } = useMetadata();
  const { translateEntity, translateLayoutName } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!scope || !type) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Missing scope or layout type</p>
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

  const handleCancel = () => {
    navigate(`/Admin/layouts/scope/${scope}`);
  };

  const handleSave = () => {
    // Stay on page after save - user can navigate away manually
  };

  // Render appropriate editor based on type
  const renderEditor = () => {
    switch (type) {
      case 'list':
      case 'listSmall':
        return (
          <ListLayoutEditor
            scope={scope}
            type={type as 'list' | 'listSmall'}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        );

      case 'detail':
      case 'detailSmall':
        return (
          <DetailLayoutEditor
            scope={scope}
            type={type as 'detail' | 'detailSmall'}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        );

      case 'filters':
      case 'massUpdate':
        return (
          <RowsLayoutEditor
            scope={scope}
            type={type as 'filters' | 'massUpdate'}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        );

      // For other layout types, show a placeholder
      default:
        return (
          <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
            <Layout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Editor for "{translateLayoutName(type, scope)}" is not yet implemented.
            </p>
            <p className="text-sm text-gray-500">
              This layout type will be available in a future update.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/Admin/layouts/scope/${scope}`)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Layout className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              {translateLayoutName(type, scope)}
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {translateEntity(scope)} • Layout Editor
          </p>
        </div>
      </div>

      {/* Editor */}
      {renderEditor()}
    </div>
  );
}

export default LayoutEditorPage;
