/**
 * FieldForm - Create/Edit field form
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Save, Info, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getFieldType } from '../types';
import type { FieldDef, CreateFieldData, UpdateFieldData } from '../types';
import { FieldTypeSelector } from './FieldTypeSelector';
import { LinkDefaultField } from './LinkDefaultField';
import { DynamicLogicField } from '../../dynamic-logic/components/DynamicLogicField';
import type { DynamicLogicConditions } from '../../dynamic-logic/types';

interface FieldFormPropsBase {
  scope: string;
  isSubmitting?: boolean;
  foreignScope?: string | null;
}

interface FieldFormPropsCreate extends FieldFormPropsBase {
  mode: 'create';
  fieldName?: never;
  initialData?: never;
  onSubmit: (data: CreateFieldData) => Promise<void>;
}

interface FieldFormPropsEdit extends FieldFormPropsBase {
  mode: 'edit';
  fieldName: string;
  initialData: FieldDef;
  onSubmit: (data: UpdateFieldData) => Promise<void>;
}

type FieldFormProps = FieldFormPropsCreate | FieldFormPropsEdit;

export function FieldForm({
  scope,
  mode,
  fieldName,
  initialData,
  foreignScope: foreignScopeProp,
  onSubmit,
  isSubmitting,
}: FieldFormProps): React.ReactElement {
  const navigate = useNavigate();

  const [step, setStep] = useState<'type' | 'config'>(mode === 'edit' ? 'config' : 'type');
  const [selectedType, setSelectedType] = useState(initialData?.type ?? '');

  // Extract link default from defaultAttributes if present
  const getInitialLinkDefault = (): { id: string; name: string } | null => {
    const attrs = initialData?.defaultAttributes as Record<string, string> | undefined;
    if (attrs && fieldName) {
      const id = attrs[`${fieldName}Id`];
      const name = attrs[`${fieldName}Name`];
      if (id && name) {
        return { id, name };
      }
    }
    return null;
  };

  const [formData, setFormData] = useState({
    name: fieldName ?? '',
    label: '',
    tooltipText: '',
    // Common properties
    required: initialData?.required ?? false,
    audited: initialData?.audited ?? false,
    readOnly: initialData?.readOnly ?? false,
    readOnlyAfterCreate: initialData?.readOnlyAfterCreate ?? false,
    inlineEditDisabled: initialData?.inlineEditDisabled ?? false,
    disabled: initialData?.disabled ?? false,
    // Type-specific
    default: initialData?.default ?? '',
    maxLength: initialData?.maxLength ?? 255,
    min: initialData?.min ?? undefined,
    max: initialData?.max ?? undefined,
    options: initialData?.options ?? [],
    rows: initialData?.rows ?? 4,
    // Varchar specific
    pattern: initialData?.pattern ?? '',
    copyToClipboard: initialData?.copyToClipboard ?? false,
    // Enum specific
    isSorted: initialData?.isSorted ?? false,
    displayAsLabel: initialData?.displayAsLabel ?? false,
    // Number specific
    disableFormatting: initialData?.disableFormatting ?? false,
  });

  // Link default value (stored separately as defaultAttributes)
  const [linkDefault, setLinkDefault] = useState<{ id: string; name: string } | null>(getInitialLinkDefault);

  // Get foreignScope for link fields (from prop or initialData)
  const foreignScope = foreignScopeProp ?? initialData?.entity ?? null;

  // Dynamic Logic state
  const [dynamicLogic, setDynamicLogic] = useState<{
    visible: DynamicLogicConditions | null;
    required: DynamicLogicConditions | null;
    readOnly: DynamicLogicConditions | null;
  }>({
    visible: initialData?.dynamicLogicVisible ?? null,
    required: initialData?.dynamicLogicRequired ?? null,
    readOnly: initialData?.dynamicLogicReadOnly ?? null,
  });

  const [showDynamicLogic, setShowDynamicLogic] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newOption, setNewOption] = useState('');

  // Reset form when type changes in create mode
  useEffect(() => {
    if (mode === 'create' && selectedType) {
      const fieldType = getFieldType(selectedType);
      setFormData((prev) => ({
        ...prev,
        maxLength: fieldType?.type === 'varchar' ? 255 : prev.maxLength,
        rows: fieldType?.type === 'text' ? 4 : prev.rows,
      }));
    }
  }, [selectedType, mode]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'create') {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (!/^[a-z][a-zA-Z0-9]*$/.test(formData.name)) {
        newErrors.name = 'Name must start with lowercase letter and contain only alphanumeric characters';
      }
      if (!selectedType) {
        newErrors.type = 'Field type is required';
      }
    }

    if (selectedType === 'enum' || selectedType === 'multiEnum' || selectedType === 'checklist') {
      if (formData.options.length === 0) {
        newErrors.options = 'At least one option is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateFieldData | UpdateFieldData = {
      ...(mode === 'create' && { name: formData.name, type: selectedType }),
      label: formData.label || undefined,
      tooltipText: formData.tooltipText || undefined,
      required: formData.required,
      audited: formData.audited,
      readOnly: formData.readOnly,
      readOnlyAfterCreate: formData.readOnlyAfterCreate,
      inlineEditDisabled: formData.inlineEditDisabled,
    };

    // Add type-specific fields
    if (selectedType === 'varchar') {
      data.maxLength = formData.maxLength;
      if (formData.pattern) data.pattern = formData.pattern;
      data.copyToClipboard = formData.copyToClipboard;
    }
    if (selectedType === 'text' || selectedType === 'wysiwyg') {
      data.rows = formData.rows;
    }
    if (selectedType === 'int' || selectedType === 'float' || selectedType === 'currency') {
      if (formData.min !== undefined) data.min = formData.min;
      if (formData.max !== undefined) data.max = formData.max;
      data.disableFormatting = formData.disableFormatting;
    }
    if (selectedType === 'enum' || selectedType === 'multiEnum' || selectedType === 'checklist' || selectedType === 'array') {
      data.options = formData.options;
      data.isSorted = formData.isSorted;
    }
    if (selectedType === 'enum') {
      data.displayAsLabel = formData.displayAsLabel;
    }
    if (formData.default !== '' && formData.default !== undefined) {
      data.default = formData.default;
    }

    // Add link default as defaultAttributes
    if (selectedType === 'link' && fieldName) {
      if (linkDefault) {
        data.defaultAttributes = {
          [`${fieldName}Id`]: linkDefault.id,
          [`${fieldName}Name`]: linkDefault.name,
        };
      } else {
        data.defaultAttributes = null;
      }
    }

    // Add dynamic logic conditions (edit mode only)
    if (mode === 'edit') {
      if (dynamicLogic.visible) {
        data.dynamicLogicVisible = dynamicLogic.visible;
      }
      if (dynamicLogic.required) {
        data.dynamicLogicRequired = dynamicLogic.required;
      }
      if (dynamicLogic.readOnly) {
        data.dynamicLogicReadOnly = dynamicLogic.readOnly;
      }
    }

    await onSubmit(data as CreateFieldData);
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const addOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption.trim())) {
      setFormData((prev) => ({
        ...prev,
        options: [...prev.options, newOption.trim()],
      }));
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setStep('config');
  };

  const fieldType = getFieldType(selectedType);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            if (step === 'config' && mode === 'create') {
              setStep('type');
            } else {
              navigate(`/Admin/fieldManager/scope/${scope}`);
            }
          }}
          className="p-2 text-gray-400 hover:text-gray-600 rounded"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add Field' : `Edit Field: ${fieldName}`}
          </h1>
          <p className="text-sm text-gray-500">
            {scope} • {mode === 'create' ? (step === 'type' ? 'Select field type' : `Type: ${selectedType}`) : `Type: ${initialData?.type}`}
          </p>
        </div>
      </div>

      {/* Step 1: Type Selection (create only) */}
      {mode === 'create' && step === 'type' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Field Type</h2>
          <FieldTypeSelector onSelect={handleTypeSelect} selectedType={selectedType} />
        </div>
      )}

      {/* Step 2: Field Configuration */}
      {step === 'config' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name (create only) */}
              {mode === 'create' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="myField"
                    className={cn(
                      'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    )}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Must start with lowercase letter, alphanumeric only
                  </p>
                </div>
              )}

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => handleChange('label', e.target.value)}
                  placeholder="My Field"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tooltip Text */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tooltip Text</label>
                <textarea
                  value={formData.tooltipText}
                  onChange={(e) => handleChange('tooltipText', e.target.value)}
                  placeholder="Help text shown when hovering over the field"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>

              {/* Default Value - shown for applicable field types */}
              {(selectedType === 'varchar' || selectedType === 'text' || selectedType === 'int' ||
                selectedType === 'float' || selectedType === 'currency' || selectedType === 'bool' ||
                selectedType === 'date' || selectedType === 'datetime' || selectedType === 'url' ||
                selectedType === 'link') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default</label>
                  {selectedType === 'bool' ? (
                    <select
                      value={formData.default === true ? 'true' : formData.default === false ? 'false' : ''}
                      onChange={(e) => handleChange('default', e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : selectedType === 'link' ? (
                    <LinkDefaultField
                      scope={scope}
                      field={fieldName ?? ''}
                      foreignScope={foreignScope}
                      value={linkDefault}
                      onChange={setLinkDefault}
                    />
                  ) : selectedType === 'int' || selectedType === 'float' || selectedType === 'currency' ? (
                    <input
                      type="number"
                      value={formData.default as number ?? ''}
                      onChange={(e) => handleChange('default', e.target.value ? parseFloat(e.target.value) : '')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : selectedType === 'date' ? (
                    <input
                      type="date"
                      value={formData.default as string ?? ''}
                      onChange={(e) => handleChange('default', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : selectedType === 'datetime' ? (
                    <input
                      type="datetime-local"
                      value={formData.default as string ?? ''}
                      onChange={(e) => handleChange('default', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData.default as string ?? ''}
                      onChange={(e) => handleChange('default', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Type-specific options */}
          {(selectedType === 'varchar' || selectedType === 'text' || selectedType === 'wysiwyg') && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Text Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedType === 'varchar' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Length</label>
                      <input
                        type="number"
                        value={formData.maxLength}
                        onChange={(e) => handleChange('maxLength', parseInt(e.target.value) || 255)}
                        min={1}
                        max={65535}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pattern
                        <span className="ml-1 text-gray-400" title="Regular expression for validation">ⓘ</span>
                      </label>
                      <input
                        type="text"
                        value={formData.pattern}
                        onChange={(e) => handleChange('pattern', e.target.value)}
                        placeholder="e.g. ^[A-Z]{2}[0-9]{4}$"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
                {(selectedType === 'text' || selectedType === 'wysiwyg') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rows</label>
                    <input
                      type="number"
                      value={formData.rows}
                      onChange={(e) => handleChange('rows', parseInt(e.target.value) || 4)}
                      min={1}
                      max={50}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                {selectedType === 'varchar' && (
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.copyToClipboard}
                      onChange={(e) => handleChange('copyToClipboard', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Copy to Clipboard</span>
                      <p className="text-xs text-gray-500">Show copy button next to the field</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Number options */}
          {(selectedType === 'int' || selectedType === 'float' || selectedType === 'currency') && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Number Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum</label>
                  <input
                    type="number"
                    value={formData.min ?? ''}
                    onChange={(e) => handleChange('min', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum</label>
                  <input
                    type="number"
                    value={formData.max ?? ''}
                    onChange={(e) => handleChange('max', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer md:col-span-3">
                  <input
                    type="checkbox"
                    checked={formData.disableFormatting}
                    onChange={(e) => handleChange('disableFormatting', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Disable Formatting</span>
                    <p className="text-xs text-gray-500">Display number without thousand separators</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Enum/Selection options */}
          {(selectedType === 'enum' || selectedType === 'multiEnum' || selectedType === 'checklist' || selectedType === 'array') && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Options</h2>
              {errors.options && <p className="mb-2 text-sm text-red-500">{errors.options}</p>}

              <div className="space-y-2 mb-4">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="flex-1 text-sm">{option}</span>
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add option..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addOption}
                  className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Enum-specific options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSorted}
                    onChange={(e) => handleChange('isSorted', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Sort Options</span>
                    <p className="text-xs text-gray-500">Sort options alphabetically</p>
                  </div>
                </label>
                {selectedType === 'enum' && (
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.displayAsLabel}
                      onChange={(e) => handleChange('displayAsLabel', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Display as Label</span>
                      <p className="text-xs text-gray-500">Show value as colored badge</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Properties */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Properties</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.required}
                  onChange={(e) => handleChange('required', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Required</span>
                  <p className="text-xs text-gray-500">Field must have a value</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.audited}
                  onChange={(e) => handleChange('audited', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Audited</span>
                  <p className="text-xs text-gray-500">Track changes in stream</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.readOnly}
                  onChange={(e) => handleChange('readOnly', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Read-only</span>
                  <p className="text-xs text-gray-500">Cannot be edited by users</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.readOnlyAfterCreate}
                  onChange={(e) => handleChange('readOnlyAfterCreate', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Read-only After Create</span>
                  <p className="text-xs text-gray-500">Cannot be edited after record is created</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.inlineEditDisabled}
                  onChange={(e) => handleChange('inlineEditDisabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Disable Inline Edit</span>
                  <p className="text-xs text-gray-500">Prevent editing directly on detail view</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.disabled}
                  onChange={(e) => handleChange('disabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Disabled</span>
                  <p className="text-xs text-gray-500">Hide this field</p>
                </div>
              </label>
            </div>
          </div>

          {/* Dynamic Logic (edit mode only) */}
          {mode === 'edit' && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDynamicLogic(!showDynamicLogic)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="text-left">
                  <h2 className="text-lg font-medium text-gray-900">Dynamic Logic</h2>
                  <p className="text-sm text-gray-500">
                    Define conditions for visibility, required state, and read-only mode
                  </p>
                </div>
                {showDynamicLogic ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {showDynamicLogic && (
                <div className="p-6 pt-0 space-y-6 border-t border-gray-200">
                  {/* Visible conditions */}
                  <DynamicLogicField
                    scope={scope}
                    value={dynamicLogic.visible}
                    onChange={(value) => setDynamicLogic((prev) => ({ ...prev, visible: value }))}
                    label="Visible"
                    description="Conditions when this field should be visible"
                  />

                  {/* Required conditions */}
                  <DynamicLogicField
                    scope={scope}
                    value={dynamicLogic.required}
                    onChange={(value) => setDynamicLogic((prev) => ({ ...prev, required: value }))}
                    label="Required"
                    description="Conditions when this field should be required"
                  />

                  {/* Read-only conditions */}
                  <DynamicLogicField
                    scope={scope}
                    value={dynamicLogic.readOnly}
                    onChange={(value) => setDynamicLogic((prev) => ({ ...prev, readOnly: value }))}
                    label="Read-only"
                    description="Conditions when this field should be read-only"
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/Admin/fieldManager/scope/${scope}`)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mode === 'create' ? 'Create Field' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Field type info */}
      {step === 'config' && fieldType && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-1">
            {fieldType.label} Field
          </h3>
          <p className="text-sm text-blue-700">{fieldType.description}</p>
        </div>
      )}
    </div>
  );
}

export default FieldForm;
