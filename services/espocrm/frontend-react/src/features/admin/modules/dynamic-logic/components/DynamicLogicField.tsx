/**
 * DynamicLogicField - Field component for editing dynamic logic conditions
 * Used in Field Manager and Entity Manager forms
 */
import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import type { ConditionItem, DynamicLogicConditions } from '../types';
import { ConditionBuilderModal } from './ConditionBuilder';
import { ConditionsString } from './ConditionsString';

interface DynamicLogicFieldProps {
  scope: string;
  value: DynamicLogicConditions | null;
  onChange: (value: DynamicLogicConditions | null) => void;
  label?: string;
  description?: string;
}

export function DynamicLogicField({
  scope,
  value,
  onChange,
  label = 'Conditions',
  description,
}: DynamicLogicFieldProps): React.ReactElement {
  const [showModal, setShowModal] = useState(false);

  const conditions = value?.conditionGroup || [];
  const hasConditions = conditions.length > 0;

  const handleApply = (newConditions: ConditionItem[]) => {
    if (newConditions.length === 0) {
      onChange(null);
    } else {
      onChange({ conditionGroup: newConditions });
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Display area */}
      <div className="flex items-start gap-2">
        <div
          className={`flex-1 p-3 border rounded-md min-h-[60px] ${
            hasConditions ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <ConditionsString conditions={conditions} scope={scope} />
        </div>

        {/* Edit button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-md"
        >
          <Edit2 className="h-4 w-4" />
          Edit
        </button>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      {/* Clear link if has conditions */}
      {hasConditions && (
        <button
          onClick={handleClear}
          className="text-sm text-red-500 hover:text-red-600"
        >
          Clear conditions
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <ConditionBuilderModal
          scope={scope}
          conditions={conditions}
          onApply={handleApply}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default DynamicLogicField;
