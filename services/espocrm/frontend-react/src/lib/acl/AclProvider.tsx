import React, { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store';
import type { AclContextValue, AclData, AclAction } from './types';
import { AclContext } from './AclContext';

interface AclProviderProps {
  children: React.ReactNode;
}

/**
 * ACL Provider - provides permission checking throughout the app
 */
export function AclProvider({ children }: AclProviderProps): React.ReactElement {
  const { user, acl: rawAcl, isAuthenticated } = useAuthStore();

  // Cast ACL data to proper type
  const acl = rawAcl as AclData | null;

  const contextValue = useMemo<AclContextValue>(() => {
    /**
     * Check if user has permission for an action on an entity type
     */
    function checkScope(entityType: string, action: AclAction): boolean {
      // Admin has all permissions
      if (user?.isAdmin) {
        return true;
      }

      if (!acl?.table) {
        return false;
      }

      const scopeAcl = acl.table[entityType];
      if (!scopeAcl) {
        return false;
      }

      const permission = scopeAcl[action];

      // Handle boolean permissions
      if (typeof permission === 'boolean') {
        return permission;
      }

      // Handle string permissions (all, team, own, no)
      if (typeof permission === 'string') {
        return permission !== 'no';
      }

      return false;
    }

    /**
     * Check if user has permission for an action on a specific record
     */
    function checkModel(
      entityType: string,
      record: Record<string, unknown>,
      action: AclAction
    ): boolean {
      // Admin has all permissions
      if (user?.isAdmin) {
        return true;
      }

      if (!acl?.table) {
        return false;
      }

      const scopeAcl = acl.table[entityType];
      if (!scopeAcl) {
        return false;
      }

      const permission = scopeAcl[action];

      // Handle boolean permissions
      if (typeof permission === 'boolean') {
        return permission;
      }

      // Handle level-based permissions
      if (typeof permission === 'string') {
        switch (permission) {
          case 'all':
            return true;
          case 'team': {
            // Check if user is on same team as record
            // Simplified: check if user's teams overlap with record's teams
            const userTeamIds = (user as Record<string, unknown>)?.teamsIds as string[] ?? [];
            const recordTeamIds = record.teamsIds as string[] ?? [];
            return userTeamIds.some((id) => recordTeamIds.includes(id));
          }
          case 'own':
            // Check if user owns the record
            return record.assignedUserId === user?.id || record.createdById === user?.id;
          case 'no':
            return false;
          default:
            return false;
        }
      }

      return false;
    }

    /**
     * Check field-level access
     */
    function checkField(
      entityType: string,
      field: string,
      action: 'read' | 'edit'
    ): boolean {
      // Admin has all permissions
      if (user?.isAdmin) {
        return true;
      }

      // Check field table
      const fieldAcl = acl?.fieldTable?.[entityType]?.[field];
      if (!fieldAcl) {
        // No explicit field ACL, default to scope permission
        return checkScope(entityType, action);
      }

      if (action === 'read') {
        return fieldAcl !== 'no';
      }

      if (action === 'edit') {
        return fieldAcl === 'yes';
      }

      return false;
    }

    /**
     * Check if entity type is enabled (user can see it)
     */
    function checkScopeEnabled(entityType: string): boolean {
      // Admin can see everything
      if (user?.isAdmin) {
        return true;
      }

      // Check if user has read access
      return checkScope(entityType, 'read');
    }

    return {
      data: acl as AclData | null,
      isLoading: !isAuthenticated,
      checkScope,
      checkModel,
      checkField,
      checkScopeEnabled,
    };
  }, [user, acl, isAuthenticated]);

  return (
    <AclContext.Provider value={contextValue}>
      {children}
    </AclContext.Provider>
  );
}
