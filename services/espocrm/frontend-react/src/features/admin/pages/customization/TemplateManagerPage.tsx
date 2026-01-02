/**
 * TemplateManagerPage - Manage system templates (notification, PDF, etc.)
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, ChevronRight } from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useTranslation } from '@/hooks/useTranslation';

interface TemplateItem {
  name: string;
  label: string;
  scope?: string;
}

export function TemplateManagerPage(): React.ReactElement {
  const navigate = useNavigate();
  const { metadata, isLoading } = useMetadata();
  const { t, translateEntity } = useTranslation();

  // Get template list from metadata
  const templates = useMemo(() => {
    const appTemplates = (metadata?.app as Record<string, unknown>)?.templates as Record<string, Record<string, unknown>> | undefined;
    if (!appTemplates) return [];

    const result: TemplateItem[] = [];

    for (const [templateName, defs] of Object.entries(appTemplates)) {
      const scopeList = defs.scopeList as string[] | undefined;

      if (scopeList && scopeList.length > 0) {
        // Template with scopes
        for (const scope of scopeList) {
          result.push({
            name: `${templateName}_${scope}`,
            label: `${t(`Admin.templates.${templateName}`)} - ${translateEntity(scope)}`,
            scope,
          });
        }
      } else {
        // Global template
        result.push({
          name: templateName,
          label: t(`Admin.templates.${templateName}`),
        });
      }
    }

    return result.sort((a, b) => a.label.localeCompare(b.label));
  }, [metadata, t, translateEntity]);

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
            <FileText className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              Template Manager
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage system templates for notifications, PDFs, and more
          </p>
        </div>
      </div>

      {/* Template list */}
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No templates available.
          </div>
        ) : (
          templates.map(template => (
            <button
              key={template.name}
              onClick={() => navigate(`/Admin/templateManager/${template.name}`)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div>
                <span className="font-medium text-gray-900">{template.label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))
        )}
      </div>

      {/* PDF Templates link */}
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-3">PDF Templates</h2>
        <button
          onClick={() => navigate('/Template')}
          className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="text-gray-900">Manage PDF Templates</span>
          <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
        </button>
      </div>
    </div>
  );
}

export default TemplateManagerPage;
