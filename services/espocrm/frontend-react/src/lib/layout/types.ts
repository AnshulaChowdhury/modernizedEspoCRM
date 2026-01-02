/**
 * Layout system types
 *
 * These types match the EspoCRM layout JSON structure
 */

import { z } from 'zod';

/**
 * Cell in a detail layout row
 */
export const LayoutCellSchema = z.union([
  z.literal(false), // Empty cell placeholder
  z.object({
    name: z.string(), // Field name
    fullWidth: z.boolean().optional(), // Span full row
    span: z.number().min(1).max(4).optional(), // Column span
    view: z.string().optional(), // Custom view
    type: z.string().optional(), // Override field type
    readOnly: z.boolean().optional(),
    inlineEditDisabled: z.boolean().optional(),
    label: z.string().optional(), // Custom label (translatable)
    labelText: z.string().optional(), // Custom label (not translatable)
    noLabel: z.boolean().optional(), // Hide label
    params: z.record(z.unknown()).optional(), // Field params override
    options: z.record(z.unknown()).optional(), // View options
    customCode: z.string().optional(), // Custom HTML/code
  }),
]);

export type LayoutCell = z.infer<typeof LayoutCellSchema>;

/**
 * Row in a detail layout panel
 */
export type LayoutRow = LayoutCell[];

/**
 * Panel in a detail layout
 */
export const LayoutPanelSchema = z.object({
  label: z.string().optional(), // Panel title
  customLabel: z.string().optional(), // Non-translatable label
  name: z.string().optional(), // Panel identifier
  style: z.enum(['default', 'success', 'danger', 'warning', 'info']).optional(),
  rows: z.array(z.array(LayoutCellSchema)).optional(),
  columns: z.array(z.array(LayoutCellSchema)).optional(), // Alternative to rows
  tabBreak: z.boolean().optional(), // Start new tab
  tabLabel: z.string().optional(), // Tab label
  hidden: z.boolean().optional(), // Initially hidden
  noteText: z.string().optional(), // Panel note
  noteStyle: z.string().optional(),
  dynamicLogicVisible: z.record(z.unknown()).optional(),
  dynamicLogicStyled: z.record(z.unknown()).optional(),
});

export type LayoutPanel = z.infer<typeof LayoutPanelSchema>;

/**
 * Full detail layout
 */
export type DetailLayout = LayoutPanel[];

/**
 * List layout column
 */
export const ListColumnSchema = z.object({
  name: z.string(),
  link: z.boolean().optional(), // Make clickable
  width: z.number().optional(), // Column width percentage
  hidden: z.boolean().optional(),
  notSortable: z.boolean().optional(),
  align: z.enum(['left', 'right', 'center']).optional(),
  className: z.string().optional(),
});

export type ListColumn = z.infer<typeof ListColumnSchema>;

/**
 * Full list layout
 */
export type ListLayout = ListColumn[];

/**
 * Parsed layout for internal use
 */
export interface ParsedLayoutPanel {
  name: string;
  label: string;
  style: 'default' | 'success' | 'danger' | 'warning' | 'info';
  rows: ParsedLayoutRow[];
  tabNumber?: number;
  tabLabel?: string;
  hidden?: boolean;
}

export interface ParsedLayoutRow {
  cells: ParsedLayoutCell[];
}

export interface ParsedLayoutCell {
  name: string;
  span: number;
  fullWidth: boolean;
  readOnly?: boolean;
  label?: string;
  noLabel?: boolean;
  customParams?: Record<string, unknown>;
}
