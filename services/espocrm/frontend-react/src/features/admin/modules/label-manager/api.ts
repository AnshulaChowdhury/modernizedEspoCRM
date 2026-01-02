/**
 * Label Manager API
 */
import { apiClient } from '@/api/client';
import type { ScopeData } from './types';

export const labelManagerApi = {
  /**
   * Get list of scopes available for label management
   */
  getScopeList: async (): Promise<string[]> => {
    const response = await apiClient.post<string[]>('LabelManager/action/getScopeList');
    return response.data;
  },

  /**
   * Get scope data (categories and labels) for a specific scope and language
   */
  getScopeData: async (scope: string, language: string): Promise<ScopeData> => {
    const response = await apiClient.post<ScopeData>('LabelManager/action/getScopeData', {
      scope,
      language,
    });
    return response.data;
  },

  /**
   * Save modified labels
   */
  saveLabels: async (
    scope: string,
    language: string,
    labels: Record<string, string>
  ): Promise<ScopeData> => {
    const response = await apiClient.post<ScopeData>('LabelManager/action/saveLabels', {
      scope,
      language,
      labels,
    });
    return response.data;
  },
};
