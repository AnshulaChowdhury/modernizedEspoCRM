/**
 * Dynamic Logic Builder types
 */

/**
 * Logical operators for condition groups
 */
export type LogicalOperator = 'and' | 'or' | 'not';

/**
 * Comparison operators for field conditions
 */
export type ComparisonOperator =
  | 'equals'
  | 'notEquals'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isTrue'
  | 'isFalse'
  | 'contains'
  | 'notContains'
  | 'has'
  | 'notHas'
  | 'startsWith'
  | 'endsWith'
  | 'matches'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEquals'
  | 'lessThanOrEquals'
  | 'in'
  | 'notIn'
  | 'isLinked'
  | 'isNotLinked'
  | 'inPast'
  | 'inFuture'
  | 'today'
  | 'past'
  | 'future';

/**
 * Field condition item
 */
export interface FieldCondition {
  type: ComparisonOperator;
  attribute: string;
  value?: unknown;
  data?: {
    field?: string;
    type?: string;
    [key: string]: unknown;
  };
}

/**
 * Group condition (AND/OR/NOT)
 */
export interface GroupCondition {
  type: LogicalOperator;
  value: ConditionItem[];
}

/**
 * Union type for any condition item
 */
export type ConditionItem = FieldCondition | GroupCondition;

/**
 * Root condition group structure (what's stored in the model)
 */
export interface DynamicLogicConditions {
  conditionGroup: ConditionItem[];
}

/**
 * Operator definition for a field type
 */
export interface OperatorDefinition {
  type: ComparisonOperator;
  label: string;
  hasValue: boolean;
}

/**
 * Field type configuration for dynamic logic
 */
export interface FieldTypeConfig {
  typeList: ComparisonOperator[];
  view?: string;
}

/**
 * Check if condition is a group condition
 */
export function isGroupCondition(condition: ConditionItem): condition is GroupCondition {
  return ['and', 'or', 'not'].includes(condition.type);
}

/**
 * Check if condition is a field condition
 */
export function isFieldCondition(condition: ConditionItem): condition is FieldCondition {
  return !isGroupCondition(condition);
}

/**
 * Default operators by field type
 */
export const FIELD_TYPE_OPERATORS: Record<string, ComparisonOperator[]> = {
  varchar: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'startsWith', 'contains', 'notContains', 'matches'],
  text: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'contains', 'notContains'],
  int: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'greaterThan', 'lessThan', 'greaterThanOrEquals', 'lessThanOrEquals'],
  float: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'greaterThan', 'lessThan', 'greaterThanOrEquals', 'lessThanOrEquals'],
  currency: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'greaterThan', 'lessThan', 'greaterThanOrEquals', 'lessThanOrEquals'],
  date: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'greaterThan', 'lessThan', 'greaterThanOrEquals', 'lessThanOrEquals', 'today', 'inPast', 'inFuture'],
  datetime: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'greaterThan', 'lessThan', 'greaterThanOrEquals', 'lessThanOrEquals', 'today', 'inPast', 'inFuture'],
  bool: ['isTrue', 'isFalse'],
  enum: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'in', 'notIn'],
  multiEnum: ['has', 'notHas', 'isEmpty', 'isNotEmpty'],
  array: ['has', 'notHas', 'isEmpty', 'isNotEmpty'],
  link: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'isLinked', 'isNotLinked'],
  linkMultiple: ['contains', 'notContains', 'isEmpty', 'isNotEmpty'],
  linkParent: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty'],
  id: ['equals', 'notEquals'],
};

/**
 * Operators that don't need a value input
 */
export const NO_VALUE_OPERATORS: ComparisonOperator[] = [
  'isEmpty',
  'isNotEmpty',
  'isTrue',
  'isFalse',
  'isLinked',
  'isNotLinked',
  'today',
  'inPast',
  'inFuture',
  'past',
  'future',
];

/**
 * Get operator label
 */
export function getOperatorLabel(operator: ComparisonOperator): string {
  const labels: Record<ComparisonOperator, string> = {
    equals: 'equals',
    notEquals: 'not equals',
    isEmpty: 'is empty',
    isNotEmpty: 'is not empty',
    isTrue: 'is true',
    isFalse: 'is false',
    contains: 'contains',
    notContains: 'does not contain',
    has: 'has',
    notHas: 'does not have',
    startsWith: 'starts with',
    endsWith: 'ends with',
    matches: 'matches',
    greaterThan: 'greater than',
    lessThan: 'less than',
    greaterThanOrEquals: 'greater than or equals',
    lessThanOrEquals: 'less than or equals',
    in: 'in',
    notIn: 'not in',
    isLinked: 'is linked',
    isNotLinked: 'is not linked',
    inPast: 'in past',
    inFuture: 'in future',
    today: 'today',
    past: 'past',
    future: 'future',
  };
  return labels[operator] || operator;
}
