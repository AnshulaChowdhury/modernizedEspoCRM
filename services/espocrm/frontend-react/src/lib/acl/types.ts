import { z } from 'zod';

/**
 * Permission levels for scope actions
 */
export type PermissionLevel = 'all' | 'team' | 'own' | 'no' | boolean;

/**
 * Actions that can be performed on entities
 */
export type AclAction = 'create' | 'read' | 'edit' | 'delete' | 'stream';

/**
 * Field access levels
 */
export type FieldAccess = 'yes' | 'read' | 'no';

/**
 * Scope ACL definition
 */
export const ScopeAclSchema = z.object({
  // Boolean access (simple true/false)
  create: z.union([z.boolean(), z.string()]).optional(),
  read: z.union([z.boolean(), z.string()]).optional(),
  edit: z.union([z.boolean(), z.string()]).optional(),
  delete: z.union([z.boolean(), z.string()]).optional(),
  stream: z.union([z.boolean(), z.string()]).optional(),
}).passthrough();

export type ScopeAcl = z.infer<typeof ScopeAclSchema>;

/**
 * Field-level ACL for an entity
 */
export const FieldAclSchema = z.record(
  z.string(),
  z.record(z.string(), z.enum(['yes', 'read', 'no']))
);

export type FieldAcl = z.infer<typeof FieldAclSchema>;

/**
 * Full ACL data structure from API
 */
export const AclDataSchema = z.object({
  // Scope-level permissions
  table: z.record(z.string(), ScopeAclSchema).optional(),
  // Field-level permissions per scope
  fieldTable: z.record(
    z.string(),
    z.record(z.string(), z.enum(['yes', 'read', 'no']))
  ).optional(),
  // Field-level permissions for specific entity types
  fieldTableQuickAccess: z.record(
    z.string(),
    z.record(z.string(), z.enum(['yes', 'read', 'no']))
  ).optional(),
}).passthrough();

export type AclData = z.infer<typeof AclDataSchema>;

/**
 * ACL context value
 */
export interface AclContextValue {
  /** Raw ACL data */
  data: AclData | null;
  /** Whether ACL data is loading */
  isLoading: boolean;
  /** Check if user can perform action on entity type */
  checkScope: (entityType: string, action: AclAction) => boolean;
  /** Check if user can perform action on specific record */
  checkModel: (entityType: string, record: Record<string, unknown>, action: AclAction) => boolean;
  /** Check field access level */
  checkField: (entityType: string, field: string, action: 'read' | 'edit') => boolean;
  /** Check if entity type is enabled */
  checkScopeEnabled: (entityType: string) => boolean;
}
