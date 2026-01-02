/**
 * Layout Manager API
 * Handles fetching and saving layout configurations
 */
import { apiClient } from '@/api/client';
import type { Layout, LayoutType, ListLayout, DetailLayout, RowLayout } from './types';

export const layoutManagerApi = {
  /**
   * Get layout for an entity
   */
  getLayout: async <T extends Layout = Layout>(
    scope: string,
    type: LayoutType | string
  ): Promise<T> => {
    const response = await apiClient.get<T>(`/${scope}/layout/${type}`);
    return response.data;
  },

  /**
   * Get original (non-customized) layout
   */
  getOriginalLayout: async <T extends Layout = Layout>(
    scope: string,
    type: LayoutType | string
  ): Promise<T> => {
    const response = await apiClient.get<T>(`/${scope}/layout/${type}`, {
      params: { original: true },
    });
    return response.data;
  },

  /**
   * Save layout for an entity
   */
  saveLayout: async (
    scope: string,
    type: LayoutType | string,
    layout: Layout
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.put<{ success: boolean }>(
      `/${scope}/layout/${type}`,
      layout
    );
    return response.data;
  },

  /**
   * Reset layout to default
   */
  resetToDefault: async (
    scope: string,
    type: LayoutType | string
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(
      '/Layout/action/resetToDefault',
      { scope, name: type }
    );
    return response.data;
  },

  /**
   * Delete a custom layout
   */
  deleteLayout: async (
    scope: string,
    type: string
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(
      '/Layout/action/delete',
      { scope, name: type }
    );
    return response.data;
  },

  /**
   * Get list layout
   */
  getListLayout: async (scope: string): Promise<ListLayout> => {
    return layoutManagerApi.getLayout<ListLayout>(scope, 'list');
  },

  /**
   * Get detail layout
   */
  getDetailLayout: async (scope: string): Promise<DetailLayout> => {
    return layoutManagerApi.getLayout<DetailLayout>(scope, 'detail');
  },

  /**
   * Get filters layout
   */
  getFiltersLayout: async (scope: string): Promise<RowLayout> => {
    return layoutManagerApi.getLayout<RowLayout>(scope, 'filters');
  },

  /**
   * Get mass update layout
   */
  getMassUpdateLayout: async (scope: string): Promise<RowLayout> => {
    return layoutManagerApi.getLayout<RowLayout>(scope, 'massUpdate');
  },
};
