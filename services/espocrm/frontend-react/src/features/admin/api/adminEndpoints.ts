/**
 * Admin API endpoint definitions
 */
import { apiClient } from '@/api/client';

/**
 * Admin API endpoints
 */
export const adminApi = {
  /**
   * Clear application cache
   */
  clearCache: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/Admin/clearCache');
    return response.data;
  },

  /**
   * Rebuild application
   */
  rebuild: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/Admin/rebuild');
    return response.data;
  },

  /**
   * Get settings
   */
  getSettings: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>('/Settings');
    return response.data;
  },

  /**
   * Update settings
   */
  updateSettings: async (data: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const response = await apiClient.put<Record<string, unknown>>('/Settings', data);
    return response.data;
  },

  /**
   * Get entity manager scopes
   */
  getScopes: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>('/Metadata', {
      params: { type: 'scopes' },
    });
    return response.data;
  },

  /**
   * Create entity scope
   */
  createScope: async (data: {
    name: string;
    type?: string;
    labelSingular: string;
    labelPlural: string;
    stream?: boolean;
  }): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/EntityManager/action/create', data);
    return response.data;
  },

  /**
   * Update entity scope
   */
  updateScope: async (
    scope: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(`/EntityManager/action/update`, {
      name: scope,
      ...data,
    });
    return response.data;
  },

  /**
   * Delete entity scope
   */
  deleteScope: async (scope: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/EntityManager/action/delete', {
      name: scope,
    });
    return response.data;
  },

  /**
   * Get fields for entity
   */
  getFields: async (scope: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>(`/Metadata`, {
      params: { scope, type: 'entityDefs' },
    });
    return response.data;
  },

  /**
   * Create field
   */
  createField: async (
    scope: string,
    data: { name: string; type: string; [key: string]: unknown }
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(
      `/FieldManager/action/create/${scope}`,
      data
    );
    return response.data;
  },

  /**
   * Update field
   */
  updateField: async (
    scope: string,
    field: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.put<{ success: boolean }>(
      `/FieldManager/action/update/${scope}/${field}`,
      data
    );
    return response.data;
  },

  /**
   * Delete field
   */
  deleteField: async (scope: string, field: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete<{ success: boolean }>(
      `/FieldManager/action/delete/${scope}/${field}`
    );
    return response.data;
  },

  /**
   * Get layout
   */
  getLayout: async (scope: string, type: string): Promise<unknown> => {
    const response = await apiClient.get<unknown>(`/Layout/${scope}/${type}`);
    return response.data;
  },

  /**
   * Save layout
   */
  saveLayout: async (scope: string, type: string, data: unknown): Promise<{ success: boolean }> => {
    const response = await apiClient.put<{ success: boolean }>(`/Layout/${scope}/${type}`, data);
    return response.data;
  },

  /**
   * Reset layout to default
   */
  resetLayout: async (scope: string, type: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(
      `/Layout/action/resetToDefault`,
      { scope, name: type }
    );
    return response.data;
  },

  /**
   * Get labels
   */
  getLabels: async (language: string, scope?: string): Promise<Record<string, string>> => {
    const params: Record<string, string> = { language };
    if (scope) params.scope = scope;
    const response = await apiClient.get<Record<string, string>>('/I18n', { params });
    return response.data;
  },

  /**
   * Save labels
   */
  saveLabels: async (language: string, data: Record<string, string>): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/LabelManager/action/save', {
      language,
      labels: data,
    });
    return response.data;
  },
};
