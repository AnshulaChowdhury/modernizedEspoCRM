import { z, type ZodTypeAny } from 'zod';

/**
 * Field definition with all validation-related properties
 * Standalone type to avoid extension issues with FieldDef
 */
export interface FieldValidationDef {
  // Field type (required)
  type: string;

  // String validations
  maxLength?: number;
  minLength?: number;
  pattern?: string;

  // Number validations
  min?: number;
  max?: number;

  // Enum validations
  options?: (string | number)[];

  // General
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  default?: unknown;

  // Link fields
  entity?: string;

  // File fields
  maxFileSize?: number;
  accept?: string[];
  maxCount?: number;

  // Allow additional properties
  [key: string]: unknown;
}

/**
 * Predefined patterns used in EspoCRM
 */
const PATTERNS: Record<string, RegExp> = {
  '$noBadCharacters': /^[^<>&"]*$/,
  '$noHtmlTags': /^[^<>]*$/,
  '$email': /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  '$phone': /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
  '$url': /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  '$alphanumeric': /^[a-zA-Z0-9]*$/,
  '$alphanumericHyphen': /^[a-zA-Z0-9-]*$/,
};

/**
 * Generate a Zod schema for a single field based on its definition
 */
export function generateFieldSchema(
  fieldName: string,
  fieldDef: FieldValidationDef
): ZodTypeAny {
  const { type, required, maxLength, minLength, min, max, pattern, options } = fieldDef;

  let schema: ZodTypeAny;

  switch (type) {
    // String types
    case 'varchar':
    case 'text':
    case 'url':
    case 'wysiwyg':
    case 'password':
    case 'id':
    case 'barcode': {
      let stringSchema = z.string();

      if (maxLength !== undefined) {
        stringSchema = stringSchema.max(maxLength, {
          message: `${formatFieldName(fieldName)} must be at most ${maxLength} characters`,
        });
      }

      if (minLength !== undefined) {
        stringSchema = stringSchema.min(minLength, {
          message: `${formatFieldName(fieldName)} must be at least ${minLength} characters`,
        });
      }

      if (pattern) {
        const regex = PATTERNS[pattern] ?? new RegExp(pattern);
        stringSchema = stringSchema.regex(regex, {
          message: `${formatFieldName(fieldName)} contains invalid characters`,
        });
      }

      // URL specific validation
      if (type === 'url') {
        if (required) {
          schema = stringSchema
            .min(1, { message: `${formatFieldName(fieldName)} is required` })
            .refine(
              (val) => /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}/i.test(val),
              { message: `${formatFieldName(fieldName)} must be a valid URL` }
            );
        } else {
          schema = stringSchema
            .optional()
            .or(z.literal(''))
            .refine(
              (val) => !val || val.length === 0 || /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}/i.test(val),
              { message: `${formatFieldName(fieldName)} must be a valid URL` }
            );
        }
        break;
      }

      schema = required
        ? stringSchema.min(1, { message: `${formatFieldName(fieldName)} is required` })
        : stringSchema.optional().or(z.literal(''));
      break;
    }

    // Email type
    case 'email': {
      let emailSchema = z.string().email({
        message: `${formatFieldName(fieldName)} must be a valid email address`,
      });

      if (maxLength !== undefined) {
        emailSchema = emailSchema.max(maxLength);
      }

      schema = required
        ? emailSchema
        : emailSchema.optional().or(z.literal(''));
      break;
    }

    // Phone type
    case 'phone': {
      const phoneSchema = z.union([
        z.string(),
        z.array(z.object({
          phoneNumber: z.string().optional(),
          type: z.string().optional(),
          primary: z.boolean().optional(),
        })),
      ]);

      schema = required
        ? phoneSchema.refine(
            (val) => {
              if (typeof val === 'string') return val.length > 0;
              if (Array.isArray(val)) return val.some((p) => p.phoneNumber);
              return false;
            },
            { message: `${formatFieldName(fieldName)} is required` }
          )
        : phoneSchema.optional();
      break;
    }

    // Integer type
    case 'int':
    case 'autoincrement': {
      let intSchema = z.number().int({
        message: `${formatFieldName(fieldName)} must be a whole number`,
      });

      if (min !== undefined) {
        intSchema = intSchema.min(min, {
          message: `${formatFieldName(fieldName)} must be at least ${min}`,
        });
      }

      if (max !== undefined) {
        intSchema = intSchema.max(max, {
          message: `${formatFieldName(fieldName)} must be at most ${max}`,
        });
      }

      schema = required
        ? intSchema
        : intSchema.optional().nullable();
      break;
    }

    // Float type
    case 'float':
    case 'currency': {
      let floatSchema = z.number();

      if (min !== undefined) {
        floatSchema = floatSchema.min(min, {
          message: `${formatFieldName(fieldName)} must be at least ${min}`,
        });
      }

      if (max !== undefined) {
        floatSchema = floatSchema.max(max, {
          message: `${formatFieldName(fieldName)} must be at most ${max}`,
        });
      }

      schema = required
        ? floatSchema
        : floatSchema.optional().nullable();
      break;
    }

    // Boolean type
    case 'bool': {
      schema = z.boolean().optional().default(false);
      break;
    }

    // Date types
    case 'date': {
      if (required) {
        schema = z.string()
          .min(1, { message: `${formatFieldName(fieldName)} is required` })
          .refine(
            (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
            { message: `${formatFieldName(fieldName)} must be a valid date (YYYY-MM-DD)` }
          );
      } else {
        schema = z.string()
          .optional()
          .or(z.literal(''))
          .refine(
            (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
            { message: `${formatFieldName(fieldName)} must be a valid date (YYYY-MM-DD)` }
          );
      }
      break;
    }

    case 'datetime':
    case 'datetimeOptional': {
      if (required) {
        schema = z.string()
          .min(1, { message: `${formatFieldName(fieldName)} is required` })
          .refine(
            (val) => /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?/.test(val),
            { message: `${formatFieldName(fieldName)} must be a valid datetime` }
          );
      } else {
        schema = z.string()
          .optional()
          .or(z.literal(''))
          .refine(
            (val) => !val || /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?/.test(val),
            { message: `${formatFieldName(fieldName)} must be a valid datetime` }
          );
      }
      break;
    }

    // Enum type
    case 'enum': {
      if (options && options.length > 0) {
        const enumValues = options.map(String);
        const enumSchema = z.enum(enumValues as [string, ...string[]]);

        schema = required
          ? enumSchema
          : enumSchema.optional().or(z.literal(''));
      } else {
        schema = required
          ? z.string().min(1, { message: `${formatFieldName(fieldName)} is required` })
          : z.string().optional();
      }
      break;
    }

    // MultiEnum type
    case 'multiEnum':
    case 'array':
    case 'checklist': {
      if (options && options.length > 0) {
        const validOptions = options.map(String);
        const itemSchema = z.string().refine(
          (val) => validOptions.includes(val),
          { message: `Invalid option selected` }
        );

        schema = required
          ? z.array(itemSchema).min(1, { message: `${formatFieldName(fieldName)} requires at least one selection` })
          : z.array(itemSchema).optional().default([]);
      } else {
        schema = required
          ? z.array(z.string()).min(1, { message: `${formatFieldName(fieldName)} requires at least one selection` })
          : z.array(z.string()).optional().default([]);
      }
      break;
    }

    // Link types
    case 'link':
    case 'linkOne': {
      const linkSchema = z.union([
        z.string(), // Just ID
        z.object({
          id: z.string(),
          name: z.string().optional(),
        }),
      ]);

      schema = required
        ? linkSchema.refine(
            (val) => {
              if (typeof val === 'string') return val.length > 0;
              if (typeof val === 'object') return val.id.length > 0;
              return false;
            },
            { message: `${formatFieldName(fieldName)} is required` }
          )
        : linkSchema.optional().nullable();
      break;
    }

    case 'linkMultiple': {
      const linkMultipleSchema = z.array(z.union([
        z.string(),
        z.object({
          id: z.string(),
          name: z.string().optional(),
        }),
      ]));

      schema = required
        ? linkMultipleSchema.min(1, { message: `${formatFieldName(fieldName)} requires at least one selection` })
        : linkMultipleSchema.optional().default([]);
      break;
    }

    case 'linkParent': {
      const linkParentSchema = z.object({
        parentType: z.string(),
        parentId: z.string(),
        parentName: z.string().optional(),
      });

      schema = required
        ? linkParentSchema.refine(
            (val) => val.parentType && val.parentId,
            { message: `${formatFieldName(fieldName)} is required` }
          )
        : linkParentSchema.optional().nullable();
      break;
    }

    // File types
    case 'file':
    case 'image':
    case 'attachment': {
      const fileSchema = z.union([
        z.string(), // File ID
        z.object({
          id: z.string(),
          name: z.string().optional(),
          type: z.string().optional(),
          size: z.number().optional(),
        }),
      ]);

      schema = required
        ? fileSchema.refine(
            (val) => {
              if (typeof val === 'string') return val.length > 0;
              if (typeof val === 'object') return val.id.length > 0;
              return false;
            },
            { message: `${formatFieldName(fieldName)} is required` }
          )
        : fileSchema.optional().nullable();
      break;
    }

    case 'attachmentMultiple': {
      let attachmentArraySchema = z.array(z.union([
        z.string(),
        z.object({
          id: z.string(),
          name: z.string().optional(),
          type: z.string().optional(),
          size: z.number().optional(),
        }),
      ]));

      if (fieldDef.maxCount !== undefined) {
        attachmentArraySchema = attachmentArraySchema.max(fieldDef.maxCount, {
          message: `Maximum ${fieldDef.maxCount} files allowed`,
        });
      }

      schema = required
        ? attachmentArraySchema.min(1, { message: `${formatFieldName(fieldName)} requires at least one file` })
        : attachmentArraySchema.optional().default([]);
      break;
    }

    // Address type
    case 'address': {
      schema = z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
      }).optional();
      break;
    }

    // Person name type
    case 'personName': {
      schema = z.object({
        salutation: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      }).optional();
      break;
    }

    // Color picker type
    case 'colorpicker': {
      if (required) {
        schema = z.string()
          .min(1, { message: `${formatFieldName(fieldName)} is required` })
          .refine(
            (val) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val),
            { message: `${formatFieldName(fieldName)} must be a valid hex color` }
          );
      } else {
        schema = z.string()
          .optional()
          .or(z.literal(''))
          .refine(
            (val) => !val || /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val),
            { message: `${formatFieldName(fieldName)} must be a valid hex color` }
          );
      }
      break;
    }

    // Map type (coordinates)
    case 'map': {
      schema = z.object({
        latitude: z.number().min(-90).max(90).optional().nullable(),
        longitude: z.number().min(-180).max(180).optional().nullable(),
      }).optional();
      break;
    }

    // Default fallback - accept any value
    default: {
      schema = z.unknown().optional();
    }
  }

  return schema;
}

