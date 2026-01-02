/**
 * EntityForm - Create/Edit entity form
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Save, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ENTITY_TYPES, ICON_CLASSES } from '../types';
import type { CreateEntityData, UpdateEntityData, EntityScope } from '../types';

interface EntityFormPropsBase {
  isSubmitting?: boolean;
}

interface EntityFormPropsCreate extends EntityFormPropsBase {
  mode: 'create';
  initialData?: never;
  onSubmit: (data: CreateEntityData) => Promise<void>;
}

interface EntityFormPropsEdit extends EntityFormPropsBase {
  mode: 'edit';
  initialData: EntityScope & { name: string };
  onSubmit: (data: UpdateEntityData) => Promise<void>;
}

type EntityFormProps = EntityFormPropsCreate | EntityFormPropsEdit;

export function EntityForm({ mode, initialData, onSubmit, isSubmitting }: EntityFormProps): React.ReactElement {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    type: initialData?.type ?? 'Base',
    labelSingular: '',
    labelPlural: '',
    stream: initialData?.stream ?? false,
    disabled: initialData?.disabled ?? false,
    tab: initialData?.tab ?? true,
    notifications: initialData?.notifications ?? false,
    kanban: initialData?.kanban ?? false,
    color: initialData?.color ?? '',
    iconClass: initialData?.iconClass ?? '',
    duplicateCheck: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'create') {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (!/^[A-Z][a-zA-Z0-9]*$/.test(formData.name)) {
        newErrors.name = 'Name must start with uppercase letter and contain only alphanumeric characters';
      }
      if (!formData.labelSingular.trim()) {
        newErrors.labelSingular = 'Singular label is required';
      }
      if (!formData.labelPlural.trim()) {
        newErrors.labelPlural = 'Plural label is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (mode === 'create') {
      await onSubmit({
        name: formData.name,
        type: formData.type,
        labelSingular: formData.labelSingular,
        labelPlural: formData.labelPlural,
        stream: formData.stream,
        disabled: formData.disabled,
        tab: formData.tab,
        notifications: formData.notifications,
        kanban: formData.kanban,
        color: formData.color || undefined,
        iconClass: formData.iconClass || undefined,
        duplicateCheck: formData.duplicateCheck,
      } as CreateEntityData);
    } else {
      await onSubmit({
        type: formData.type,
        stream: formData.stream,
        disabled: formData.disabled,
        tab: formData.tab,
        kanban: formData.kanban,
        color: formData.color || undefined,
        iconClass: formData.iconClass || undefined,
      } as UpdateEntityData);
    }
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/Admin/entityManager')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {mode === 'create' ? 'Create Entity' : `Edit ${initialData?.name}`}
          </h1>
          <p className="text-sm text-gray-500">
            {mode === 'create'
              ? 'Create a new custom entity type'
              : 'Modify entity properties and settings'}
          </p>
        </div>
      </div>

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
                  placeholder="MyEntity"
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Must start with uppercase letter, alphanumeric only
                </p>
              </div>
            )}

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ENTITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {ENTITY_TYPES.find((t) => t.value === formData.type)?.description}
              </p>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <select
                value={formData.iconClass}
                onChange={(e) => handleChange('iconClass', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No icon</option>
                {ICON_CLASSES.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon.replace('fas fa-', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Labels (create only) */}
            {mode === 'create' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Singular Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.labelSingular}
                    onChange={(e) => handleChange('labelSingular', e.target.value)}
                    placeholder="My Entity"
                    className={cn(
                      'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.labelSingular ? 'border-red-500' : 'border-gray-300'
                    )}
                  />
                  {errors.labelSingular && (
                    <p className="mt-1 text-sm text-red-500">{errors.labelSingular}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plural Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.labelPlural}
                    onChange={(e) => handleChange('labelPlural', e.target.value)}
                    placeholder="My Entities"
                    className={cn(
                      'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.labelPlural ? 'border-red-500' : 'border-gray-300'
                    )}
                  />
                  {errors.labelPlural && (
                    <p className="mt-1 text-sm text-red-500">{errors.labelPlural}</p>
                  )}
                </div>
              </>
            )}

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color || '#3b82f6'}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.color && (
                  <button
                    type="button"
                    onClick={() => handleChange('color', '')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.stream}
                onChange={(e) => handleChange('stream', e.target.checked)}
                className="rounded border-gray-300"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Stream</span>
                <p className="text-xs text-gray-500">Enable activity stream for this entity</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.tab}
                onChange={(e) => handleChange('tab', e.target.checked)}
                className="rounded border-gray-300"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Tab</span>
                <p className="text-xs text-gray-500">Show in navigation tabs</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.kanban}
                onChange={(e) => handleChange('kanban', e.target.checked)}
                className="rounded border-gray-300"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Kanban</span>
                <p className="text-xs text-gray-500">Enable Kanban board view</p>
              </div>
            </label>

            {mode === 'create' && (
              <>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications}
                    onChange={(e) => handleChange('notifications', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Notifications</span>
                    <p className="text-xs text-gray-500">Enable notifications for changes</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.duplicateCheck}
                    onChange={(e) => handleChange('duplicateCheck', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Duplicate Check</span>
                    <p className="text-xs text-gray-500">Check for duplicates when creating</p>
                  </div>
                </label>
              </>
            )}

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.disabled}
                onChange={(e) => handleChange('disabled', e.target.checked)}
                className="rounded border-gray-300"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Disabled</span>
                <p className="text-xs text-gray-500">Hide this entity from the system</p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/Admin/entityManager')}
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
            {mode === 'create' ? 'Create Entity' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EntityForm;
