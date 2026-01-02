/**
 * View components for entity detail pages
 */

// Base side panel components
export {
  SidePanel,
  PanelEmptyState,
  PanelItem,
  type SidePanelProps,
  type PanelItemProps,
} from './SidePanel';

// Activity/History side panels
export { ActivitiesPanel, type ActivitiesPanelProps } from './ActivitiesPanel';
export { HistoryPanel, type HistoryPanelProps } from './HistoryPanel';
export {
  RelatedPanel,
  ContactsPanel,
  OpportunitiesPanel,
  DocumentsPanel,
  type RelatedPanelProps,
} from './RelatedPanel';

// Existing relationship panels
export { RelationshipPanel, RelationshipPanels } from './RelationshipPanel';

// Other views
export { StreamFeed } from './StreamFeed';
export { KanbanBoard } from './KanbanBoard';
export { CalendarView } from './CalendarView';
