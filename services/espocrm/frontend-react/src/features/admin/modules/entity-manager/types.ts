/**
 * Entity Manager types
 */

export interface EntityScope {
  name: string;
  type?: string;
  module?: string;
  entity?: boolean;
  object?: boolean;
  stream?: boolean;
  streamEmailNotifications?: boolean;
  disabled?: boolean;
  tab?: boolean;
  acl?: boolean | string;
  aclPortal?: boolean | string;
  customizable?: boolean;
  isCustom?: boolean;
  notifications?: boolean;
  calendar?: boolean;
  activity?: boolean;
  activityStatusList?: string[];
  historyStatusList?: string[];
  kanban?: boolean;
  kanbanViewMode?: boolean;
  hasPersonalData?: boolean;
  color?: string;
  iconClass?: string;
  statusField?: string;
}

export interface EntityDefs {
  fields?: Record<string, FieldDef>;
  links?: Record<string, LinkDef>;
  collection?: {
    orderBy?: string;
    order?: 'asc' | 'desc';
    textFilterFields?: string[];
    fullTextSearch?: boolean;
  };
  indexes?: Record<string, IndexDef>;
}

export interface FieldDef {
  type: string;
  required?: boolean;
  readOnly?: boolean;
  notStorable?: boolean;
  view?: string;
  default?: unknown;
  maxLength?: number;
  options?: string[];
  optionsPath?: string;
  isSorted?: boolean;
  audited?: boolean;
  tooltip?: boolean;
  isCustom?: boolean;
}

export interface LinkDef {
  type: 'belongsTo' | 'hasMany' | 'hasOne' | 'belongsToParent' | 'hasChildren';
  entity?: string;
  foreign?: string;
  relationName?: string;
  isCustom?: boolean;
  layoutRelationshipsDisabled?: boolean;
}

export interface IndexDef {
  columns: string[];
  unique?: boolean;
}

export interface CreateEntityData {
  name: string;
  type: string;
  labelSingular: string;
  labelPlural: string;
  stream?: boolean;
  disabled?: boolean;
  tab?: boolean;
  acl?: boolean;
  notifications?: boolean;
  color?: string;
  iconClass?: string;
  kanban?: boolean;
  duplicateCheck?: boolean;
}

export interface UpdateEntityData {
  labelSingular?: string;
  labelPlural?: string;
  type?: string;
  stream?: boolean;
  streamEmailNotifications?: boolean;
  disabled?: boolean;
  tab?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  textFilterFields?: string[];
  fullTextSearch?: boolean;
  kanban?: boolean;
  kanbanViewMode?: boolean;
  kanbanStatusIgnoreList?: string[];
  color?: string;
  iconClass?: string;
  statusField?: string;
  duplicateCheckFieldList?: string[];
}

export interface EntityRelationship {
  name: string;
  type: string;
  entity: string;
  foreign?: string;
  foreignEntity?: string;
  linkType?: string;
  isCustom?: boolean;
}

export interface CreateRelationshipData {
  linkType: 'oneToMany' | 'manyToOne' | 'manyToMany' | 'oneToOneRight' | 'oneToOneLeft' | 'childrenToParent';
  entityForeign: string;
  link: string;
  linkForeign: string;
  label: string;
  labelForeign: string;
  relationName?: string;
  audited?: boolean;
  auditedForeign?: boolean;
  linkMultipleField?: boolean;
  linkMultipleFieldForeign?: boolean;
}

export type EntityType =
  | 'Base'
  | 'BasePlus'
  | 'Person'
  | 'Company'
  | 'CategoryTree'
  | 'Event';

export const ENTITY_TYPES: { value: EntityType; label: string; description: string }[] = [
  { value: 'Base', label: 'Base', description: 'Basic entity with minimal fields' },
  { value: 'BasePlus', label: 'Base Plus', description: 'Base with assigned user, teams, and description' },
  { value: 'Person', label: 'Person', description: 'Entity representing a person with name, email, phone' },
  { value: 'Company', label: 'Company', description: 'Entity representing an organization' },
  { value: 'CategoryTree', label: 'Category Tree', description: 'Hierarchical category structure' },
  { value: 'Event', label: 'Event', description: 'Calendar event with date/time' },
];

export const ICON_CLASSES = [
  'fas fa-user',
  'fas fa-users',
  'fas fa-building',
  'fas fa-briefcase',
  'fas fa-file',
  'fas fa-file-alt',
  'fas fa-folder',
  'fas fa-inbox',
  'fas fa-envelope',
  'fas fa-phone',
  'fas fa-calendar',
  'fas fa-clock',
  'fas fa-check',
  'fas fa-tasks',
  'fas fa-list',
  'fas fa-tag',
  'fas fa-star',
  'fas fa-heart',
  'fas fa-flag',
  'fas fa-map-marker-alt',
  'fas fa-dollar-sign',
  'fas fa-chart-bar',
  'fas fa-cog',
  'fas fa-wrench',
  'fas fa-cube',
  'fas fa-cubes',
  'fas fa-layer-group',
  'fas fa-sitemap',
  'fas fa-project-diagram',
  'fas fa-stream',
];
