/**
 * LabelEditor - Edit labels for a specific scope
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';
import { labelManagerApi } from '../api';
import type { ScopeData, CategoryGroup, LabelItem } from '../types';

interface LabelEditorProps {
  scope: string;
  language: string;
}

export function LabelEditor({ scope, language }: LabelEditorProps): React.ReactElement {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [dirtyLabels, setDirtyLabels] = useState<Record<string, string>>({});
  const [localData, setLocalData] = useState<ScopeData | null>(null);

  // Fetch scope data
  const { data: scopeData, isLoading, error } = useQuery({
    queryKey: ['labelManager', 'scopeData', scope, language],
    queryFn: () => labelManagerApi.getScopeData(scope, language),
    staleTime: 0,
  });

  // Initialize local data when scope data loads
  useEffect(() => {
    if (scopeData) {
      setLocalData(scopeData);
      setDirtyLabels({});
    }
  }, [scopeData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => labelManagerApi.saveLabels(scope, language, dirtyLabels),
    onSuccess: (newData) => {
      setLocalData(newData);
      setDirtyLabels({});
      queryClient.invalidateQueries({ queryKey: ['labelManager', 'scopeData', scope, language] });
    },
  });

  // Parse categories from scope data
  const categories: CategoryGroup[] = useMemo(() => {
    if (!localData) return [];

    return Object.keys(localData)
      .sort((a, b) => a.localeCompare(b))
      .map(categoryName => {
        const categoryData = localData[categoryName] || {};
        const labels: LabelItem[] = Object.entries(categoryData).map(([path, value]) => {
          const key = path.replace(`${categoryName}[.]`, '');
          return {
            path,
            category: categoryName,
            key,
            value: dirtyLabels[path] !== undefined ? dirtyLabels[path] : value,
            isDirty: dirtyLabels[path] !== undefined,
          };
        });

        return {
          name: categoryName,
          labels: labels.sort((a, b) => a.key.localeCompare(b.key)),
          isExpanded: expandedCategories.has(categoryName),
        };
      });
  }, [localData, expandedCategories, dirtyLabels]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchText.trim()) return categories;

    const lowerSearch = searchText.toLowerCase();

    return categories
      .map(category => ({
        ...category,
        labels: category.labels.filter(
          label =>
            label.key.toLowerCase().includes(lowerSearch) ||
            label.value.toLowerCase().includes(lowerSearch)
        ),
      }))
      .filter(category => category.labels.length > 0);
  }, [categories, searchText]);

  const toggleCategory = useCallback((name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const handleLabelChange = useCallback((path: string, value: string) => {
    // Convert escaped newlines
    const processedValue = value.replace(/\\n/g, '\n').trim();
    setDirtyLabels(prev => ({
      ...prev,
      [path]: processedValue,
    }));
  }, []);

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleCancel = () => {
    setDirtyLabels({});
    if (scopeData) {
      setLocalData(scopeData);
    }
  };

  const hasDirtyLabels = Object.keys(dirtyLabels).length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Failed to load labels</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!hasDirtyLabels || saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
          <button
            onClick={handleCancel}
            disabled={!hasDirtyLabels}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-4 w-4" />
            Cancel
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search labels..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            {searchText ? 'No labels match your search' : 'No labels available'}
          </div>
        ) : (
          filteredCategories.map(category => (
            <div
              key={category.name}
              className="border border-gray-200 rounded-lg bg-white overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left font-medium"
              >
                {category.isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <span>{category.name}</span>
                <span className="text-sm text-gray-500 font-normal">
                  ({category.labels.length} labels)
                </span>
              </button>

              {/* Labels */}
              {category.isExpanded && (
                <div className="divide-y divide-gray-100">
                  {category.labels.map(label => (
                    <div
                      key={label.path}
                      className={`flex items-center gap-4 px-4 py-2 ${
                        label.isDirty ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 truncate" title={label.path}>
                          {label.key}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={label.value}
                        onChange={e => handleLabelChange(label.path, e.target.value)}
                        className={`flex-1 px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          label.isDirty ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Status messages */}
      {saveMutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Failed to save labels. Please try again.
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          Labels saved successfully.
        </div>
      )}
    </div>
  );
}

export default LabelEditor;
