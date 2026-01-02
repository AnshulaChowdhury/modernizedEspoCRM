/**
 * AddFieldModal - Modal for selecting a field to add a condition
 */
import React, { useMemo, useState } from 'react';
import { X, Search, User } from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useTranslation } from '@/hooks/useTranslation';
import { FIELD_TYPE_OPERATORS } from '../types';

interface AddFieldModalProps {
  scope: string;
  onSelect: (field: string, isCurrentUser?: boolean) => void;
  onClose: () => void;
}

export function AddFieldModal({
  scope,
  onSelect,
  onClose,
}: AddFieldModalProps): React.ReactElement {
  const { metadata } = useMetadata();
  const { translateField } = useTranslation();
  const [searchText, setSearchText] = useState('');

  // Get available fields for the scope
  const fields = useMemo(() => {
    const entityDefs = metadata?.entityDefs?.[scope] as Record<string, unknown> | undefined;
    const fieldDefs = entityDefs?.fields as Record<string, Record<string, unknown>> | undefined;

    if (!fieldDefs) return [];

    const result: Array<{ name: string; label: string; type: string }> = [];

    for (const [name, def] of Object.entries(fieldDefs)) {
      // Skip disabled and utility fields
      if (def.disabled || def.utility) continue;

      const type = def.type as string;

      // Only include fields that have operators defined
      if (!FIELD_TYPE_OPERATORS[type] && type !== 'id') continue;

      result.push({
        name,
        label: translateField(scope, name),
        type,
      });
    }

    // Add ID field
    result.push({
      name: 'id',
      label: 'ID',
      type: 'id',
    });

    return result.sort((a, b) => a.label.localeCompare(b.label));
  }, [metadata, scope, translateField]);

  // Filter fields by search
  const filteredFields = useMemo(() => {
    if (!searchText.trim()) return fields;

    const lowerSearch = searchText.toLowerCase();
    return fields.filter(
      f =>
        f.label.toLowerCase().includes(lowerSearch) ||
        f.name.toLowerCase().includes(lowerSearch)
    );
  }, [fields, searchText]);

  // Group fields by type
  const groupedFields = useMemo(() => {
    const groups: Record<string, typeof filteredFields> = {};

    for (const field of filteredFields) {
      const group = getFieldTypeGroup(field.type);
      if (!groups[group]) groups[group] = [];
      groups[group].push(field);
    }

    return groups;
  }, [filteredFields]);

  const handleFieldClick = (fieldName: string) => {
    onSelect(fieldName);
    onClose();
  };

  const handleCurrentUserClick = () => {
    onSelect('$user.id', true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Add Field Condition</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search fields..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Fields list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current User option */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Special
            </h4>
            <button
              onClick={handleCurrentUserClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-blue-50 rounded border border-gray-200"
            >
              <User className="h-4 w-4 text-gray-500" />
              <span>Current User</span>
            </button>
          </div>

          {/* Grouped fields */}
          {Object.entries(groupedFields).map(([group, groupFields]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                {group}
              </h4>
              <div className="space-y-1">
                {groupFields.map(field => (
                  <button
                    key={field.name}
                    onClick={() => handleFieldClick(field.name)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 rounded border border-gray-200"
                  >
                    <span>{field.label}</span>
                    <span className="text-xs text-gray-400">{field.type}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {filteredFields.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No fields match your search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Group field types for display
 */
function getFieldTypeGroup(type: string): string {
  if (['varchar', 'text', 'url', 'email', 'phone'].includes(type)) {
    return 'Text Fields';
  }
  if (['int', 'float', 'currency', 'autoincrement'].includes(type)) {
    return 'Number Fields';
  }
  if (['date', 'datetime', 'datetimeOptional'].includes(type)) {
    return 'Date Fields';
  }
  if (['enum', 'multiEnum', 'array', 'checklist'].includes(type)) {
    return 'Selection Fields';
  }
  if (['link', 'linkMultiple', 'linkParent'].includes(type)) {
    return 'Relationship Fields';
  }
  if (type === 'bool') {
    return 'Boolean Fields';
  }
  return 'Other Fields';
}

export default AddFieldModal;
