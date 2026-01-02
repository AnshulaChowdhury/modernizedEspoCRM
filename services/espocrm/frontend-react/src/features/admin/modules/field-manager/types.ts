/**
 * Field Manager types
 */
import type { DynamicLogicConditions } from '../dynamic-logic/types';

export interface FieldDef {
  type: string;
  // Common properties
  required?: boolean;
  readOnly?: boolean;
  readOnlyAfterCreate?: boolean;
  inlineEditDisabled?: boolean;
  notStorable?: boolean;
  disabled?: boolean;
  tooltip?: boolean;
  audited?: boolean;
  default?: unknown;
  isCustom?: boolean;
  view?: string;
  // Dynamic Logic
  dynamicLogicVisible?: DynamicLogicConditions | null;
  dynamicLogicRequired?: DynamicLogicConditions | null;
  dynamicLogicReadOnly?: DynamicLogicConditions | null;
  dynamicLogicOptions?: DynamicLogicConditions | null;
  // Varchar specific
  maxLength?: number;
  pattern?: string;
  copyToClipboard?: boolean;
  // Number specific
  min?: number;
  max?: number;
  disableFormatting?: boolean;
  // Enum/Selection specific
  options?: (string | number)[];
  optionsPath?: string;
  optionsReference?: string;
  isSorted?: boolean;
  displayAsLabel?: boolean;
  labelType?: string;
  translation?: string;
  // Link field specific
  entity?: string;
  foreign?: string;
  defaultAttributes?: Record<string, string> | null;
  // Currency specific
  decimal?: boolean;
  // Date/DateTime specific
  useNumericFormat?: boolean;
  // Text specific
  rows?: number;
  // Array/Multi-enum
  storeArrayValues?: boolean;
  displayAsList?: boolean;
  // Person name
  onlyFirstName?: boolean;
  // Address
  viewMap?: boolean;
  // File/Image
  maxFileSize?: number;
  accept?: string[];
  sourceList?: string[];
}

export interface FieldTypeDefinition {
  type: string;
  label: string;
  category: FieldCategory;
  description?: string;
  params?: FieldParam[];
  notCreatable?: boolean;
  notMergeable?: boolean;
  filter?: boolean;
  fieldDefs?: Partial<FieldDef>;
}

export interface FieldParam {
  name: string;
  type: 'bool' | 'int' | 'float' | 'varchar' | 'enum' | 'enumInt' | 'array' | 'multiEnum';
  label?: string;
  tooltip?: string;
  options?: string[];
  default?: unknown;
  min?: number;
  max?: number;
}

export type FieldCategory =
  | 'text'
  | 'number'
  | 'date'
  | 'selection'
  | 'relation'
  | 'misc'
  | 'system';

export interface CreateFieldData {
  name: string;
  type: string;
  label?: string;
  tooltipText?: string;
  required?: boolean;
  audited?: boolean;
  readOnly?: boolean;
  default?: unknown;
  // Type-specific options
  options?: (string | number)[];
  maxLength?: number;
  min?: number;
  max?: number;
  entity?: string;
  [key: string]: unknown;
}

export interface UpdateFieldData {
  label?: string;
  tooltipText?: string;
  // Common properties
  required?: boolean;
  audited?: boolean;
  readOnly?: boolean;
  readOnlyAfterCreate?: boolean;
  inlineEditDisabled?: boolean;
  default?: unknown;
  // Varchar specific
  maxLength?: number;
  pattern?: string;
  copyToClipboard?: boolean;
  // Number specific
  min?: number;
  max?: number;
  disableFormatting?: boolean;
  // Enum/Selection specific
  options?: (string | number)[];
  isSorted?: boolean;
  displayAsLabel?: boolean;
  // Text specific
  rows?: number;
  // Link specific
  defaultAttributes?: Record<string, string> | null;
  // Dynamic Logic
  dynamicLogicVisible?: DynamicLogicConditions | null;
  dynamicLogicRequired?: DynamicLogicConditions | null;
  dynamicLogicReadOnly?: DynamicLogicConditions | null;
  [key: string]: unknown;
}

