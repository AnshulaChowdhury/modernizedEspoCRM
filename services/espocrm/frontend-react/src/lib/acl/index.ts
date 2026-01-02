/**
 * ACL System
 *
 * This module provides access control checking throughout the app.
 * It checks permissions at scope, model, and field levels.
 */

export { AclProvider } from './AclProvider';
export { useAcl, useAclContext } from './useAcl';
export type {
  AclContextValue,
  AclData,
  AclAction,
  PermissionLevel,
  FieldAccess,
  ScopeAcl,
  FieldAcl,
} from './types';
