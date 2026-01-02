/**
 * Dynamic Logic Module
 *
 * Provides dynamic field/panel visibility, requirements, and option filtering
 * based on conditions defined in EspoCRM metadata.
 */

export * from './types';
export { evaluateConditionGroup, evaluateFieldDynamicLogic, evaluateEntityDynamicLogic } from './evaluator';
export { useDynamicLogic, useFieldDynamicLogic } from './useDynamicLogic';
