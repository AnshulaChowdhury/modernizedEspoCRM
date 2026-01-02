/**
 * ConditionBuilder - Main component for building dynamic logic conditions
 */
import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type {
  ConditionItem,
  GroupCondition,
  FieldCondition,
  ComparisonOperator,
} from '../types';
import { FIELD_TYPE_OPERATORS } from '../types';
import { ConditionGroup } from './ConditionGroup';
import { AddFieldModal } from './AddFieldModal';
import { useMetadata } from '@/lib/metadata/useMetadata';

interface ConditionBuilderProps {
  scope: string;
  conditions: ConditionItem[];
  onChange: (conditions: ConditionItem[]) => void;
}

export function ConditionBuilder({
  scope,
  conditions,
  onChange,
}: ConditionBuilderProps): React.ReactElement {
  const { metadata } = useMetadata();
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);

  // The root condition is always an AND group
  const rootCondition: GroupCondition = {
    type: 'and',
    value: conditions,
  };

  const handleRootChange = useCallback(
    (newRoot: GroupCondition) => {
      onChange(newRoot.value);
    },
    [onChange]
  );

  const handleAddField = useCallback(() => {
    setShowAddFieldModal(true);
  }, []);

  const handleFieldSelect = useCallback(
    (field: string, isCurrentUser?: boolean) => {
      // Get the field type to determine default operator
      const entityDefs = metadata?.entityDefs?.[scope] as Record<string, unknown> | undefined;
      const fields = entityDefs?.fields as Record<string, Record<string, unknown>> | undefined;
      const fieldDef = fields?.[field];
      const fieldType = (fieldDef?.type as string) || 'varchar';

      // Get the first available operator for this field type
      const operators = FIELD_TYPE_OPERATORS[fieldType] || FIELD_TYPE_OPERATORS.varchar || ['equals'];
      const defaultOperator: ComparisonOperator = (operators[0] as ComparisonOperator) || 'equals';

      // Create the new condition
      const newCondition: FieldCondition = {
        type: defaultOperator,
        attribute: isCurrentUser ? field : field,
        data: {
          field: isCurrentUser ? 'id' : field,
          type: defaultOperator,
        },
      };

      // Add to root conditions
      onChange([...conditions, newCondition]);
    },
    [metadata, scope, conditions, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Condition tree */}
      <ConditionGroup
        condition={rootCondition}
        scope={scope}
        level={0}
        onChange={handleRootChange}
        onAddField={handleAddField}
      />

      {/* Add field modal */}
      {showAddFieldModal && (
        <AddFieldModal
          scope={scope}
          onSelect={handleFieldSelect}
          onClose={() => setShowAddFieldModal(false)}
        />
      )}
    </div>
  );
}

/**
 * ConditionBuilderModal - Modal wrapper for ConditionBuilder
 */
interface ConditionBuilderModalProps {
  scope: string;
  conditions: ConditionItem[];
  onApply: (conditions: ConditionItem[]) => void;
  onClose: () => void;
}

export function ConditionBuilderModal({
  scope,
  conditions: initialConditions,
  onApply,
  onClose,
}: ConditionBuilderModalProps): React.ReactElement {
  const [conditions, setConditions] = useState<ConditionItem[]>(
    initialConditions ? [...initialConditions] : []
  );

  const handleApply = () => {
    onApply(conditions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Edit Conditions</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <ConditionBuilder
            scope={scope}
            conditions={conditions}
            onChange={setConditions}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConditionBuilder;
