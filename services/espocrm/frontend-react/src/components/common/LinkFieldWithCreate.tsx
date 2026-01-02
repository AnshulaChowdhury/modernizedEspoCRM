/**
 * LinkFieldWithCreate - A select field with a quick-create button
 * Matches Backbone's link field with createButton functionality
 */
import React, { useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { QuickCreateModal } from './QuickCreateModal';

interface Option {
  id: string;
  name: string;
}

interface LinkFieldWithCreateProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: Option[] | undefined;
  entityType: 'TargetList' | 'Campaign';
  queryKey: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

export function LinkFieldWithCreate({
  label,
  value,
  onChange,
  options,
  entityType,
  queryKey,
  required = false,
  error,
  placeholder = '— None —',
}: LinkFieldWithCreateProps): React.ReactElement {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreated = (record: { id: string; name: string }) => {
    // Auto-select the newly created record
    onChange(record.id);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-1">
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">{placeholder}</option>
          {options?.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 hover:text-gray-800"
          title={`Create new ${entityType === 'TargetList' ? 'Target List' : 'Campaign'}`}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      <QuickCreateModal
        entityType={entityType}
        queryKey={queryKey}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

export default LinkFieldWithCreate;
