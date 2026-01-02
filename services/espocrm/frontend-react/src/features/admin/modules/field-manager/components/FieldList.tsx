/**
 * FieldList - List of fields for an entity
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  RotateCcw,
  CheckCircle,
  XCircle,
  Lock,
  Eye,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { FieldDef, FieldCategory } from '../types';
import { getFieldType, FIELD_CATEGORIES } from '../types';

interface FieldListProps {
  scope: string;
  fields: Record<string, FieldDef>;
  labels: Record<string, string>;
  onDelete?: (field: string) => void;
  onReset?: (field: string) => void;
  isDeleting?: boolean;
}

interface FieldItem {
  name: string;
  label: string;
  type: string;
  category: FieldCategory;
  isCustom: boolean;
  isRequired: boolean;
  isReadOnly: boolean;
  isDisabled: boolean;
  hasTooltip: boolean;
}

export function FieldList({
  scope,
  fields,
  labels,
  onDelete,
  onReset,
  isDeleting,
}: FieldListProps): React.ReactElement {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FieldCategory | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'system'>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fieldItems = useMemo((): FieldItem[] => {
    return Object.entries(fields)
      .map(([name, def]): FieldItem => {
        const fieldType = getFieldType(def.type);
        return {
          name,
          label: labels[name] || name,
          type: def.type,
          category: fieldType?.category ?? 'misc',
          isCustom: def.isCustom ?? false,
          isRequired: def.required ?? false,
          isReadOnly: def.readOnly ?? false,
          isDisabled: def.disabled ?? false,
          hasTooltip: def.tooltip ?? false,
        };
      })
      .filter((field) => {
        // Filter by search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (
            !field.name.toLowerCase().includes(query) &&
            !field.label.toLowerCase().includes(query) &&
            !field.type.toLowerCase().includes(query)
          ) {
            return false;
          }
        }
        // Filter by category
        if (filterCategory !== 'all' && field.category !== filterCategory) {
          return false;
        }
        // Filter by type
        if (filterType === 'custom' && !field.isCustom) return false;
        if (filterType === 'system' && field.isCustom) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [fields, labels, searchQuery, filterCategory, filterType]);

  const customCount = useMemo(() => {
    return Object.values(fields).filter((f) => f.isCustom).length;
  }, [fields]);

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      varchar: 'bg-blue-100 text-blue-800',
      text: 'bg-blue-100 text-blue-800',
      wysiwyg: 'bg-blue-100 text-blue-800',
      int: 'bg-green-100 text-green-800',
      float: 'bg-green-100 text-green-800',
      currency: 'bg-green-100 text-green-800',
      date: 'bg-purple-100 text-purple-800',
      datetime: 'bg-purple-100 text-purple-800',
      enum: 'bg-yellow-100 text-yellow-800',
      multiEnum: 'bg-yellow-100 text-yellow-800',
      bool: 'bg-yellow-100 text-yellow-800',
      link: 'bg-pink-100 text-pink-800',
      linkMultiple: 'bg-pink-100 text-pink-800',
      file: 'bg-gray-100 text-gray-800',
      image: 'bg-gray-100 text-gray-800',
    };
    return colors[type] ?? 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tag className="h-6 w-6 text-gray-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Field Manager</h1>
            <p className="text-sm text-gray-500">
              {scope} • {fieldItems.length} fields • {customCount} custom
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/Admin/fieldManager/scope/${scope}/add`)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Field
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as FieldCategory | 'all')}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {FIELD_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
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

      {/* Field table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Field
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Properties
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fieldItems.map((field) => (
              <tr
                key={field.name}
                className={cn(
                  'hover:bg-gray-50',
                  field.isDisabled && 'opacity-50'
                )}
              >
                <td className="px-6 py-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/Admin/fieldManager/scope/${scope}/field/${field.name}`)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {field.label}
                      </span>
                      {field.isCustom && (
                        <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{field.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn('px-2 py-1 text-xs font-medium rounded', getTypeColor(field.type))}>
                    {field.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {field.isRequired && (
                      <div className="flex items-center gap-1" title="Required">
                        <CheckCircle className="h-3 w-3 text-red-500" />
                        <span>Required</span>
                      </div>
                    )}
                    {field.isReadOnly && (
                      <div className="flex items-center gap-1" title="Read-only">
                        <Lock className="h-3 w-3 text-gray-400" />
                        <span>Read-only</span>
                      </div>
                    )}
                    {field.isDisabled && (
                      <div className="flex items-center gap-1" title="Disabled">
                        <XCircle className="h-3 w-3 text-gray-400" />
                        <span>Disabled</span>
                      </div>
                    )}
                    {field.hasTooltip && (
                      <div className="flex items-center gap-1" title="Has tooltip">
                        <FileText className="h-3 w-3 text-blue-400" />
                        <span>Tooltip</span>
                      </div>
                    )}
                    {!field.isRequired && !field.isReadOnly && !field.isDisabled && !field.hasTooltip && (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === field.name ? null : field.name)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {openMenu === field.name && (
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg border py-1 z-10">
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenu(null);
                            navigate(`/Admin/fieldManager/scope/${scope}/field/${field.name}`);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenu(null);
                            navigate(`/${scope}/list`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View in List
                        </button>
                        {!field.isCustom && (
                          <button
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => {
                              if (confirm(`Reset "${field.name}" to default?`)) {
                                onReset?.(field.name);
                                setOpenMenu(null);
                              }
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reset to Default
                          </button>
                        )}
                        {field.isCustom && (
                          <>
                            <hr className="my-1" />
                            <button
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              disabled={isDeleting}
                              onClick={() => {
                                if (confirm(`Delete field "${field.name}"? This cannot be undone.`)) {
                                  onDelete?.(field.name);
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
                </td>
              </tr>
            ))}
            {fieldItems.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No fields found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FieldList;
