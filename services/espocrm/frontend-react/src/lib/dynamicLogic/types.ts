/**
 * Dynamic Logic Types
 *
 * Dynamic logic allows controlling field visibility, requirements,
 * and options based on conditions evaluated against record data.
 */

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isTrue'
  | 'isFalse'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEquals'
  | 'lessThanOrEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'isToday'
  | 'inFuture'
  | 'inPast';

export type LogicalOperator = 'and' | 'or' | 'not';

/**
 * Single condition definition
 */
export interface Condition {
  type: ConditionOperator;
  attribute?: string;
  value?: unknown;
  data?: ConditionGroup;
}

/**
 * Condition group (and/or/not)
 */
export interface ConditionGroup {
  type: LogicalOperator;
  value: (Condition | ConditionGroup)[];
}

/**
 * Dynamic logic definition for a field
 */
export interface DynamicLogicDef {
  /** Conditions that make the field visible */
  visible?: ConditionGroup;
  /** Conditions that make the field required */
  required?: ConditionGroup;
  /** Conditions that make the field read-only */
  readOnly?: ConditionGroup;
  /** Conditions for filtering options (enum fields) */
  options?: Record<string, ConditionGroup>;
  /** Invalid conditions (field invalid when true) */
  invalid?: ConditionGroup;
}

/**
 * Dynamic logic definitions for an entity
 */
export interface EntityDynamicLogic {
  fields?: Record<string, DynamicLogicDef>;
  panels?: Record<string, { visible?: ConditionGroup }>;
}

/**
 * Result of evaluating dynamic logic for a field
 */
export interface DynamicFieldState {
  visible: boolean;
  required: boolean;
  readOnly: boolean;
  invalid: boolean;
  filteredOptions?: string[];
}

/**
 * Result of evaluating dynamic logic for an entity
 */
export interface DynamicEntityState {
  fields: Record<string, DynamicFieldState>;
  panels: Record<string, { visible: boolean }>;
}
