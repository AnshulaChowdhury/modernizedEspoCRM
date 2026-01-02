/**
 * Field Types System
 *
 * This module provides the field rendering system for EspoCRM React.
 * Fields are registered by type and can render in different modes:
 * - detail: Read-only display in record detail views
 * - list: Compact display in list/table views
 * - edit: Editable input for forms
 * - search: Search filter input
 */

import { registerField } from './registry';

// Text fields
import { VarcharField } from './text/VarcharField';
import { TextField } from './text/TextField';
import { UrlField } from './text/UrlField';
import { WysiwygField } from './text/WysiwygField';
import { PasswordField } from './text/PasswordField';
import { UrlMultipleField } from './text/UrlMultipleField';

// Number fields
import { IntField } from './number/IntField';
import { FloatField } from './number/FloatField';
import { CurrencyField } from './number/CurrencyField';
import { AutoincrementField } from './number/AutoincrementField';
import { NumberField } from './number/NumberField';
import { RangeIntField } from './number/RangeIntField';
import { RangeFloatField } from './number/RangeFloatField';

// Selection fields
import { BoolField } from './selection/BoolField';
import { EnumField } from './selection/EnumField';
import { MultiEnumField } from './selection/MultiEnumField';
import { ChecklistField } from './selection/ChecklistField';
import { ArrayField } from './selection/ArrayField';

// Date fields
import { DateField } from './date/DateField';
import { DateTimeField } from './date/DateTimeField';
import { DurationField } from './date/DurationField';

// Relation fields
import { LinkField } from './relation/LinkField';
import { LinkMultipleField } from './relation/LinkMultipleField';
import { LinkParentField } from './relation/LinkParentField';
import { ForeignField } from './relation/ForeignField';

// File fields
import { FileField } from './file/FileField';
import { ImageField } from './file/ImageField';
import { AttachmentMultipleField } from './file/AttachmentMultipleField';

// Special fields
import { EmailField } from './special/EmailField';
import { PhoneField } from './special/PhoneField';
import { AddressField } from './special/AddressField';
import { PersonNameField } from './special/PersonNameField';
import { ColorPickerField } from './special/ColorPickerField';
import { MapField } from './special/MapField';
import { BarcodeField } from './special/BarcodeField';
import { FormulaField } from './special/FormulaField';
import { JsonArrayField } from './special/JsonArrayField';
import { JsonObjectField } from './special/JsonObjectField';

// Register all field types
export function initializeFieldTypes(): void {
  // Text types
  registerField('varchar', VarcharField);
  registerField('text', TextField);
  registerField('url', UrlField);
  registerField('wysiwyg', WysiwygField);
  registerField('password', PasswordField);
  registerField('urlMultiple', UrlMultipleField);

  // Number types
  registerField('int', IntField);
  registerField('float', FloatField);
  registerField('currency', CurrencyField);
  registerField('currencyConverted', CurrencyField);
  registerField('autoincrement', AutoincrementField);
  registerField('number', NumberField);
  registerField('rangeInt', RangeIntField);
  registerField('rangeFloat', RangeFloatField);

  // Selection types
  registerField('bool', BoolField);
  registerField('enum', EnumField);
  registerField('multiEnum', MultiEnumField);
  registerField('array', ArrayField);
  registerField('checklist', ChecklistField);

  // Date types
  registerField('date', DateField);
  registerField('datetime', DateTimeField);
  registerField('datetimeOptional', DateTimeField);
  registerField('duration', DurationField);

  // Relation types
  registerField('link', LinkField);
  registerField('linkMultiple', LinkMultipleField);
  registerField('linkParent', LinkParentField);
  registerField('linkOne', LinkField);
  registerField('foreign', ForeignField);

  // File types
  registerField('file', FileField);
  registerField('image', ImageField);
  registerField('attachmentMultiple', AttachmentMultipleField);
  registerField('attachment', FileField);

  // Special types
  registerField('email', EmailField);
  registerField('phone', PhoneField);
  registerField('address', AddressField);
  registerField('personName', PersonNameField);
  registerField('colorpicker', ColorPickerField);
  registerField('map', MapField);
  registerField('barcode', BarcodeField);
  registerField('formula', FormulaField);
  registerField('jsonArray', JsonArrayField);
  registerField('jsonObject', JsonObjectField);

  // System types (fallback to simple display)
  registerField('id', VarcharField);
  registerField('base', VarcharField);
}

// Export components and types
export { FieldRenderer, MemoizedFieldRenderer } from './FieldRenderer';
export type { FieldRendererProps } from './FieldRenderer';
export { registerField, getFieldComponent, hasFieldType, getRegisteredTypes } from './registry';
export type { FieldProps, FieldMode, FieldDef, FieldComponent, LinkValue, CurrencyValue, AddressValue } from './types';

// Export individual field components - Text
export { VarcharField } from './text/VarcharField';
export { TextField } from './text/TextField';
export { UrlField } from './text/UrlField';
export { WysiwygField } from './text/WysiwygField';
export { PasswordField } from './text/PasswordField';
export { UrlMultipleField } from './text/UrlMultipleField';

// Export individual field components - Number
export { IntField } from './number/IntField';
export { FloatField } from './number/FloatField';
export { CurrencyField } from './number/CurrencyField';
export { AutoincrementField } from './number/AutoincrementField';
export { NumberField } from './number/NumberField';
export { RangeIntField } from './number/RangeIntField';
export { RangeFloatField } from './number/RangeFloatField';

// Export individual field components - Selection
export { BoolField } from './selection/BoolField';
export { EnumField } from './selection/EnumField';
export { MultiEnumField } from './selection/MultiEnumField';
export { ChecklistField } from './selection/ChecklistField';
export { ArrayField } from './selection/ArrayField';

// Export individual field components - Date
export { DateField } from './date/DateField';
export { DateTimeField } from './date/DateTimeField';
export { DurationField } from './date/DurationField';

// Export individual field components - Relation
export { LinkField } from './relation/LinkField';
export { LinkMultipleField } from './relation/LinkMultipleField';
export { LinkParentField } from './relation/LinkParentField';
export { ForeignField } from './relation/ForeignField';

// Export individual field components - File
export { FileField } from './file/FileField';
export { ImageField } from './file/ImageField';
export { AttachmentMultipleField } from './file/AttachmentMultipleField';

// Export individual field components - Special
export { EmailField } from './special/EmailField';
export { PhoneField } from './special/PhoneField';
export { AddressField } from './special/AddressField';
export { PersonNameField } from './special/PersonNameField';
export { ColorPickerField } from './special/ColorPickerField';
export { MapField } from './special/MapField';
export { BarcodeField } from './special/BarcodeField';
export { FormulaField } from './special/FormulaField';
export { JsonArrayField } from './special/JsonArrayField';
export { JsonObjectField } from './special/JsonObjectField';
