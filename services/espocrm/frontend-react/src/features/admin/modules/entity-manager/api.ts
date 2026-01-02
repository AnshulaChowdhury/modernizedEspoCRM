/**
 * Entity Manager API endpoints
 */
import { apiClient } from '@/api/client';
import type {
  EntityScope,
  EntityDefs,
  CreateEntityData,
  UpdateEntityData,
  CreateRelationshipData,
  EntityRelationship
} from './types';

export const entityManagerApi = {
  /**
   * Get all entity scopes
   */
  getScopes: async (): Promise<Record<string, EntityScope>> => {
    const response = await apiClient.get<Record<string, EntityScope>>('/Metadata', {
      params: { type: 'scopes' },
    });
    return response.data;
  },

  /**
   * Get entity definitions
   */
  getEntityDefs: async (scope: string): Promise<EntityDefs> => {
    const response = await apiClient.get<EntityDefs>('/Metadata', {
      params: { type: 'entityDefs', scope },
    });
    return response.data;
  },

  /**
   * Get entity labels
   */
  getLabels: async (scope: string, language: string = 'en_US'): Promise<Record<string, string>> => {
    const response = await apiClient.get<Record<string, string>>('/I18n', {
      params: { language, scope },
    });
    return response.data;
  },

  /**
   * Create a new entity
   * Returns the actual entity name (server adds 'C' prefix to custom entities)
   */
  createEntity: async (data: CreateEntityData): Promise<{ name: string }> => {
    const response = await apiClient.post<{ name: string }>('/EntityManager/action/createEntity', data);
    return response.data;
  },

  /**
   * Update entity properties
   */
  updateEntity: async (scope: string, data: UpdateEntityData): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/EntityManager/action/updateEntity', {
      name: scope,
      ...data,
    });
    return response.data;
  },

  /**
   * Delete an entity
   */
  deleteEntity: async (scope: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/EntityManager/action/removeEntity', {
      name: scope,
    });
    return response.data;
  },

  /**
   * Get entity relationships
   */
  getRelationships: async (scope: string): Promise<EntityRelationship[]> => {
    const entityDefs = await entityManagerApi.getEntityDefs(scope);
    const links = entityDefs.links ?? {};

    return Object.entries(links).map(([name, link]) => ({
      name,
      type: link.type,
      entity: link.entity ?? '',
      foreign: link.foreign,
      foreignEntity: link.entity,
      linkType: link.type,
      isCustom: link.isCustom,
    }));
  },

  /**
   * Create a relationship
   */
  createRelationship: async (scope: string, data: CreateRelationshipData): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/EntityManager/action/createLink', {
      entity: scope,
      ...data,
    });
    return response.data;
  },

  /**
   * Delete a relationship
   */
  deleteRelationship: async (scope: string, link: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/EntityManager/action/removeLink', {
      entity: scope,
      link,
    });
    return response.data;
  },

  /**
   * Reset entity to default
   */
  resetToDefault: async (scope: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/EntityManager/action/resetToDefault', {
      name: scope,
    });
    return response.data;
  },

  /**
   * Get formula functions
   */
  getFormulaFunctions: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>('/Metadata', {
      params: { type: 'app', key: 'formula' },
    });
    return response.data;
  },
};
