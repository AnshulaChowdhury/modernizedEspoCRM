/**
 * ConditionsString - Display conditions in a human-readable format
 */
import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ConditionItem, FieldCondition, GroupCondition } from '../types';
import { isGroupCondition, getOperatorLabel } from '../types';

interface ConditionsStringProps {
  conditions: ConditionItem[];
  scope: string;
}

export function ConditionsString({
  conditions,
  scope,
}: ConditionsStringProps): React.ReactElement {
  const { translateField, translateOption } = useTranslation();

  if (!conditions || conditions.length === 0) {
    return (
      <span className="text-gray-400 italic">No conditions defined</span>
    );
  }

  const renderCondition = (condition: ConditionItem, index: number): React.ReactNode => {
    if (isGroupCondition(condition)) {
      return renderGroup(condition, index);
    }
    return renderFieldCondition(condition, index);
  };

  const renderGroup = (group: GroupCondition, index: number): React.ReactNode => {
    const operator = group.type.toUpperCase();
    const items = group.value || [];

    if (items.length === 0) {
      return null;
    }

    const operatorColor = {
      and: 'text-blue-600',
      or: 'text-orange-600',
      not: 'text-red-600',
    }[group.type] || 'text-gray-600';

    return (
      <span key={index} className="inline">
        {group.type === 'not' && (
          <span className={`font-medium ${operatorColor}`}>NOT </span>
        )}
        <span className="text-gray-500">(</span>
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span className={`font-medium ${operatorColor}`}> {operator} </span>
            )}
            {renderCondition(item, i)}
          </React.Fragment>
        ))}
        <span className="text-gray-500">)</span>
      </span>
    );
  };

  const renderFieldCondition = (condition: FieldCondition, index: number): React.ReactNode => {
    const fieldName = condition.data?.field || condition.attribute?.split('.')[0] || '';
    const isCurrentUser = condition.attribute?.startsWith('$user.');
    const fieldScope = isCurrentUser ? 'User' : scope;

    const fieldLabel = isCurrentUser
      ? 'Current User'
      : translateField(fieldScope, fieldName);

    const operatorLabel = getOperatorLabel(condition.type);

    // Format value
    let valueDisplay = '';
    if (condition.value !== undefined && condition.value !== null) {
      if (Array.isArray(condition.value)) {
        valueDisplay = condition.value
          .map(v => translateOption(fieldScope, fieldName, v))
          .join(', ');
      } else if (typeof condition.value === 'boolean') {
        valueDisplay = condition.value ? 'True' : 'False';
      } else {
        const strValue = String(condition.value);
        // Try to translate if it's an enum value
        const translated = translateOption(fieldScope, fieldName, strValue);
        valueDisplay = translated !== strValue ? translated : strValue;
      }
    }

    return (
      <span key={index} className="inline-flex items-center gap-1">
        <span className="font-medium text-gray-700">{fieldLabel}</span>
        <span className="text-gray-500">{operatorLabel}</span>
        {valueDisplay && (
          <span className="text-blue-600">"{valueDisplay}"</span>
        )}
      </span>
    );
  };

  // Wrap in implicit AND at root level
  return (
    <div className="text-sm">
      {conditions.map((condition, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span className="font-medium text-blue-600"> AND </span>
          )}
          {renderCondition(condition, i)}
        </React.Fragment>
      ))}
    </div>
  );
}

export default ConditionsString;
