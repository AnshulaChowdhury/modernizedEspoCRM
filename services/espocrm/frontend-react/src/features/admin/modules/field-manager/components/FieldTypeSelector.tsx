/**
 * FieldTypeSelector - Select field type when creating a new field
 */
import React, { useState, useMemo } from 'react';
import {
  Type,
  Hash,
  Calendar,
  List,
  Link2,
  Paperclip,
  Search,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { FIELD_TYPES, FIELD_CATEGORIES, getFieldTypesByCategory } from '../types';
import type { FieldCategory, FieldTypeDefinition } from '../types';

interface FieldTypeSelectorProps {
  onSelect: (type: string) => void;
  selectedType?: string;
}

const CATEGORY_ICONS: Record<FieldCategory, React.ElementType> = {
  text: Type,
  number: Hash,
  date: Calendar,
  selection: List,
  relation: Link2,
  misc: Paperclip,
  system: Paperclip,
};

export function FieldTypeSelector({
  onSelect,
  selectedType,
}: FieldTypeSelectorProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<FieldCategory | null>('text');

  const filteredTypes = useMemo(() => {
    if (!searchQuery) return null;
    const query = searchQuery.toLowerCase();
    return FIELD_TYPES.filter(
      (f) =>
        !f.notCreatable &&
        (f.type.toLowerCase().includes(query) ||
          f.label.toLowerCase().includes(query) ||
          f.description?.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleTypeClick = (type: FieldTypeDefinition) => {
    onSelect(type.type);
  };

  const renderTypeCard = (type: FieldTypeDefinition) => (
    <button
      key={type.type}
      onClick={() => handleTypeClick(type)}
      className={cn(
        'w-full p-3 text-left border rounded-lg transition-colors',
        selectedType === type.type
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      <div className="font-medium text-gray-900">{type.label}</div>
      {type.description && (
        <div className="text-xs text-gray-500 mt-1">{type.description}</div>
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search field types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Search results */}
      {filteredTypes && (
        <div className="space-y-2">
          <div className="text-sm text-gray-500">
            {filteredTypes.length} result{filteredTypes.length !== 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {filteredTypes.map(renderTypeCard)}
          </div>
          {filteredTypes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No field types match your search
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {!filteredTypes && (
        <div className="space-y-2">
          {FIELD_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.value];
            const types = getFieldTypesByCategory(category.value);
            const isExpanded = expandedCategory === category.value;

            return (
              <div key={category.value} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.value)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900">{category.label}</span>
                    <span className="text-sm text-gray-500">({types.length})</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-5 w-5 text-gray-400 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {types.map(renderTypeCard)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected type indicator */}
      {selectedType && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            Selected: <span className="font-medium">{selectedType}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FieldTypeSelector;
