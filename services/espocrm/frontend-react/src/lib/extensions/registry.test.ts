/**
 * Extension Registry Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
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
  type ModuleDefinition,
} from './registry';

// Mock the field registry
vi.mock('@/fields/registry', () => ({
  registerField: vi.fn(),
}));

describe('Extension Registry', () => {
  beforeEach(() => {
    // Clean up all registries before each test
    clearAllRegistries();
  });

  describe('registerModule', () => {
    it('registers a basic module', async () => {
      const module: ModuleDefinition = {
        name: 'TestModule',
        version: '1.0.0',
      };

      await registerModule(module);

      expect(isModuleRegistered('TestModule')).toBe(true);
      expect(getModule('TestModule')).toEqual(module);
    });

    it('calls initialize function on registration', async () => {
      const initialize = vi.fn();
      const module: ModuleDefinition = {
        name: 'InitModule',
        initialize,
      };

      await registerModule(module);

      expect(initialize).toHaveBeenCalledOnce();
    });

    it('registers custom views', async () => {
      const MockComponent = () => null;
      const module: ModuleDefinition = {
        name: 'ViewModule',
        views: {
          Account: [
            { component: MockComponent, type: 'detail', priority: 10 },
          ],
        },
      };

      await registerModule(module);

      const view = getCustomView('Account', 'detail');
      expect(view).toBeDefined();
      expect(view?.component).toBe(MockComponent);
      expect(view?.priority).toBe(10);
    });

    it('registers custom actions', async () => {
      const handler = vi.fn();
      const module: ModuleDefinition = {
        name: 'ActionModule',
        actions: {
          Contact: [
            { label: 'Test Action', handler, showInDetail: true },
          ],
        },
      };

      await registerModule(module);

      const actions = getCustomActions('Contact');
      expect(actions).toHaveLength(1);
      expect(actions[0].label).toBe('Test Action');
      expect(actions[0].handler).toBe(handler);
    });

    it('registers dashlets', async () => {
      const MockDashlet = () => null;
      const module: ModuleDefinition = {
        name: 'DashletModule',
        dashlets: {
          myDashlet: { label: 'My Dashlet', component: MockDashlet },
        },
      };

      await registerModule(module);

      const dashlets = getDashlets();
      expect(dashlets.has('DashletModule:myDashlet')).toBe(true);
      expect(dashlets.get('DashletModule:myDashlet')?.label).toBe('My Dashlet');
    });

    it('registers sidebar panels', async () => {
      const MockPanel = () => null;
      const module: ModuleDefinition = {
        name: 'PanelModule',
        sidebarPanels: {
          myPanel: {
            label: 'My Panel',
            component: MockPanel,
            entityTypes: ['Account', 'Contact'],
            order: 20,
          },
        },
      };

      await registerModule(module);

      const accountPanels = getSidebarPanels('Account');
      expect(accountPanels).toHaveLength(1);
      expect(accountPanels[0].label).toBe('My Panel');

      const leadPanels = getSidebarPanels('Lead');
      expect(leadPanels).toHaveLength(0);
    });

    it('warns when registering duplicate module', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await registerModule({ name: 'DupeModule' });
      await registerModule({ name: 'DupeModule' });

      expect(warnSpy).toHaveBeenCalledWith(
        'Module "DupeModule" is already registered, updating...'
      );

      warnSpy.mockRestore();
    });
  });

  describe('getCustomView', () => {
    it('returns undefined for non-existent entity', async () => {
      const view = getCustomView('NonExistent', 'detail');
      expect(view).toBeUndefined();
    });

    it('returns view with highest priority', async () => {
      const LowPriority = () => null;
      const HighPriority = () => null;

      await registerModule({
        name: 'LowModule',
        views: {
          Account: [{ component: LowPriority, type: 'detail', priority: 1 }],
        },
      });

      await registerModule({
        name: 'HighModule',
        views: {
          Account: [{ component: HighPriority, type: 'detail', priority: 100 }],
        },
      });

      const view = getCustomView('Account', 'detail');
      expect(view?.component).toBe(HighPriority);
    });
  });

  describe('getCustomActions', () => {
    it('returns empty array for non-existent entity', () => {
      const actions = getCustomActions('NonExistent');
      expect(actions).toEqual([]);
    });

    it('aggregates actions from multiple modules', async () => {
      await registerModule({
        name: 'Module1',
        actions: {
          Account: [{ label: 'Action 1', handler: vi.fn() }],
        },
      });

      await registerModule({
        name: 'Module2',
        actions: {
          Account: [{ label: 'Action 2', handler: vi.fn() }],
        },
      });

      const actions = getCustomActions('Account');
      expect(actions).toHaveLength(2);
      expect(actions.map((a) => a.label)).toContain('Action 1');
      expect(actions.map((a) => a.label)).toContain('Action 2');
    });
  });

  describe('getSidebarPanels', () => {
    it('returns panels matching entity type', async () => {
      const Panel1 = () => null;
      const Panel2 = () => null;

      await registerModule({
        name: 'PanelMod',
        sidebarPanels: {
          panel1: {
            label: 'Panel 1',
            component: Panel1,
            entityTypes: ['Account'],
            order: 10,
          },
          panel2: {
            label: 'Panel 2',
            component: Panel2,
            // No entityTypes = applies to all
            order: 5,
          },
        },
      });

      const accountPanels = getSidebarPanels('Account');
      expect(accountPanels).toHaveLength(2);
      // Should be sorted by order
      expect(accountPanels[0].label).toBe('Panel 2'); // order: 5
      expect(accountPanels[1].label).toBe('Panel 1'); // order: 10

      const contactPanels = getSidebarPanels('Contact');
      expect(contactPanels).toHaveLength(1);
      expect(contactPanels[0].label).toBe('Panel 2');
    });
  });

  describe('unregisterModule', () => {
    it('removes module from registry', async () => {
      await registerModule({ name: 'ToRemove' });
      expect(isModuleRegistered('ToRemove')).toBe(true);

      unregisterModule('ToRemove');
      expect(isModuleRegistered('ToRemove')).toBe(false);
    });
  });

  describe('getRegisteredModules', () => {
    it('returns all registered modules', async () => {
      await registerModule({ name: 'Module1' });
      await registerModule({ name: 'Module2' });

      const modules = getRegisteredModules();
      expect(modules).toHaveLength(2);
      expect(modules.map((m) => m.name)).toContain('Module1');
      expect(modules.map((m) => m.name)).toContain('Module2');
    });
  });
});
