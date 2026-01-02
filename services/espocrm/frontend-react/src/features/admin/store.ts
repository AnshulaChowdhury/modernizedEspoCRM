/**
 * Admin Zustand store
 */
import { create } from 'zustand';
import { apiClient } from '@/api/client';
import type { AdminActionResult } from './types';

interface AdminState {
  // UI state
  sidebarCollapsed: boolean;
  searchQuery: string;

  // Actions loading state
  isClearing: boolean;
  isRebuilding: boolean;

  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;

  // Admin actions
  clearCache: () => Promise<AdminActionResult>;
  rebuild: () => Promise<AdminActionResult>;
}

export const useAdminStore = create<AdminState>((set) => ({
  // Initial state
  sidebarCollapsed: false,
  searchQuery: '',
  isClearing: false,
  isRebuilding: false,

  // UI actions
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Admin actions
  clearCache: async () => {
    set({ isClearing: true });
    try {
      await apiClient.post('/Admin/clearCache');
      return { success: true, message: 'Cache cleared successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to clear cache' };
    } finally {
      set({ isClearing: false });
    }
  },

  rebuild: async () => {
    set({ isRebuilding: true });
    try {
      await apiClient.post('/Admin/rebuild');
      return { success: true, message: 'Rebuild completed successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to rebuild' };
    } finally {
      set({ isRebuilding: false });
    }
  },
}));
