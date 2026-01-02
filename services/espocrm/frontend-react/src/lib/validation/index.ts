/**
 * Validation Module
 *
 * Provides Zod-based form validation generated from EspoCRM metadata.
 * Supports all field types with appropriate validation rules.
 */

export {
  generateFieldSchema,
  generateEntitySchema,
  validateEntityData,
  createFormValidation,
  type FieldValidationDef,
  type UseFormValidationResult,
} from './schemaGenerator';

export {
  useFormValidation,
  isFieldRequired,
  getFieldConstraints,
  type ValidationError,
  type UseFormValidationOptions,
} from './useFormValidation';
