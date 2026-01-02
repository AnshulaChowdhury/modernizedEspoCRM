import { useMemo, useCallback } from 'react';
import { z, type ZodTypeAny } from 'zod';
import { useMetadata } from '@/lib/metadata/useMetadata';
import {
  generateEntitySchema,
  validateEntityData,
  type FieldValidationDef,
} from './schemaGenerator';

export interface ValidationError {
  field: string;
  message: string;
}

export interface UseFormValidationOptions {
  /** Only include these fields in validation */
  includeFields?: string[];
  /** Exclude these fields from validation */
  excludeFields?: string[];
  /** Skip read-only fields (default: true) */
  skipReadOnly?: boolean;
  /** Additional custom validations */
  customValidations?: Record<string, (value: unknown, data: Record<string, unknown>) => string | null>;
}

export interface UseFormValidationResult {
  /** The generated Zod schema */
  schema: z.ZodObject<Record<string, ZodTypeAny>> | null;
  /** Validate the entire form data */
  validate: (data: Record<string, unknown>) => {
    isValid: boolean;
    errors: Record<string, string>;
  };
  /** Validate a single field */
  validateField: (fieldName: string, value: unknown, data: Record<string, unknown>) => string | null;
  /** Get field definitions */
  fieldDefs: Record<string, FieldValidationDef>;
  /** Whether validation is ready */
  isReady: boolean;
}

/**
 * React hook for form validation based on entity metadata
 */
export function useFormValidation(
  entityType: string,
  options?: UseFormValidationOptions
): UseFormValidationResult {
  const { metadata } = useMetadata();

  // Get field definitions from metadata
  const fieldDefs = useMemo<Record<string, FieldValidationDef>>(() => {
    const defs = metadata?.entityDefs?.[entityType]?.fields ?? {};
    const typedDefs: Record<string, FieldValidationDef> = {};

    for (const [key, value] of Object.entries(defs)) {
      typedDefs[key] = value as FieldValidationDef;
    }

    return typedDefs;
  }, [metadata, entityType]);

  // Generate schema
  const schema = useMemo(() => {
    if (Object.keys(fieldDefs).length === 0) {
      return null;
    }

    return generateEntitySchema(fieldDefs, {
      includeFields: options?.includeFields,
      excludeFields: options?.excludeFields,
      skipReadOnly: options?.skipReadOnly ?? true,
    });
  }, [fieldDefs, options?.includeFields, options?.excludeFields, options?.skipReadOnly]);

  // Validate entire form
  const validate = useCallback(
    (data: Record<string, unknown>): { isValid: boolean; errors: Record<string, string> } => {
      const errors: Record<string, string> = {};

      // Run Zod validation
      const result = validateEntityData(fieldDefs, data, {
        includeFields: options?.includeFields,
        excludeFields: options?.excludeFields,
        skipReadOnly: options?.skipReadOnly ?? true,
      });

      if (!result.success) {
        Object.assign(errors, result.errors);
      }

      // Run custom validations
      if (options?.customValidations) {
        for (const [fieldName, validator] of Object.entries(options.customValidations)) {
          const error = validator(data[fieldName], data);
          if (error && !errors[fieldName]) {
            errors[fieldName] = error;
          }
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
    [fieldDefs, options]
  );

  // Validate single field
  const validateField = useCallback(
    (fieldName: string, value: unknown, data: Record<string, unknown>): string | null => {
      const fieldDef = fieldDefs[fieldName];

      if (!fieldDef) {
        return null;
      }

      // Create a mini schema for just this field
      const singleFieldSchema = generateEntitySchema(
        { [fieldName]: fieldDef },
        { skipReadOnly: false }
      );

      const result = singleFieldSchema.safeParse({ [fieldName]: value });

      if (!result.success) {
        const issue = result.error.issues[0];
        return issue?.message ?? 'Invalid value';
      }

      // Run custom validation if exists
      const customValidator = options?.customValidations?.[fieldName];
      if (customValidator) {
        return customValidator(value, data);
      }

      return null;
    },
    [fieldDefs, options?.customValidations]
  );

  return {
    schema,
    validate,
    validateField,
    fieldDefs,
    isReady: Object.keys(fieldDefs).length > 0,
  };
}

/**
 * Utility to check if a field is required based on metadata
 */
export function isFieldRequired(fieldDef: FieldValidationDef | undefined): boolean {
  return fieldDef?.required === true;
}

/**
 * Utility to get field validation constraints
 */
export function getFieldConstraints(fieldDef: FieldValidationDef | undefined): {
  required: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  options?: (string | number)[];
} {
  if (!fieldDef) {
    return { required: false };
  }

  return {
    required: fieldDef.required ?? false,
    maxLength: fieldDef.maxLength,
    minLength: fieldDef.minLength,
    min: fieldDef.min,
    max: fieldDef.max,
    pattern: fieldDef.pattern,
    options: fieldDef.options,
  };
}
