import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  Plus,
} from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { FieldDef } from '@/fields/types';

interface AdvancedSearchProps {
  entityType: string;
  /** Current filters */
  filters: SearchFilter[];
  /** Callback when filters change */
  onFiltersChange: (filters: SearchFilter[]) => void;
  /** Current text search */
  textFilter?: string;
  /** Callback when text search changes */
  onTextFilterChange?: (text: string) => void;
  className?: string;
}

export interface SearchFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
}

type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEquals'
  | 'lessThanOrEquals'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isTrue'
  | 'isFalse'
  | 'today'
  | 'past'
  | 'future'
  | 'lastSevenDays'
  | 'lastXDays'
  | 'nextXDays'
  | 'currentMonth'
  | 'lastMonth'
  | 'currentYear';

interface OperatorDef {
  label: string;
  needsValue: boolean;
  valueType?: 'text' | 'number' | 'date' | 'select' | 'multiselect';
}

const OPERATORS: Record<string, OperatorDef> = {
  equals: { label: 'equals', needsValue: true },
  notEquals: { label: 'not equals', needsValue: true },
  isEmpty: { label: 'is empty', needsValue: false },
  isNotEmpty: { label: 'is not empty', needsValue: false },
  contains: { label: 'contains', needsValue: true, valueType: 'text' },
  notContains: { label: 'does not contain', needsValue: true, valueType: 'text' },
  startsWith: { label: 'starts with', needsValue: true, valueType: 'text' },
  endsWith: { label: 'ends with', needsValue: true, valueType: 'text' },
  greaterThan: { label: 'greater than', needsValue: true, valueType: 'number' },
  lessThan: { label: 'less than', needsValue: true, valueType: 'number' },
  greaterThanOrEquals: { label: 'greater than or equals', needsValue: true, valueType: 'number' },
  lessThanOrEquals: { label: 'less than or equals', needsValue: true, valueType: 'number' },
  in: { label: 'any of', needsValue: true, valueType: 'multiselect' },
  notIn: { label: 'none of', needsValue: true, valueType: 'multiselect' },
  isTrue: { label: 'is true', needsValue: false },
  isFalse: { label: 'is false', needsValue: false },
  today: { label: 'today', needsValue: false },
  past: { label: 'in past', needsValue: false },
  future: { label: 'in future', needsValue: false },
  lastSevenDays: { label: 'last 7 days', needsValue: false },
  currentMonth: { label: 'current month', needsValue: false },
  lastMonth: { label: 'last month', needsValue: false },
  currentYear: { label: 'current year', needsValue: false },
};

const FIELD_TYPE_OPERATORS: Record<string, FilterOperator[]> = {
  varchar: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'contains', 'notContains', 'startsWith', 'endsWith'],
  text: ['contains', 'notContains', 'isEmpty', 'isNotEmpty'],
  int: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'greaterThan', 'lessThan', 'greaterThanOrEquals', 'lessThanOrEquals'],
  float: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'greaterThan', 'lessThan', 'greaterThanOrEquals', 'lessThanOrEquals'],
  bool: ['isTrue', 'isFalse'],
  date: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'today', 'past', 'future', 'lastSevenDays', 'currentMonth', 'lastMonth', 'currentYear'],
  datetime: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'today', 'past', 'future', 'lastSevenDays', 'currentMonth', 'lastMonth', 'currentYear'],
  enum: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'in', 'notIn'],
  multiEnum: ['in', 'notIn', 'isEmpty', 'isNotEmpty'],
  link: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty'],
};

