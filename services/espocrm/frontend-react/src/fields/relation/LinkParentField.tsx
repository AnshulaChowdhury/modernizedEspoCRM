import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { ExternalLink } from 'lucide-react';
import type { FieldProps } from '../types';
import { cn } from '@/lib/utils/cn';

interface LinkParentValue {
  parentId: string;
  parentType: string;
  parentName?: string;
}

/**
 * LinkParent field component - polymorphic link (can link to different entity types)
 * Used for fields like "parent" that can reference Account, Contact, Lead, etc.
 */
export function LinkParentField({
  name,
  value,
  fieldDef,
  mode,
  onChange,
  disabled,
  readOnly,
  record,
  className,
}: FieldProps): React.ReactElement {
  // Parse link parent value from record or value
  const parentType = (record?.[`${name}Type`] ?? (value as LinkParentValue)?.parentType ?? '') as string;
  const parentId = (record?.[`${name}Id`] ?? (value as LinkParentValue)?.parentId ?? '') as string;
  const parentName = (record?.[`${name}Name`] ?? (value as LinkParentValue)?.parentName ?? '') as string;

  const hasValue = parentId && parentType;

  // Get allowed entity types from field definition
  const entityList = (fieldDef.params?.entityList as string[]) ?? [
    'Account',
    'Contact',
    'Lead',
    'Opportunity',
  ];

  // Detail mode - display as link
  if (mode === 'detail') {
    if (!hasValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-xs text-muted-foreground bg-muted px-1 rounded">
          {parentType}
        </span>
        <Link
          to={`/${parentType}/view/${parentId}`}
          className="text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          {parentName || parentId}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  // List mode - compact display
  if (mode === 'list') {
    if (!hasValue) {
      return <span className={cn('text-muted-foreground', className)}>—</span>;
    }

    return (
      <Link
        to={`/${parentType}/view/${parentId}`}
        className={cn('text-blue-600 hover:underline', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {parentName || parentId}
      </Link>
    );
  }

  // Edit mode - entity type selector + name input
  if (mode === 'edit') {
    const handleTypeChange = (newType: string): void => {
      onChange?.({
        parentType: newType,
        parentId: '',
        parentName: '',
      });
    };

    const handleNameChange = (newName: string): void => {
      onChange?.({
        parentType,
        parentId, // In real implementation, this would be looked up
        parentName: newName,
      });
    };

    return (
      <div className={cn('flex gap-2', className)}>
        <select
          value={parentType}
          onChange={(e) => handleTypeChange(e.target.value)}
          disabled={disabled || readOnly}
          className={cn(
            'h-10 rounded-md border border-input bg-background px-3 py-2 text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'w-1/3'
          )}
        >
          <option value="">— Type —</option>
          {entityList.map((entity) => (
            <option key={entity} value={entity}>
              {entity}
            </option>
          ))}
        </select>
        <Input
          value={parentName}
          onChange={(e) => handleNameChange(e.target.value)}
          disabled={disabled || readOnly || !parentType}
          placeholder={parentType ? `Select ${parentType}...` : 'Select type first'}
          className="flex-1"
        />
        {/* In a full implementation, this would open a search modal */}
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <Input
        name={name}
        value={parentName}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search..."
        className={className}
      />
    );
  }

  return <span>{parentName || '—'}</span>;
}
