/**
 * Extension/Module Registry
 *
 * Provides a centralized registry for custom modules to register their
 * components, field types, views, and other customizations.
 *
 * This enables EspoCRM custom modules (from custom/Espo/Modules/) to
 * extend the React frontend with their own functionality.
 */

import type { ComponentType, LazyExoticComponent } from 'react';
import type { FieldComponent } from '@/fields/types';

/**
 * Custom view configuration for entity-specific views
 */
export interface ViewConfig {
  /** Component to render */
  component: ComponentType<ViewProps> | LazyExoticComponent<ComponentType<ViewProps>>;
  /** View type (detail, list, edit, etc.) */
  type: 'detail' | 'list' | 'edit' | 'listSmall' | 'detailSmall' | 'kanban' | 'calendar';
  /** Priority for view selection (higher wins) */
  priority?: number;
}

/**
 * Props passed to custom views
 */
export interface ViewProps {
  entityType: string;
  recordId?: string;
  data?: Record<string, unknown>;
  mode?: string;
}

/**
 * Custom action handler
 */
export interface ActionHandler {
  /** Label for the action button */
  label: string;
  /** Handler function */
  handler: (params: ActionHandlerParams) => void | Promise<void>;
  /** Whether to show in list mass actions */
  showInList?: boolean;
  /** Whether to show in detail view */
  showInDetail?: boolean;
  /** ACL action required */
  acl?: string;
  /** Icon name (lucide icon) */
  icon?: string;
}

export interface ActionHandlerParams {
  entityType: string;
  recordId?: string;
  recordIds?: string[];
  data?: Record<string, unknown>;
}

/**
 * Module definition for registration
 */
export interface ModuleDefinition {
  /** Module name (must match backend module name) */
  name: string;
  /** Module version */
  version?: string;
  /** Initialize function called on module load */
  initialize?: () => void | Promise<void>;
  /** Custom field types to register */
  fieldTypes?: Record<string, FieldComponent>;
  /** Custom views by entity type */
  views?: Record<string, ViewConfig[]>;
  /** Custom actions by entity type */
  actions?: Record<string, ActionHandler[]>;
  /** Custom dashlets */
  dashlets?: Record<string, DashletConfig>;
  /** Custom sidebar panels */
  sidebarPanels?: Record<string, SidebarPanelConfig>;
}

/**
 * Dashlet configuration
 */
export interface DashletConfig {
  /** Dashlet display name */
  label: string;
  /** Component to render */
  component: ComponentType<DashletProps> | LazyExoticComponent<ComponentType<DashletProps>>;
  /** Default options */
  options?: Record<string, unknown>;
}

export interface DashletProps {
  options?: Record<string, unknown>;
}

/**
 * Sidebar panel configuration
 */
export interface SidebarPanelConfig {
  /** Panel display name */
  label: string;
  /** Component to render */
  component: ComponentType<SidebarPanelProps> | LazyExoticComponent<ComponentType<SidebarPanelProps>>;
  /** Entity types this panel applies to (empty = all) */
  entityTypes?: string[];
  /** Order in sidebar */
  order?: number;
}

export interface SidebarPanelProps {
  entityType: string;
  recordId: string;
  data?: Record<string, unknown>;
}

// Internal registries
const moduleRegistry = new Map<string, ModuleDefinition>();
const viewRegistry = new Map<string, ViewConfig[]>();
const actionRegistry = new Map<string, ActionHandler[]>();
const dashletRegistry = new Map<string, DashletConfig>();
const sidebarPanelRegistry = new Map<string, SidebarPanelConfig>();

/**
 * Register a custom module
 */
export async function registerModule(module: ModuleDefinition): Promise<void> {
  if (moduleRegistry.has(module.name)) {
    console.warn(`Module "${module.name}" is already registered, updating...`);
  }

  moduleRegistry.set(module.name, module);

  // Register field types
  if (module.fieldTypes) {
    const { registerField } = await import('@/fields/registry');
    for (const [type, component] of Object.entries(module.fieldTypes)) {
      registerField(type, component);
    }
  }

  // Register views
  if (module.views) {
    for (const [entityType, views] of Object.entries(module.views)) {
      const key = entityType;
      const existing = viewRegistry.get(key) ?? [];
      viewRegistry.set(key, [...existing, ...views]);
    }
  }

  // Register actions
  if (module.actions) {
    for (const [entityType, actions] of Object.entries(module.actions)) {
      const existing = actionRegistry.get(entityType) ?? [];
      actionRegistry.set(entityType, [...existing, ...actions]);
    }
  }

  // Register dashlets
  if (module.dashlets) {
    for (const [name, config] of Object.entries(module.dashlets)) {
      dashletRegistry.set(`${module.name}:${name}`, config);
    }
  }

  // Register sidebar panels
  if (module.sidebarPanels) {
    for (const [name, config] of Object.entries(module.sidebarPanels)) {
      sidebarPanelRegistry.set(`${module.name}:${name}`, config);
    }
  }

  // Call module initializer
  if (module.initialize) {
    await module.initialize();
  }
}

/**
 * Get a custom view for an entity type
 */
export function getCustomView(
  entityType: string,
  viewType: ViewConfig['type']
): ViewConfig | undefined {
  const views = viewRegistry.get(entityType) ?? [];
  const matching = views
    .filter((v) => v.type === viewType)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return matching[0];
}

/**
 * Get custom actions for an entity type
 */
export function getCustomActions(entityType: string): ActionHandler[] {
  return actionRegistry.get(entityType) ?? [];
}

/**
 * Get all registered dashlets
 */
export function getDashlets(): Map<string, DashletConfig> {
  return new Map(dashletRegistry);
}

/**
 * Get sidebar panels for an entity type
 */
export function getSidebarPanels(entityType: string): SidebarPanelConfig[] {
  const panels: SidebarPanelConfig[] = [];
  for (const config of sidebarPanelRegistry.values()) {
    if (!config.entityTypes || config.entityTypes.includes(entityType)) {
      panels.push(config);
    }
  }
  return panels.sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
}

/**
 * Check if a module is registered
 */
export function isModuleRegistered(name: string): boolean {
  return moduleRegistry.has(name);
}

/**
 * Get a registered module
 */
export function getModule(name: string): ModuleDefinition | undefined {
  return moduleRegistry.get(name);
}

/**
 * Get all registered modules
 */
export function getRegisteredModules(): ModuleDefinition[] {
  return Array.from(moduleRegistry.values());
}

/**
 * Unregister a module (for testing/hot-reloading)
 */
export function unregisterModule(name: string): void {
  const module = moduleRegistry.get(name);
  if (!module) return;

  // Clean up views
  if (module.views) {
    for (const entityType of Object.keys(module.views)) {
      viewRegistry.delete(entityType);
    }
  }

  // Clean up actions
  if (module.actions) {
    for (const entityType of Object.keys(module.actions)) {
      actionRegistry.delete(entityType);
    }
  }

  // Clean up dashlets
  if (module.dashlets) {
    for (const name of Object.keys(module.dashlets)) {
      dashletRegistry.delete(`${module.name}:${name}`);
    }
  }

  // Clean up sidebar panels
  if (module.sidebarPanels) {
    for (const panelName of Object.keys(module.sidebarPanels)) {
      sidebarPanelRegistry.delete(`${module.name}:${panelName}`);
    }
  }

  moduleRegistry.delete(name);
}

/**
 * Clear all registries (for testing)
 */
export function clearAllRegistries(): void {
  moduleRegistry.clear();
  viewRegistry.clear();
  actionRegistry.clear();
  dashletRegistry.clear();
  sidebarPanelRegistry.clear();
}
