/**
 * EntityList - List of all entities in the system
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Database,
  CheckCircle,
  XCircle,
  Activity,
  MoreVertical,
  Edit,
  Trash2,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { EntityScope } from '../types';

interface EntityListProps {
  scopes: Record<string, EntityScope>;
  onDelete?: (scope: string) => void;
  isDeleting?: boolean;
}

export function EntityList({ scopes, onDelete, isDeleting }: EntityListProps): React.ReactElement {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'system'>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const entities = useMemo(() => {
    return Object.entries(scopes)
      .filter(([, scope]) => scope.entity)
      .map(([scopeName, scope]) => ({
        ...scope,
        name: scopeName,
      }))
      .filter((entity) => {
        // Filter by search query
        if (searchQuery && !entity.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        // Filter by type
        if (filterType === 'custom' && !entity.isCustom) return false;
        if (filterType === 'system' && entity.isCustom) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [scopes, searchQuery, filterType]);

  const customCount = useMemo(() => {
    return Object.values(scopes).filter((s) => s.entity && s.isCustom).length;
  }, [scopes]);

  const getTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      Base: 'Base',
      BasePlus: 'Base Plus',
      Person: 'Person',
      Company: 'Company',
      CategoryTree: 'Category',
      Event: 'Event',
    };
    return labels[type ?? ''] || type || 'Base';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-gray-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Entity Manager</h1>
            <p className="text-sm text-gray-500">
              {entities.length} entities • {customCount} custom
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/Admin/entityManager/create')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Entity
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'custom', 'system'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-4 py-2 text-sm rounded-md border transition-colors capitalize',
                filterType === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Entity grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities.map((entity) => (
          <div
            key={entity.name}
            className={cn(
              'bg-white border rounded-lg p-4 hover:shadow-md transition-shadow',
              entity.disabled ? 'border-gray-200 opacity-60' : 'border-gray-200'
            )}
          >
            <div className="flex items-start justify-between">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => navigate(`/Admin/entityManager/scope/${entity.name}`)}
              >
                <div className="flex items-center gap-2">
                  {entity.iconClass ? (
                    <i className={cn(entity.iconClass, 'text-gray-500')} />
                  ) : (
                    <Database className="h-4 w-4 text-gray-400" />
                  )}
                  <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                    {entity.name}
                  </h3>
                  {entity.isCustom && (
                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                      Custom
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                    {getTypeLabel(entity.type)}
                  </span>
                  {entity.color && (
                    <span
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: entity.color }}
                    />
                  )}
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === entity.name ? null : entity.name)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {openMenu === entity.name && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border py-1 z-10">
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      onClick={() => {
                        setOpenMenu(null);
                        navigate(`/Admin/entityManager/scope/${entity.name}`);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      Configure
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      onClick={() => {
                        setOpenMenu(null);
                        navigate(`/Admin/entityManager/scope/${entity.name}/edit`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    {entity.isCustom && (
                      <>
                        <hr className="my-1" />
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          disabled={isDeleting}
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${entity.name}"? This action cannot be undone.`)) {
                              onDelete?.(entity.name);
                              setOpenMenu(null);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Features row */}
            <div className="mt-4 pt-3 border-t flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                {entity.disabled ? (
                  <XCircle className="h-3 w-3 text-gray-400" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                <span>{entity.disabled ? 'Disabled' : 'Active'}</span>
              </div>
              {entity.stream && (
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-blue-500" />
                  <span>Stream</span>
                </div>
              )}
              {entity.tab && (
                <div className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                  <span>Tab</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {entities.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No entities found</p>
        </div>
      )}
    </div>
  );
}

export default EntityList;
