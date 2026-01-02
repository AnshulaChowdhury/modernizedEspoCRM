/**
 * LinkDefaultField - Link field default value selector
 * Allows selecting a record from the linked entity as the default value
 */
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';

interface LinkDefaultFieldProps {
  scope: string;
  field: string;
  foreignScope: string | null;
  value: { id: string; name: string } | null;
  onChange: (value: { id: string; name: string } | null) => void;
}

interface SearchResult {
  id: string;
  name: string;
}

export function LinkDefaultField({
  scope: _scope,
  field: _field,
  foreignScope,
  value,
  onChange,
}: LinkDefaultFieldProps): React.ReactElement {
  // scope and field are passed for potential future use (e.g., filtering based on context)
  void _scope;
  void _field;
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRecordName, setNewRecordName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for records when query changes
  useEffect(() => {
    if (!foreignScope || !isOpen) return;

    const searchRecords = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          select: 'id,name',
          maxSize: '10',
          orderBy: 'name',
          order: 'asc',
        });

        if (searchQuery.trim()) {
          params.set('where[0][type]', 'textFilter');
          params.set('where[0][value]', searchQuery.trim());
        }

        const response = await apiClient.get<{ list: SearchResult[] }>(
          `/${foreignScope}?${params.toString()}`
        );
        setResults(response.data.list || []);
      } catch (error) {
        console.error('Error searching records:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchRecords, 300);
    return () => clearTimeout(debounce);
  }, [foreignScope, searchQuery, isOpen]);

  const handleSelect = (record: SearchResult) => {
    onChange({ id: record.id, name: record.name });
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange(null);
  };

  const handleCreate = async () => {
    if (!foreignScope || !newRecordName.trim()) return;

    setIsCreating(true);
    try {
      // Create new record with just the name
      const response = await apiClient.post<{ id: string; name: string }>(
        `/${foreignScope}`,
        { name: newRecordName.trim() }
      );

      // Select the newly created record
      onChange({ id: response.data.id, name: response.data.name });
      setShowCreateModal(false);
      setNewRecordName('');
    } catch (error) {
      console.error('Error creating record:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateClick = () => {
    // Navigate to full create page for the foreign entity
    if (foreignScope) {
      navigate(`/${foreignScope}/create`);
    }
  };

  if (!foreignScope) {
    return (
      <div className="text-sm text-gray-500 italic">
        Unable to determine linked entity
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {value ? (
        // Selected value display
        <div className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50">
          <span className="flex-1 text-gray-900">{value.name}</span>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Search input with create button
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder={`Search ${foreignScope}...`}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 flex items-center gap-1"
            title={`Create new ${foreignScope}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !value && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((record) => (
                <li key={record.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(record)}
                    className="w-full px-3 py-2 text-sm text-left text-gray-900 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    {record.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              {searchQuery ? 'No results found' : 'Type to search...'}
            </div>
          )}
        </div>
      )}

      {/* Quick Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Create {foreignScope}
              </h3>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newRecordName}
                onChange={(e) => setNewRecordName(e.target.value)}
                placeholder={`Enter ${foreignScope} name...`}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
              <p className="mt-2 text-xs text-gray-500">
                For full options,{' '}
                <button
                  type="button"
                  onClick={handleCreateClick}
                  className="text-blue-600 hover:underline"
                >
                  create from the full form
                </button>
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRecordName('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newRecordName.trim() || isCreating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LinkDefaultField;
