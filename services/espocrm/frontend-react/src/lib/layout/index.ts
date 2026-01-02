/**
 * Layout System
 *
 * This module provides layout rendering capabilities for EspoCRM React.
 * Layouts are JSON configurations that define how entity records are displayed.
 */

export { LayoutRenderer } from './LayoutRenderer';
export type { LayoutRendererProps } from './LayoutRenderer';

export {
  useLayout,
  useDetailLayout,
  useListLayout,
  getDefaultDetailLayout,
  getDefaultListLayout,
} from './useLayout';

export type {
  DetailLayout,
  ListLayout,
  LayoutPanel,
  LayoutCell,
  LayoutRow,
  ListColumn,
  ParsedLayoutPanel,
  ParsedLayoutRow,
  ParsedLayoutCell,
} from './types';