// Field types organized by category
export const FIELD_TYPES: FieldTypeDefinition[] = [
  // Text fields
  { type: 'varchar', label: 'Varchar', category: 'text', description: 'Single-line text field' },
  { type: 'text', label: 'Text', category: 'text', description: 'Multi-line text area' },
  { type: 'wysiwyg', label: 'Wysiwyg', category: 'text', description: 'Rich text editor' },
  { type: 'url', label: 'URL', category: 'text', description: 'URL with link' },
  { type: 'email', label: 'Email', category: 'text', description: 'Email address field' },
  { type: 'phone', label: 'Phone', category: 'text', description: 'Phone number field' },

  // Number fields
  { type: 'int', label: 'Integer', category: 'number', description: 'Whole number' },
  { type: 'float', label: 'Float', category: 'number', description: 'Decimal number' },
  { type: 'currency', label: 'Currency', category: 'number', description: 'Currency with amount' },
  { type: 'autoincrement', label: 'Auto-increment', category: 'number', description: 'Auto-incrementing number' },

  // Date fields
  { type: 'date', label: 'Date', category: 'date', description: 'Date picker' },
  { type: 'datetime', label: 'Date-Time', category: 'date', description: 'Date and time picker' },
  { type: 'datetimeOptional', label: 'Date-Time Optional', category: 'date', description: 'Optional date-time' },

  // Selection fields
  { type: 'enum', label: 'Enum', category: 'selection', description: 'Dropdown selection' },
  { type: 'multiEnum', label: 'Multi-Enum', category: 'selection', description: 'Multiple selection' },
  { type: 'array', label: 'Array', category: 'selection', description: 'Array of values' },
  { type: 'checklist', label: 'Checklist', category: 'selection', description: 'Checkbox list' },
  { type: 'bool', label: 'Boolean', category: 'selection', description: 'Yes/No checkbox' },

  // Relation fields (created via Entity Manager relationships, not Field Manager)
  { type: 'link', label: 'Link', category: 'relation', description: 'Link to single record', notCreatable: true },
  { type: 'linkMultiple', label: 'Link-Multiple', category: 'relation', description: 'Link to multiple records', notCreatable: true },
  { type: 'linkParent', label: 'Link-Parent', category: 'relation', description: 'Link to parent record', notCreatable: true },

  // Misc fields
  { type: 'file', label: 'File', category: 'misc', description: 'File attachment' },
  { type: 'image', label: 'Image', category: 'misc', description: 'Image upload' },
  { type: 'attachmentMultiple', label: 'Attachment-Multiple', category: 'misc', description: 'Multiple attachments' },
  { type: 'address', label: 'Address', category: 'misc', description: 'Address with components' },
  { type: 'personName', label: 'Person Name', category: 'misc', description: 'First/last name' },
  { type: 'colorpicker', label: 'Color Picker', category: 'misc', description: 'Color selection' },
  { type: 'barcode', label: 'Barcode', category: 'misc', description: 'Barcode display' },
  { type: 'map', label: 'Map', category: 'misc', description: 'Map location' },

  // System fields (not creatable by user)
  { type: 'id', label: 'ID', category: 'system', notCreatable: true },
  { type: 'foreign', label: 'Foreign', category: 'system', notCreatable: true },
  { type: 'jsonObject', label: 'JSON Object', category: 'system', notCreatable: true },
  { type: 'jsonArray', label: 'JSON Array', category: 'system', notCreatable: true },
];

export const FIELD_CATEGORIES: { value: FieldCategory; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date & Time' },
  { value: 'selection', label: 'Selection' },
  { value: 'relation', label: 'Relation' },
  { value: 'misc', label: 'Miscellaneous' },
];

export function getFieldTypesByCategory(category: FieldCategory): FieldTypeDefinition[] {
  return FIELD_TYPES.filter((f) => f.category === category && !f.notCreatable);
}

export function getFieldType(type: string): FieldTypeDefinition | undefined {
  return FIELD_TYPES.find((f) => f.type === type);
}

export function getCreatableFieldTypes(): FieldTypeDefinition[] {
  return FIELD_TYPES.filter((f) => !f.notCreatable);
}
