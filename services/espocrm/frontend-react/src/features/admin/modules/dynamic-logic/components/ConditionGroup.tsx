/**
 * ConditionGroup - Renders a group of conditions (AND/OR/NOT)
 */
import React, { useCallback } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import type {
  ConditionItem as ConditionItemType,
  GroupCondition,
  FieldCondition,
  LogicalOperator,
} from '../types';
import { isGroupCondition } from '../types';
import { ConditionItem } from './ConditionItem';

interface ConditionGroupProps {
  condition: GroupCondition;
  scope: string;
  level?: number;
  onChange: (condition: GroupCondition) => void;
  onRemove?: () => void;
  onAddField: () => void;
}

export function ConditionGroup({
  condition,
  scope,
  level = 0,
  onChange,
  onRemove,
  onAddField,
}: ConditionGroupProps): React.ReactElement {
  const isRoot = level === 0;
  const isNot = condition.type === 'not';
  const items = condition.value || [];

  // Get border color based on operator
  const getBorderColor = () => {
    switch (condition.type) {
      case 'and':
        return 'border-blue-300 bg-blue-50/50';
      case 'or':
        return 'border-orange-300 bg-orange-50/50';
      case 'not':
        return 'border-red-300 bg-red-50/50';
      default:
        return 'border-gray-300';
    }
  };

  // Get operator badge color
  const getBadgeColor = () => {
    switch (condition.type) {
      case 'and':
        return 'bg-blue-100 text-blue-700';
      case 'or':
        return 'bg-orange-100 text-orange-700';
      case 'not':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleItemChange = useCallback(
    (index: number, newItem: ConditionItemType) => {
      const newItems = [...items];
      newItems[index] = newItem;
      onChange({ ...condition, value: newItems });
    },
    [condition, items, onChange]
  );

  const handleItemRemove = useCallback(
    (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      onChange({ ...condition, value: newItems });
    },
    [condition, items, onChange]
  );

  const handleAddGroup = useCallback(
    (operator: LogicalOperator) => {
      const newGroup: GroupCondition = {
        type: operator,
        value: [],
      };
      onChange({ ...condition, value: [...items, newGroup] });
    },
    [condition, items, onChange]
  );

  const handleAddFieldClick = useCallback(() => {
    onAddField();
  }, [onAddField]);

  // For NOT groups, we only show one item
  const renderItems = () => {
    return items.map((item, index) => {
      if (isGroupCondition(item)) {
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <div className="flex items-center justify-center py-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getBadgeColor()}`}>
                  {condition.type.toUpperCase()}
                </span>
              </div>
            )}
            <ConditionGroup
              condition={item}
              scope={scope}
              level={level + 1}
              onChange={newItem => handleItemChange(index, newItem)}
              onRemove={() => handleItemRemove(index)}
              onAddField={onAddField}
            />
          </React.Fragment>
        );
      }

      return (
        <React.Fragment key={index}>
          {index > 0 && (
            <div className="flex items-center justify-center py-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${getBadgeColor()}`}>
                {condition.type.toUpperCase()}
              </span>
            </div>
          )}
          <ConditionItem
            condition={item as FieldCondition}
            scope={scope}
            onChange={newItem => handleItemChange(index, newItem)}
            onRemove={() => handleItemRemove(index)}
          />
        </React.Fragment>
      );
    });
  };

  return (
    <div
      className={`rounded-lg border-2 ${getBorderColor()} ${
        isRoot ? '' : 'ml-4'
      }`}
    >
      {/* Group header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${getBadgeColor()}`}>
            {condition.type.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">
            {items.length} condition{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        {!isRoot && onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500"
            title="Remove group"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Conditions */}
      <div className="p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-gray-500 italic text-center py-2">
            No conditions. Add a field or group below.
          </div>
        ) : (
          renderItems()
        )}
      </div>

      {/* Add buttons */}
      {(!isNot || items.length === 0) && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 bg-gray-50/50">
          <div className="relative group">
            <button
              onClick={handleAddFieldClick}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <Plus className="h-3 w-3" />
              Add Field
            </button>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded">
              <Plus className="h-3 w-3" />
              Add Group
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleAddGroup('and')}
                className="block w-full px-3 py-1.5 text-sm text-left hover:bg-blue-50 text-blue-700"
              >
                AND Group
              </button>
              <button
                onClick={() => handleAddGroup('or')}
                className="block w-full px-3 py-1.5 text-sm text-left hover:bg-orange-50 text-orange-700"
              >
                OR Group
              </button>
              <button
                onClick={() => handleAddGroup('not')}
                className="block w-full px-3 py-1.5 text-sm text-left hover:bg-red-50 text-red-700"
              >
                NOT Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConditionGroup;
