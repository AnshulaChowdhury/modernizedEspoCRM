/**
 * Layout Manager Types
 * Based on EspoCRM Backbone layout manager structure
 */

/**
 * Available layout types
 */
export type LayoutType =
  | 'list'
  | 'detail'
  | 'listSmall'
  | 'detailSmall'
  | 'defaultSidePanel'
  | 'bottomPanelsDetail'
  | 'bottomPanelsEdit'
  | 'filters'
  | 'massUpdate'
  | 'sidePanelsDetail'
  | 'sidePanelsEdit'
  | 'sidePanelsDetailSmall'
  | 'sidePanelsEditSmall'
  | 'kanban';

/**
 * Layout type metadata for UI display
 */
export interface LayoutTypeInfo {
  type: LayoutType;
  label: string;
  category: 'list' | 'detail' | 'sidePanels' | 'other';
}

/**
 * Default layout types available for most entities
 */
export const DEFAULT_LAYOUT_TYPES: LayoutType[] = [
  'list',
  'detail',
  'listSmall',
  'detailSmall',
  'defaultSidePanel',
  'bottomPanelsDetail',
  'filters',
  'massUpdate',
  'sidePanelsDetail',
  'sidePanelsEdit',
  'sidePanelsDetailSmall',
  'sidePanelsEditSmall',
];

/**
 * List layout column definition
 */
export interface ListLayoutColumn {
  name: string;
  width?: number;
  widthPx?: number;
  link?: boolean;
  notSortable?: boolean;
  noLabel?: boolean;
  align?: 'left' | 'right' | 'center';
  view?: string;
  customLabel?: string;
  hidden?: boolean;
}

/**
 * List layout is an array of columns
 */
export type ListLayout = ListLayoutColumn[];

/**
 * Detail layout cell definition
 */
export interface DetailLayoutCell {
  name: string;
  fullWidth?: boolean;
  customLabel?: string;
  noLabel?: boolean;
  span?: number;
  view?: string;
  readOnly?: boolean;
  inlineEditDisabled?: boolean;
}

/**
 * Detail layout row (array of cells or false for empty)
 */
export type DetailLayoutRow = (DetailLayoutCell | false)[];

/**
 * Panel style options
 */
export type PanelStyle = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'primary';

/**
 * Detail layout panel definition
 */
export interface DetailLayoutPanel {
  label?: string;
  customLabel?: string;
  name?: string;
  style?: PanelStyle;
  rows: DetailLayoutRow[];
  tabBreak?: boolean;
  tabLabel?: string;
  hidden?: boolean;
  noteText?: string;
  noteStyle?: PanelStyle;
  dynamicLogicVisible?: Record<string, unknown>;
  dynamicLogicStyled?: Record<string, unknown>;
}

/**
 * Detail layout is an array of panels
 */
export type DetailLayout = DetailLayoutPanel[];

/**
 * Side panel item definition
 */
export interface SidePanelItem {
  name: string;
  view?: string;
  label?: string;
  isForm?: boolean;
  options?: Record<string, unknown>;
  sticked?: boolean;
  disabled?: boolean;
}

/**
 * Side panels layout
 */
export type SidePanelsLayout = Record<string, SidePanelItem>;

/**
 * Filters/Mass Update layout item
 */
export interface RowLayoutItem {
  name: string;
  view?: string;
}

/**
 * Filters/Mass Update layout
 */
export type RowLayout = RowLayoutItem[];

/**
 * Kanban layout definition
 */
export interface KanbanLayout {
  columns?: string[];
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Generic layout type
 */
export type Layout = ListLayout | DetailLayout | SidePanelsLayout | RowLayout | KanbanLayout;

/**
 * Field item for drag-drop palette
 */
export interface FieldItem {
  name: string;
  label: string;
  type: string;
  isEnabled: boolean;
  notSortable?: boolean;
}

/**
 * List column attribute definitions for edit dialog
 */
export const LIST_COLUMN_ATTRIBUTES = [
  'name',
  'widthComplex',
  'width',
  'widthPx',
  'link',
  'notSortable',
  'noLabel',
  'align',
  'view',
  'customLabel',
  'hidden',
] as const;

/**
 * Detail cell attribute definitions for edit dialog
 */
export const DETAIL_CELL_ATTRIBUTES = [
  'name',
  'fullWidth',
  'customLabel',
  'noLabel',
] as const;

/**
 * Panel attribute definitions for edit dialog
 */
export const PANEL_ATTRIBUTES = [
  'panelName',
  'dynamicLogicVisible',
  'style',
  'dynamicLogicStyled',
  'tabBreak',
  'tabLabel',
  'hidden',
  'noteText',
  'noteStyle',
] as const;

/**
 * Attribute definition for edit dialogs
 */
export interface AttributeDef {
  type: 'varchar' | 'bool' | 'int' | 'float' | 'enum' | 'text' | 'base';
  readOnly?: boolean;
  hidden?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  default?: unknown;
  tooltip?: string;
  translation?: string;
}

/**
 * List column attribute definitions
 */
export const LIST_ATTRIBUTE_DEFS: Record<string, AttributeDef> = {
  name: { type: 'varchar', readOnly: true },
  width: { type: 'float', min: 0, max: 100, hidden: true },
  widthPx: { type: 'int', min: 0, max: 720, hidden: true },
  link: { type: 'bool', tooltip: 'link' },
  notSortable: { type: 'bool', tooltip: 'notSortable' },
  noLabel: { type: 'bool', tooltip: 'noLabel' },
  align: { type: 'enum', options: ['left', 'right', 'center'] },
  view: { type: 'varchar', readOnly: true },
  customLabel: { type: 'varchar', readOnly: true },
  hidden: { type: 'bool' },
};

/**
 * Panel attribute definitions
 */
export const PANEL_ATTRIBUTE_DEFS: Record<string, AttributeDef> = {
  panelName: { type: 'varchar' },
  style: {
    type: 'enum',
    options: ['default', 'success', 'danger', 'warning', 'info', 'primary'],
    default: 'default',
  },
  hidden: { type: 'bool', tooltip: 'hiddenPanel' },
  tabBreak: { type: 'bool', tooltip: 'tabBreak' },
  tabLabel: { type: 'varchar' },
  noteText: { type: 'text', tooltip: 'noteText' },
  noteStyle: {
    type: 'enum',
    options: ['info', 'success', 'danger', 'warning', 'primary'],
    default: 'info',
  },
};
