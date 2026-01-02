/**
 * Dynamic Logic Condition Evaluator
 *
 * Evaluates dynamic logic conditions against record data.
 */

import type {
  Condition,
  ConditionGroup,
  DynamicLogicDef,
  DynamicFieldState,
  DynamicEntityState,
  EntityDynamicLogic,
} from './types';

/**
 * Get a value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Check if a value is empty
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Parse a date string into a Date object
 */
function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Get today's date at midnight
 */
function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  condition: Condition,
  data: Record<string, unknown>
): boolean {
  const { type, attribute, value: conditionValue } = condition;

  // Get the actual value from data
  const actualValue = attribute ? getNestedValue(data, attribute) : undefined;

  switch (type) {
    case 'equals':
      return actualValue === conditionValue;

    case 'notEquals':
      return actualValue !== conditionValue;

    case 'isEmpty':
      return isEmpty(actualValue);

    case 'isNotEmpty':
      return !isEmpty(actualValue);

    case 'isTrue':
      return actualValue === true;

    case 'isFalse':
      return actualValue === false;

    case 'greaterThan':
      if (typeof actualValue === 'number' && typeof conditionValue === 'number') {
        return actualValue > conditionValue;
      }
      return false;

    case 'lessThan':
      if (typeof actualValue === 'number' && typeof conditionValue === 'number') {
        return actualValue < conditionValue;
      }
      return false;

    case 'greaterThanOrEquals':
      if (typeof actualValue === 'number' && typeof conditionValue === 'number') {
        return actualValue >= conditionValue;
      }
      return false;

    case 'lessThanOrEquals':
      if (typeof actualValue === 'number' && typeof conditionValue === 'number') {
        return actualValue <= conditionValue;
      }
      return false;

    case 'contains':
      if (typeof actualValue === 'string' && typeof conditionValue === 'string') {
        return actualValue.toLowerCase().includes(conditionValue.toLowerCase());
      }
      if (Array.isArray(actualValue)) {
        return actualValue.includes(conditionValue);
      }
      return false;

    case 'notContains':
      if (typeof actualValue === 'string' && typeof conditionValue === 'string') {
        return !actualValue.toLowerCase().includes(conditionValue.toLowerCase());
      }
      if (Array.isArray(actualValue)) {
        return !actualValue.includes(conditionValue);
      }
      return true;

    case 'startsWith':
      if (typeof actualValue === 'string' && typeof conditionValue === 'string') {
        return actualValue.toLowerCase().startsWith(conditionValue.toLowerCase());
      }
      return false;

    case 'endsWith':
      if (typeof actualValue === 'string' && typeof conditionValue === 'string') {
        return actualValue.toLowerCase().endsWith(conditionValue.toLowerCase());
      }
      return false;

    case 'in':
      if (Array.isArray(conditionValue)) {
        return conditionValue.includes(actualValue);
      }
      return false;

    case 'notIn':
      if (Array.isArray(conditionValue)) {
        return !conditionValue.includes(actualValue);
      }
      return true;

    case 'isToday': {
      const dateValue = parseDate(actualValue);
      if (!dateValue) return false;
      const today = getToday();
      return (
        dateValue.getFullYear() === today.getFullYear() &&
        dateValue.getMonth() === today.getMonth() &&
        dateValue.getDate() === today.getDate()
      );
    }

    case 'inFuture': {
      const dateValue = parseDate(actualValue);
      if (!dateValue) return false;
      return dateValue > new Date();
    }

    case 'inPast': {
      const dateValue = parseDate(actualValue);
      if (!dateValue) return false;
      return dateValue < new Date();
    }

    default:
      console.warn(`Unknown condition type: ${type}`);
      return false;
  }
}

/**
 * Check if an item is a ConditionGroup
 */
function isConditionGroup(item: Condition | ConditionGroup): item is ConditionGroup {
  return item.type === 'and' || item.type === 'or' || item.type === 'not';
}

/**
 * Evaluate a condition group (and/or/not)
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  data: Record<string, unknown>
): boolean {
  const { type, value: conditions } = group;

  switch (type) {
    case 'and':
      return conditions.every((condition) =>
        isConditionGroup(condition)
          ? evaluateConditionGroup(condition, data)
          : evaluateCondition(condition, data)
      );

    case 'or':
      return conditions.some((condition) =>
        isConditionGroup(condition)
          ? evaluateConditionGroup(condition, data)
          : evaluateCondition(condition, data)
      );

    case 'not':
      // 'not' typically has a single condition/group
      if (conditions.length === 0) return true;
      const firstCondition = conditions[0];
      if (!firstCondition) return true;
      return !(
        isConditionGroup(firstCondition)
          ? evaluateConditionGroup(firstCondition, data)
          : evaluateCondition(firstCondition, data)
      );

    default:
      console.warn(`Unknown logical operator: ${type}`);
      return false;
  }
}

/**
 * Evaluate dynamic logic for a single field
 */
export function evaluateFieldDynamicLogic(
  fieldLogic: DynamicLogicDef | undefined,
  data: Record<string, unknown>,
  allOptions?: string[]
): DynamicFieldState {
  const result: DynamicFieldState = {
    visible: true,
    required: false,
    readOnly: false,
    invalid: false,
    filteredOptions: undefined,
  };

  if (!fieldLogic) {
    return result;
  }

  // Evaluate visibility
  if (fieldLogic.visible) {
    result.visible = evaluateConditionGroup(fieldLogic.visible, data);
  }

  // Evaluate required (only if visible)
  if (result.visible && fieldLogic.required) {
    result.required = evaluateConditionGroup(fieldLogic.required, data);
  }

  // Evaluate readOnly
  if (fieldLogic.readOnly) {
    result.readOnly = evaluateConditionGroup(fieldLogic.readOnly, data);
  }

  // Evaluate invalid
  if (fieldLogic.invalid) {
    result.invalid = evaluateConditionGroup(fieldLogic.invalid, data);
  }

  // Evaluate filtered options
  if (fieldLogic.options && allOptions) {
    result.filteredOptions = allOptions.filter((option) => {
      const optionCondition = fieldLogic.options?.[option];
      if (!optionCondition) return true; // No condition means always visible
      return evaluateConditionGroup(optionCondition, data);
    });
  }

  return result;
}

/**
 * Evaluate dynamic logic for an entire entity
 */
export function evaluateEntityDynamicLogic(
  entityLogic: EntityDynamicLogic | undefined,
  data: Record<string, unknown>,
  fieldOptions?: Record<string, string[]>
): DynamicEntityState {
  const result: DynamicEntityState = {
    fields: {},
    panels: {},
  };

  if (!entityLogic) {
    return result;
  }

  // Evaluate field logic
  if (entityLogic.fields) {
    for (const [fieldName, fieldLogic] of Object.entries(entityLogic.fields)) {
      result.fields[fieldName] = evaluateFieldDynamicLogic(
        fieldLogic,
        data,
        fieldOptions?.[fieldName]
      );
    }
  }

  // Evaluate panel logic
  if (entityLogic.panels) {
    for (const [panelName, panelLogic] of Object.entries(entityLogic.panels)) {
      result.panels[panelName] = {
        visible: panelLogic.visible
          ? evaluateConditionGroup(panelLogic.visible, data)
          : true,
      };
    }
  }

  return result;
}
