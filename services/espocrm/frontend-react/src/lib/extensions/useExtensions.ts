/**
 * useExtensions Hook
 *
 * React hook for accessing extension/module functionality.
 */

import { useMemo } from 'react';
import {
  getCustomView,
  getCustomActions,
  getSidebarPanels,
  getDashlets,
  type ViewConfig,
  type ActionHandler,
  type SidebarPanelConfig,
  type DashletConfig,
} from './registry';

interface UseExtensionsOptions {
  entityType?: string;
}

interface UseExtensionsResult {
  /** Get custom view for an entity type */
  getView: (type: ViewConfig['type']) => ViewConfig | undefined;
  /** Get custom actions for the entity */
  actions: ActionHandler[];
  /** Get list actions (for mass actions) */
  listActions: ActionHandler[];
  /** Get detail actions */
  detailActions: ActionHandler[];
  /** Get sidebar panels for the entity */
  sidebarPanels: SidebarPanelConfig[];
  /** Get all dashlets */
  dashlets: Map<string, DashletConfig>;
}

/**
 * Hook to access extension functionality for a specific entity type
 */
export function useExtensions(options: UseExtensionsOptions = {}): UseExtensionsResult {
  const { entityType } = options;

  const getView = useMemo(() => {
    return (type: ViewConfig['type']): ViewConfig | undefined => {
      if (!entityType) return undefined;
      return getCustomView(entityType, type);
    };
  }, [entityType]);

  const actions = useMemo(() => {
    if (!entityType) return [];
    return getCustomActions(entityType);
  }, [entityType]);

  const listActions = useMemo(() => {
    return actions.filter((a) => a.showInList !== false);
  }, [actions]);

  const detailActions = useMemo(() => {
    return actions.filter((a) => a.showInDetail !== false);
  }, [actions]);

  const sidebarPanels = useMemo(() => {
    if (!entityType) return [];
    return getSidebarPanels(entityType);
  }, [entityType]);

  const dashlets = useMemo(() => {
    return getDashlets();
  }, []);

  return {
    getView,
    actions,
    listActions,
    detailActions,
    sidebarPanels,
    dashlets,
  };
}
