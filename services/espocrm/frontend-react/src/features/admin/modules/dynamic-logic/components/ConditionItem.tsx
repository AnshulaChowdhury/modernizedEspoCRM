/**
 * ConditionItem - Renders a single field condition
 */
import React, { useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  FieldCondition,
  ComparisonOperator,
} from '../types';
import {
  FIELD_TYPE_OPERATORS,
  NO_VALUE_OPERATORS,
  getOperatorLabel,
} from '../types';

interface ConditionItemProps {
  condition: FieldCondition;
  scope: string;
  onChange: (condition: FieldCondition) => void;
  onRemove: () => void;
}

export function ConditionItem({
  condition,
  scope,
  onChange,
  onRemove,
}: ConditionItemProps): React.ReactElement {
  const { metadata } = useMetadata();
  const { translateField, translateOption } = useTranslation();

  // Get field info from attribute
  const fieldName = condition.data?.field || condition.attribute?.split('.')[0] || '';
  const isCurrentUser = condition.attribute?.startsWith('$user.');

  const fieldScope = isCurrentUser ? 'User' : scope;

  // Get field type and available operators
  const { fieldType, operators } = useMemo(() => {
    const entityDefs = metadata?.entityDefs?.[fieldScope] as Record<string, unknown> | undefined;
    const fields = entityDefs?.fields as Record<string, Record<string, unknown>> | undefined;
    const fieldDef = fields?.[fieldName];
    const type = (fieldDef?.type as string) || 'varchar';

    // Special handling for id field
    if (fieldName === 'id') {
      return { fieldType: 'id', operators: FIELD_TYPE_OPERATORS.id ?? ['equals' as ComparisonOperator] };
    }

    return {
      fieldType: type,
      operators: FIELD_TYPE_OPERATORS[type] ?? FIELD_TYPE_OPERATORS.varchar ?? ['equals' as ComparisonOperator],
    };
  }, [metadata, fieldScope, fieldName]);

  // Get enum options if applicable
  const enumOptions = useMemo(() => {
    if (!['enum', 'multiEnum'].includes(fieldType)) return [];

    const entityDefs = metadata?.entityDefs?.[fieldScope] as Record<string, unknown> | undefined;
    const fields = entityDefs?.fields as Record<string, Record<string, unknown>> | undefined;
    const fieldDef = fields?.[fieldName];

    return (fieldDef?.options as string[]) || [];
  }, [metadata, fieldScope, fieldName, fieldType]);

  // Check if current operator needs a value
  const needsValue = !NO_VALUE_OPERATORS.includes(condition.type);

  const handleOperatorChange = useCallback(
    (newOperator: ComparisonOperator) => {
      const newCondition: FieldCondition = {
        ...condition,
        type: newOperator,
      };

      // Clear value if operator doesn't need one
      if (NO_VALUE_OPERATORS.includes(newOperator)) {
        delete newCondition.value;
      }

      onChange(newCondition);
    },
    [condition, onChange]
  );

  const handleValueChange = useCallback(
    (newValue: unknown) => {
      onChange({
        ...condition,
        value: newValue,
      });
    },
    [condition, onChange]
  );

  // Render value input based on field type
  const renderValueInput = () => {
    if (!needsValue) return null;

    // Enum field - dropdown
    if (fieldType === 'enum' && ['equals', 'notEquals'].includes(condition.type)) {
      return (
        <select
          value={(condition.value as string) || ''}
          onChange={e => handleValueChange(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[120px]"
        >
          <option value="">-- Select --</option>
          {enumOptions.map(opt => (
            <option key={opt} value={opt}>
              {translateOption(fieldScope, fieldName, opt)}
            </option>
          ))}
        </select>
      );
    }

    // Multi-select for 'in' / 'notIn' operators
    if (['in', 'notIn'].includes(condition.type) && fieldType === 'enum') {
      const selectedValues = (condition.value as string[]) || [];
      return (
        <select
          multiple
          value={selectedValues}
          onChange={e => {
            const values = Array.from(e.target.selectedOptions, option => option.value);
            handleValueChange(values);
          }}
          className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[120px] h-20"
        >
          {enumOptions.map(opt => (
            <option key={opt} value={opt}>
              {translateOption(fieldScope, fieldName, opt)}
            </option>
          ))}
        </select>
      );
    }

    // Boolean field
    if (fieldType === 'bool') {
      return (
        <select
          value={condition.value === true ? 'true' : condition.value === false ? 'false' : ''}
          onChange={e => handleValueChange(e.target.value === 'true')}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    // Date field
    if (['date', 'datetime'].includes(fieldType)) {
      return (
        <input
          type={fieldType === 'datetime' ? 'datetime-local' : 'date'}
          value={(condition.value as string) || ''}
          onChange={e => handleValueChange(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        />
      );
    }

    // Number field
    if (['int', 'float', 'currency'].includes(fieldType)) {
      return (
        <input
          type="number"
          value={(condition.value as number) ?? ''}
          onChange={e => handleValueChange(e.target.value ? Number(e.target.value) : null)}
          className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
          step={fieldType === 'int' ? 1 : 'any'}
        />
      );
    }

    // Default text input
    return (
      <input
        type="text"
        value={(condition.value as string) || ''}
        onChange={e => handleValueChange(e.target.value)}
        className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[120px]"
        placeholder="Value..."
      />
    );
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
      {/* Field name */}
      <span className="text-sm font-medium text-gray-700 min-w-[100px]">
        {isCurrentUser ? 'Current User' : translateField(fieldScope, fieldName)}
      </span>

      {/* Operator selector */}
      <select
        value={condition.type}
        onChange={e => handleOperatorChange(e.target.value as ComparisonOperator)}
        className="px-2 py-1 border border-gray-300 rounded text-sm"
      >
        {operators.map(op => (
          <option key={op} value={op}>
            {getOperatorLabel(op)}
          </option>
        ))}
      </select>

      {/* Value input */}
      {renderValueInput()}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 ml-auto"
        title="Remove condition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default ConditionItem;