/**
 * Generate a complete Zod schema for an entity based on field definitions
 */
export function generateEntitySchema(
  fieldDefs: Record<string, FieldValidationDef>,
  options?: {
    /** Only include these fields in the schema */
    includeFields?: string[];
    /** Exclude these fields from the schema */
    excludeFields?: string[];
    /** Skip read-only fields */
    skipReadOnly?: boolean;
  }
): z.ZodObject<Record<string, ZodTypeAny>> {
  const { includeFields, excludeFields = [], skipReadOnly = true } = options ?? {};

  const schemaShape: Record<string, ZodTypeAny> = {};

  for (const [fieldName, fieldDef] of Object.entries(fieldDefs)) {
    // Apply filters
    if (includeFields && !includeFields.includes(fieldName)) continue;
    if (excludeFields.includes(fieldName)) continue;
    if (skipReadOnly && fieldDef.readOnly) continue;
    if (fieldDef.disabled) continue;

    // Skip system fields
    if (['id', 'deleted', 'createdAt', 'modifiedAt', 'createdBy', 'modifiedBy'].includes(fieldName)) {
      continue;
    }

    schemaShape[fieldName] = generateFieldSchema(fieldName, fieldDef);
  }

  return z.object(schemaShape).passthrough();
}

/**
 * Validate data against an entity schema
 */
