/**
 * LabelManagerPage - Manage labels for entities
 */
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tag, Loader2, AlertCircle } from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useTranslation } from '@/hooks/useTranslation';
import { labelManagerApi } from '../../modules/label-manager/api';
import { LabelEditor } from '../../modules/label-manager/components/LabelEditor';

export function LabelManagerPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { metadata } = useMetadata();
  const { translateEntity, translateOption } = useTranslation();

  // Cast metadata.app to access language settings (uses passthrough)
  const appConfig = metadata?.app as Record<string, unknown> | undefined;
  const languageConfig = appConfig?.language as Record<string, unknown> | undefined;

  // Get scope and language from URL params
  const selectedScope = searchParams.get('scope') || 'Global';
  const selectedLanguage = searchParams.get('language') ||
    (languageConfig?.default as string) || 'en_US';

  // Fetch scope list
  const { data: scopeList, isLoading: scopeListLoading, error: scopeListError } = useQuery({
    queryKey: ['labelManager', 'scopeList'],
    queryFn: () => labelManagerApi.getScopeList(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get language list from metadata
  const languageList = useMemo(() => {
    const languages = (languageConfig?.list as string[]) || ['en_US'];
    return languages.sort((a, b) =>
      translateOption('Global', 'language', a).localeCompare(
        translateOption('Global', 'language', b)
      )
    );
  }, [languageConfig, translateOption]);

  // Filter and sort scope list
  const filteredScopeList = useMemo(() => {
    if (!scopeList) return [];

    const scopes = metadata?.scopes as Record<string, Record<string, unknown>> | undefined;

    return scopeList
      .filter(scope => {
        // Keep Global
        if (scope === 'Global') return true;
        // Filter out disabled scopes
        const scopeData = scopes?.[scope];
        return !scopeData?.disabled;
      })
      .sort((a, b) => {
        // Global always first
        if (a === 'Global') return -1;
        if (b === 'Global') return 1;
        return translateEntity(a).localeCompare(translateEntity(b));
      });
  }, [scopeList, metadata, translateEntity]);

  const handleScopeSelect = (scope: string) => {
    setSearchParams({ scope, language: selectedLanguage });
  };

  const handleLanguageChange = (language: string) => {
    setSearchParams({ scope: selectedScope, language });
  };

  if (scopeListLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (scopeListError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Failed to load scope list</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Tag className="h-6 w-6 text-gray-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Label Manager</h1>
            <p className="text-sm text-gray-500">
              Customize labels and translations
            </p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Language:</label>
          <select
            value={selectedLanguage}
            onChange={e => handleLanguageChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languageList.map(lang => (
              <option key={lang} value={lang}>
                {translateOption('Global', 'language', lang)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Scope sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Scopes</h3>
            </div>
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {filteredScopeList.map(scope => (
                <button
                  key={scope}
                  onClick={() => handleScopeSelect(scope)}
                  disabled={scope === selectedScope}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                    scope === selectedScope
                      ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                      : 'text-gray-700'
                  } disabled:cursor-default`}
                >
                  {scope === 'Global' ? 'Global' : translateEntity(scope)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <LabelEditor scope={selectedScope} language={selectedLanguage} />
        </div>
      </div>
    </div>
  );
}

export default LabelManagerPage;
