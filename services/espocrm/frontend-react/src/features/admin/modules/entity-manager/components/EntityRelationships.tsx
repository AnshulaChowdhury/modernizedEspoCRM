/**
 * EntityRelationships - Manage entity relationships/links
 */
import React, { useState } from 'react';
import {
  Link2,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeftRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { EntityRelationship, CreateRelationshipData } from '../types';

interface EntityRelationshipsProps {
  scope: string;
  relationships: EntityRelationship[];
  availableEntities: string[];
  onCreate: (data: CreateRelationshipData) => Promise<void>;
  onDelete: (link: string) => Promise<void>;
  isCreating?: boolean;
  isDeleting?: boolean;
}

const LINK_TYPES = [
  { value: 'oneToMany', label: 'One-to-Many', description: 'This entity has many related records' },
  { value: 'manyToOne', label: 'Many-to-One', description: 'Many of this entity belong to one related record' },
  { value: 'manyToMany', label: 'Many-to-Many', description: 'Many-to-many relationship' },
  { value: 'oneToOneRight', label: 'One-to-One (Right)', description: 'One-to-one, foreign key on right' },
  { value: 'oneToOneLeft', label: 'One-to-One (Left)', description: 'One-to-one, foreign key on left' },
  { value: 'childrenToParent', label: 'Children-to-Parent', description: 'Hierarchical parent-child' },
];

export function EntityRelationships({
  scope,
  relationships,
  availableEntities,
  onCreate,
  onDelete,
  isCreating,
  isDeleting,
}: EntityRelationshipsProps): React.ReactElement {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    linkType: 'oneToMany' as CreateRelationshipData['linkType'],
    entityForeign: '',
    link: '',
    linkForeign: '',
    label: '',
    labelForeign: '',
    linkMultipleField: false,
    linkMultipleFieldForeign: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.entityForeign) newErrors.entityForeign = 'Related entity is required';
    if (!formData.link.trim()) newErrors.link = 'Link name is required';
    if (!formData.linkForeign.trim()) newErrors.linkForeign = 'Foreign link name is required';
    if (!formData.label.trim()) newErrors.label = 'Label is required';
    if (!formData.labelForeign.trim()) newErrors.labelForeign = 'Foreign label is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    await onCreate(formData);
    setShowCreateForm(false);
    setFormData({
      linkType: 'oneToMany',
      entityForeign: '',
      link: '',
      linkForeign: '',
      label: '',
      labelForeign: '',
      linkMultipleField: false,
      linkMultipleFieldForeign: false,
    });
  };

  const handleEntityChange = (entity: string) => {
    const linkName = entity.charAt(0).toLowerCase() + entity.slice(1) + 's';
    const linkForeignName = scope.charAt(0).toLowerCase() + scope.slice(1);
    setFormData((prev) => ({
      ...prev,
      entityForeign: entity,
      link: linkName,
      linkForeign: linkForeignName,
      label: entity + 's',
      labelForeign: scope,
    }));
  };

  const getLinkTypeIcon = (type: string) => {
    if (type === 'hasMany' || type === 'hasChildren') {
      return <ArrowRight className="h-4 w-4" />;
    }
    if (type === 'belongsTo' || type === 'belongsToParent') {
      return <ArrowRight className="h-4 w-4 rotate-180" />;
    }
    return <ArrowLeftRight className="h-4 w-4" />;
  };

  const getLinkTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hasMany: 'Has Many',
      hasOne: 'Has One',
      belongsTo: 'Belongs To',
      belongsToParent: 'Belongs To Parent',
      hasChildren: 'Has Children',
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900">Relationships</h2>
          <span className="text-sm text-gray-500">({relationships.length})</span>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
        >
          <Plus className="h-4 w-4" />
          Add Relationship
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Create New Relationship</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Type</label>
              <select
                value={formData.linkType}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkType: e.target.value as CreateRelationshipData['linkType'] }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LINK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {LINK_TYPES.find((t) => t.value === formData.linkType)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Related Entity</label>
              <select
                value={formData.entityForeign}
                onChange={(e) => handleEntityChange(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.entityForeign ? 'border-red-500' : 'border-gray-300'
                )}
              >
                <option value="">Select entity...</option>
                {availableEntities.filter((e) => e !== scope).map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
              {errors.entityForeign && (
                <p className="mt-1 text-sm text-red-500">{errors.entityForeign}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Name</label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                placeholder="contacts"
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.link ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.link && <p className="mt-1 text-sm text-red-500">{errors.link}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foreign Link Name</label>
              <input
                type="text"
                value={formData.linkForeign}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkForeign: e.target.value }))}
                placeholder="account"
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.linkForeign ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.linkForeign && (
                <p className="mt-1 text-sm text-red-500">{errors.linkForeign}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Contacts"
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.label ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.label && <p className="mt-1 text-sm text-red-500">{errors.label}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foreign Label</label>
              <input
                type="text"
                value={formData.labelForeign}
                onChange={(e) => setFormData((prev) => ({ ...prev, labelForeign: e.target.value }))}
                placeholder="Account"
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.labelForeign ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.labelForeign && (
                <p className="mt-1 text-sm text-red-500">{errors.labelForeign}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.linkMultipleField}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkMultipleField: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Link Multiple Field</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.linkMultipleFieldForeign}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkMultipleFieldForeign: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Link Multiple Field (Foreign)</span>
            </label>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md',
                isCreating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Relationship
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Relationships list */}
      <div className="divide-y divide-gray-200">
        {relationships.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No relationships defined</p>
            <p className="text-sm">Click "Add Relationship" to create one</p>
          </div>
        ) : (
          relationships.map((rel) => (
            <div key={rel.name} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded">
                  {getLinkTypeIcon(rel.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{rel.name}</span>
                    {rel.isCustom && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span>{getLinkTypeLabel(rel.type)}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-blue-600">{rel.entity}</span>
                    {rel.foreign && (
                      <>
                        <span className="text-gray-400">via</span>
                        <span>{rel.foreign}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {rel.isCustom && (
                <button
                  onClick={() => {
                    if (confirm(`Delete relationship "${rel.name}"?`)) {
                      onDelete(rel.name);
                    }
                  }}
                  disabled={isDeleting}
                  className="p-2 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EntityRelationships;
