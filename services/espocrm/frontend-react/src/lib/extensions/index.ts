/**
 * Extensions Module
 *
 * Public API for custom module and extension support.
 *
 * @example
 * // Register a custom module
 * import { registerModule } from '@/lib/extensions';
 *
 * registerModule({
 *   name: 'MyCustomModule',
 *   version: '1.0.0',
 *   fieldTypes: {
 *     myCustomField: MyCustomFieldComponent,
 *   },
 *   views: {
 *     MyEntity: [{
 *       type: 'detail',
 *       component: MyEntityDetailView,
 *       priority: 10,
 *     }],
 *   },
 *   actions: {
 *     MyEntity: [{
 *       label: 'Custom Action',
 *       handler: async ({ recordId }) => { ... },
 *       showInDetail: true,
 *     }],
 *   },
 * });
 *
 * @example
 * // Use extensions in a component
 * import { useExtensions } from '@/lib/extensions';
 *
 * function MyComponent({ entityType }) {
 *   const { actions, sidebarPanels } = useExtensions({ entityType });
 *   // ...
 * }
 */

export {
  registerModule,
  getCustomView,
  getCustomActions,
  getDashlets,
  getSidebarPanels,
  isModuleRegistered,
  getModule,
  getRegisteredModules,
  unregisterModule,
  clearAllRegistries,
} from './registry';

export { useExtensions } from './useExtensions';

export type {
  ModuleDefinition,
  ViewConfig,
  ViewProps,
  ActionHandler,
  ActionHandlerParams,
  DashletConfig,
  DashletProps,
  SidebarPanelConfig,
  SidebarPanelProps,
} from './registry';
