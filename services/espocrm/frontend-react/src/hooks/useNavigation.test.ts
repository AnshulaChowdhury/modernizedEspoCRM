/**
 * useNavigation Hook Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNavigation } from './useNavigation';

// Mock auth store
vi.mock('@/features/auth/store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock metadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: vi.fn(),
}));

import { useAuthStore } from '@/features/auth/store';
import { useMetadata } from '@/lib/metadata/useMetadata';

const mockUseAuthStore = vi.mocked(useAuthStore);
const mockUseMetadata = vi.mocked(useMetadata);

describe('useNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockUseAuthStore.mockReturnValue({
      settings: { tabList: [] },
      user: null,
    } as ReturnType<typeof useAuthStore>);

    mockUseMetadata.mockReturnValue({
      metadata: null,
      isLoading: false,
      error: null,
      getEntityList: () => [],
    } as ReturnType<typeof useMetadata>);
  });

  describe('default navigation', () => {
    it('should always include Dashboard as first item', () => {
      const { result } = renderHook(() => useNavigation());

      expect(result.current.navItems[0]).toEqual(
        expect.objectContaining({
          name: 'Home',
          label: 'Dashboard',
          href: '/',
        })
      );
    });

    it('should not be loading', () => {
      const { result } = renderHook(() => useNavigation());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('tabList from settings', () => {
    it('should include entities from tabList', () => {
      mockUseAuthStore.mockReturnValue({
        settings: { tabList: ['Account', 'Contact', 'Lead'] },
        user: null,
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useNavigation());

      const navNames = result.current.navItems.map((item) => item.name);
      expect(navNames).toContain('Account');
      expect(navNames).toContain('Contact');
      expect(navNames).toContain('Lead');
    });

    it('should generate correct hrefs for entities', () => {
      mockUseAuthStore.mockReturnValue({
        settings: { tabList: ['Account'] },
        user: null,
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useNavigation());

      const accountItem = result.current.navItems.find((item) => item.name === 'Account');
      expect(accountItem?.href).toBe('/Account');
    });

    it('should skip delimiter entries', () => {
      mockUseAuthStore.mockReturnValue({
        settings: { tabList: ['Account', '_delimiter_', 'Contact'] },
        user: null,
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useNavigation());

      const navNames = result.current.navItems.map((item) => item.name);
      expect(navNames).not.toContain('_delimiter_');
    });

    it('should handle divider tabs', () => {
      mockUseAuthStore.mockReturnValue({
        settings: {
          tabList: [
            'Account',
            { type: 'divider', text: '$Sales', id: 'sales-divider' },
            'Contact',
          ],
        },
        user: null,
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useNavigation());

      const dividerItem = result.current.navItems.find((item) => item.isDivider);
      expect(dividerItem).toBeDefined();
      expect(dividerItem?.label).toBe('Sales'); // $ prefix removed
    });

    it('should handle group tabs with children', () => {
      mockUseAuthStore.mockReturnValue({
        settings: {
          tabList: [
            {
              type: 'group',
              text: 'Sales',
              itemList: ['Account', 'Contact'],
              color: '#ff0000',
            },
          ],
        },
        user: null,
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useNavigation());

      const groupItem = result.current.navItems.find((item) => item.isGroup);
      expect(groupItem).toBeDefined();
      expect(groupItem?.label).toBe('Sales');
      expect(groupItem?.color).toBe('#ff0000');
      expect(groupItem?.children).toHaveLength(2);
      expect(groupItem?.children?.[0].name).toBe('Account');
    });
  });

  describe('disabled scopes', () => {
    it('should filter out disabled entities', () => {
      mockUseAuthStore.mockReturnValue({
        settings: { tabList: ['Account', 'Contact'] },
        user: null,
      } as ReturnType<typeof useAuthStore>);

      mockUseMetadata.mockReturnValue({
        metadata: {
          scopes: {
            Contact: { disabled: true },
          },
        },
        isLoading: false,
        error: null,
        getEntityList: () => [],
      } as ReturnType<typeof useMetadata>);

      const { result } = renderHook(() => useNavigation());

      const navNames = result.current.navItems.map((item) => item.name);
      expect(navNames).toContain('Account');
      expect(navNames).not.toContain('Contact');
    });
  });

  describe('fallback to metadata entities', () => {
    it('should use entity list from metadata when no settings', () => {
      mockUseAuthStore.mockReturnValue({
        settings: { tabList: [] },
        user: null,
      } as ReturnType<typeof useAuthStore>);

      mockUseMetadata.mockReturnValue({
        metadata: null,
        isLoading: false,
        error: null,
        getEntityList: () => ['Account', 'Contact', 'CustomEntity'],
      } as ReturnType<typeof useMetadata>);

      const { result } = renderHook(() => useNavigation());

      const navNames = result.current.navItems.map((item) => item.name);
      expect(navNames).toContain('Account');
      expect(navNames).toContain('Contact');
      expect(navNames).toContain('CustomEntity');
    });

    it('should prioritize common CRM entities', () => {
      mockUseAuthStore.mockReturnValue({
        settings: { tabList: [] },
        user: null,
      } as ReturnType<typeof useAuthStore>);

      mockUseMetadata.mockReturnValue({
        metadata: null,
        isLoading: false,
        error: null,
        getEntityList: () => ['CustomEntity', 'Account', 'Lead', 'Contact'],
      } as ReturnType<typeof useMetadata>);

      const { result } = renderHook(() => useNavigation());

      // Skip Dashboard (index 0)
      const entityItems = result.current.navItems.slice(1);
      const entityNames = entityItems.map((item) => item.name);

      // Priority entities should come first
      const accountIndex = entityNames.indexOf('Account');
      const contactIndex = entityNames.indexOf('Contact');
      const customIndex = entityNames.indexOf('CustomEntity');

      expect(accountIndex).toBeLessThan(customIndex);
      expect(contactIndex).toBeLessThan(customIndex);
    });
  });

  describe('admin user', () => {
    it('should add Admin nav item for admin users', () => {
      mockUseAuthStore.mockReturnValue({
        settings: { tabList: ['Account'] },
        user: { isAdmin: true, id: '1', name: 'Admin' },
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useNavigation());

      const adminItem = result.current.navItems.find((item) => item.name === 'Admin');
      expect(adminItem).toBeDefined();
      expect(adminItem?.href).toBe('/Admin');
      expect(adminItem?.label).toBe('Administration');
    });

    it('should not add Admin nav item for non-admin users', () => {
      mockUseAuthStore.mockReturnValue({
        settings: { tabList: ['Account'] },
        user: { isAdmin: false, id: '1', name: 'Regular User' },
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useNavigation());

      const adminItem = result.current.navItems.find((item) => item.name === 'Admin');
      expect(adminItem).toBeUndefined();
    });
  });

  describe('entity icons', () => {
    it('should assign correct icons to known entities', () => {
      mockUseAuthStore.mockReturnValue({
        settings: { tabList: ['Account', 'Contact', 'Lead', 'Email'] },
        user: null,
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useNavigation());

      // Each entity should have an icon
      const accountItem = result.current.navItems.find((item) => item.name === 'Account');
      const contactItem = result.current.navItems.find((item) => item.name === 'Contact');
      const leadItem = result.current.navItems.find((item) => item.name === 'Lead');

      expect(accountItem?.icon).toBeDefined();
      expect(contactItem?.icon).toBeDefined();
      expect(leadItem?.icon).toBeDefined();
    });

    it('should use default icon for unknown entities', () => {
      mockUseAuthStore.mockReturnValue({
        settings: { tabList: ['CustomEntity'] },
        user: null,
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useNavigation());

      const customItem = result.current.navItems.find((item) => item.name === 'CustomEntity');
      expect(customItem?.icon).toBeDefined(); // Should have default Grid icon
    });
  });
});
