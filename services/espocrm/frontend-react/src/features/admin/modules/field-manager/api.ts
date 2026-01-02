/**
 * Field Manager API endpoints
 */
import { apiClient } from '@/api/client';
import type { FieldDef, CreateFieldData, UpdateFieldData } from './types';

export const fieldManagerApi = {
  /**
   * Get all fields for an entity
   */
  getFields: async (scope: string): Promise<Record<string, FieldDef>> => {
    const response = await apiClient.get<{ fields?: Record<string, FieldDef> }>('/Metadata', {
      params: { type: 'entityDefs', scope },
    });
    return response.data.fields ?? {};
  },

  /**
   * Get field definition from the dedicated Field Manager endpoint
   * This endpoint returns field configuration data for editing
   */
  getField: async (scope: string, field: string): Promise<FieldDef | null> => {
    try {
      const response = await apiClient.get<FieldDef>(`/Admin/fieldManager/${scope}/${field}`);
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Get field labels
   */
  getFieldLabels: async (scope: string, language: string = 'en_US'): Promise<Record<string, string>> => {
    const response = await apiClient.get<{ fields?: Record<string, string> }>('/I18n', {
      params: { language, scope },
    });
    return response.data.fields ?? {};
  },

  /**
   * Create a new field
   */
  createField: async (scope: string, data: CreateFieldData): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(
      `/FieldManager/${scope}`,
      data
    );
    return response.data;
  },

  /**
   * Update field definition
   */
  updateField: async (scope: string, field: string, data: UpdateFieldData): Promise<{ success: boolean }> => {
    const response = await apiClient.put<{ success: boolean }>(
      `/FieldManager/${scope}/${field}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a field
   */
  deleteField: async (scope: string, field: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete<{ success: boolean }>(
      `/FieldManager/${scope}/${field}`
    );
    return response.data;
  },

  /**
   * Reset field to default
   */
  resetFieldToDefault: async (scope: string, field: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(
      `/FieldManager/action/resetToDefault`,
      { scope, name: field }
    );
    return response.data;
  },

  /**
   * Get entity options for link fields
   */
  getEntityList: async (): Promise<string[]> => {
    const response = await apiClient.get<Record<string, { entity?: boolean }>>('/Metadata', {
      params: { type: 'scopes' },
    });
    return Object.entries(response.data)
      .filter(([, meta]) => meta.entity)
      .map(([name]) => name)
      .sort();
  },

  /**
   * Get field type metadata
   */
  getFieldTypes: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>('/Metadata', {
      params: { type: 'fields' },
    });
    return response.data;
  },
};