export function AdvancedSearch({
  entityType,
  filters,
  onFiltersChange,
  textFilter = '',
  onTextFilterChange,
  className,
}: AdvancedSearchProps): React.ReactElement {
  const { metadata } = useMetadata();
  const [showFilters, setShowFilters] = useState(filters.length > 0);

  // Get searchable fields from metadata
  const searchableFields = useMemo(() => {
    const fieldDefs = metadata?.entityDefs?.[entityType]?.fields ?? {};
    const result: Array<{ name: string; def: FieldDef }> = [];

    for (const [name, def] of Object.entries(fieldDefs)) {
      const fieldDef = def as FieldDef & { layoutSearchDisabled?: boolean };

      // Skip fields that are disabled for search
      if (fieldDef.layoutSearchDisabled) continue;
      if (fieldDef.disabled) continue;

      // Skip certain field types
      const skipTypes = ['map', 'file', 'image', 'attachmentMultiple', 'wysiwyg'];
      if (skipTypes.includes(fieldDef.type)) continue;

      result.push({ name, def: fieldDef });
    }

    // Sort by name
    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [metadata, entityType]);

  // Add new filter
  const addFilter = useCallback(() => {
    const firstField = searchableFields[0];
    if (!firstField) return;

    const operators = getOperatorsForField(firstField.def.type);
    const firstOperator = operators[0];
    if (!firstOperator) return;

    const newFilter: SearchFilter = {
      id: crypto.randomUUID(),
      field: firstField.name,
      operator: firstOperator,
      value: null,
    };

    onFiltersChange([...filters, newFilter]);
  }, [searchableFields, filters, onFiltersChange]);

  // Update filter
  const updateFilter = useCallback(
    (id: string, updates: Partial<SearchFilter>) => {
      onFiltersChange(
        filters.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    [filters, onFiltersChange]
  );

  // Remove filter
  const removeFilter = useCallback(
    (id: string) => {
      onFiltersChange(filters.filter((f) => f.id !== id));
    },
    [filters, onFiltersChange]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    onFiltersChange([]);
    onTextFilterChange?.('');
  }, [onFiltersChange, onTextFilterChange]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={textFilter}
            onChange={(e) => onTextFilterChange?.(e.target.value)}
            placeholder={`Search ${entityType}...`}
            className="w-full h-10 pl-10 pr-4 rounded-md border bg-background"
          />
        </div>

        <Button
          variant={showFilters || filters.length > 0 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {filters.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary rounded-full">
              {filters.length}
            </span>
          )}
        </Button>

        {(filters.length > 0 || textFilter) && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter builder */}
      {showFilters && (
        <div className="rounded-lg border p-4 space-y-3">
          {filters.map((filter) => (
            <FilterRow
              key={filter.id}
              filter={filter}
              fields={searchableFields}
              onUpdate={(updates) => updateFilter(filter.id, updates)}
              onRemove={() => removeFilter(filter.id)}
            />
          ))}

          <Button variant="outline" size="sm" onClick={addFilter}>
            <Plus className="h-4 w-4 mr-2" />
            Add filter
          </Button>
        </div>
      )}
    </div>
  );
}

interface FilterRowProps {
  filter: SearchFilter;
  fields: Array<{ name: string; def: FieldDef }>;
  onUpdate: (updates: Partial<SearchFilter>) => void;
  onRemove: () => void;
}

function FilterRow({
  filter,
  fields,
  onUpdate,
  onRemove,
}: FilterRowProps): React.ReactElement {
  const fieldDef = fields.find((f) => f.name === filter.field)?.def;
  const fieldType = fieldDef?.type ?? 'varchar';
  const operators = getOperatorsForField(fieldType);
  const operatorDef = OPERATORS[filter.operator];

  return (
    <div className="flex items-center gap-2">
      {/* Field selector */}
      <select
        value={filter.field}
        onChange={(e) => {
          const newField = fields.find((f) => f.name === e.target.value);
          const newOperators = getOperatorsForField(newField?.def.type ?? 'varchar');
          onUpdate({
            field: e.target.value,
            operator: newOperators[0],
            value: null,
          });
        }}
        className="h-9 px-3 rounded-md border bg-background text-sm min-w-[150px]"
      >
        {fields.map((field) => (
          <option key={field.name} value={field.name}>
            {formatFieldName(field.name)}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={filter.operator}
        onChange={(e) => onUpdate({ operator: e.target.value as FilterOperator })}
        className="h-9 px-3 rounded-md border bg-background text-sm min-w-[150px]"
      >
        {operators.map((op) => (
          <option key={op} value={op}>
            {OPERATORS[op]?.label ?? op}
          </option>
        ))}
      </select>

      {/* Value input */}
      {operatorDef?.needsValue && (
        <FilterValueInput
          filter={filter}
          fieldDef={fieldDef}
          onUpdate={onUpdate}
        />
      )}

      {/* Remove button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-9 w-9 p-0 text-destructive hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface FilterValueInputProps {
  filter: SearchFilter;
  fieldDef?: FieldDef;
  onUpdate: (updates: Partial<SearchFilter>) => void;
}

function FilterValueInput({
  filter,
  fieldDef,
  onUpdate,
}: FilterValueInputProps): React.ReactElement {
  const fieldType = fieldDef?.type ?? 'varchar';

  // Enum field - show select
  if (fieldType === 'enum' && fieldDef?.options) {
    return (
      <select
        value={String(filter.value ?? '')}
        onChange={(e) => onUpdate({ value: e.target.value })}
        className="h-9 px-3 rounded-md border bg-background text-sm min-w-[150px]"
      >
        <option value="">Select...</option>
        {fieldDef.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  // Boolean field
  if (fieldType === 'bool') {
    return (
      <select
        value={String(filter.value ?? '')}
        onChange={(e) => onUpdate({ value: e.target.value === 'true' })}
        className="h-9 px-3 rounded-md border bg-background text-sm min-w-[100px]"
      >
        <option value="">Select...</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  // Date field
  if (fieldType === 'date' || fieldType === 'datetime') {
    return (
      <input
        type="date"
        value={String(filter.value ?? '')}
        onChange={(e) => onUpdate({ value: e.target.value })}
        className="h-9 px-3 rounded-md border bg-background text-sm"
      />
    );
  }

  // Number field
  if (fieldType === 'int' || fieldType === 'float') {
    return (
      <input
        type="number"
        value={String(filter.value ?? '')}
        onChange={(e) => onUpdate({ value: e.target.value ? Number(e.target.value) : null })}
        className="h-9 px-3 rounded-md border bg-background text-sm min-w-[100px]"
        placeholder="Value"
      />
    );
  }

  // Default text input
  return (
    <input
      type="text"
      value={String(filter.value ?? '')}
      onChange={(e) => onUpdate({ value: e.target.value })}
      className="h-9 px-3 rounded-md border bg-background text-sm min-w-[150px]"
      placeholder="Value"
    />
  );
}

function getOperatorsForField(fieldType: string): FilterOperator[] {
  return FIELD_TYPE_OPERATORS[fieldType] ?? FIELD_TYPE_OPERATORS.varchar ?? ['equals'];
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Convert filters to EspoCRM API where clause
 */
export function filtersToWhereClause(filters: SearchFilter[]): unknown[] {
  return filters.map((filter) => ({
    type: filter.operator,
    attribute: filter.field,
    value: filter.value,
  }));
}

export default AdvancedSearch;