export function validateEntityData(
  fieldDefs: Record<string, FieldValidationDef>,
  data: Record<string, unknown>,
  options?: Parameters<typeof generateEntitySchema>[1]
): { success: true; data: Record<string, unknown> } | { success: false; errors: Record<string, string> } {
  const schema = generateEntitySchema(fieldDefs, options);

  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Convert Zod errors to a simple error map
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join('.');
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return { success: false, errors };
}

/**
 * Format field name for display in error messages
 */
function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Hook result type for useFormValidation
 */
export interface UseFormValidationResult {
  schema: z.ZodObject<Record<string, ZodTypeAny>>;
  validate: (data: Record<string, unknown>) => ReturnType<typeof validateEntityData>;
  getFieldError: (fieldName: string, errors: Record<string, string>) => string | undefined;
}

/**
 * Create a validation configuration for a form
 */
export function createFormValidation(
  fieldDefs: Record<string, FieldValidationDef>,
  options?: Parameters<typeof generateEntitySchema>[1]
): UseFormValidationResult {
  const schema = generateEntitySchema(fieldDefs, options);

  return {
    schema,
    validate: (data: Record<string, unknown>) => validateEntityData(fieldDefs, data, options),
    getFieldError: (fieldName: string, errors: Record<string, string>) => errors[fieldName],
  };
}
