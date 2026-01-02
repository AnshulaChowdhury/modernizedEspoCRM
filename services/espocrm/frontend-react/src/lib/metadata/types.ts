import { z } from 'zod';

// Field definition schema with full validation support
export const FieldDefSchema = z.object({
  // Field type
  type: z.string(),

  // Validation flags
  required: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  disabled: z.boolean().optional(),
  notStorable: z.boolean().optional(),

  // String validations
  maxLength: z.number().optional(),
  minLength: z.number().optional(),
  pattern: z.string().optional(),

  // Number validations
  min: z.number().optional(),
  max: z.number().optional(),

  // Enum/selection options
  options: z.array(z.union([z.string(), z.number()])).optional(),
  isSorted: z.boolean().optional(),

  // Default value
  default: z.unknown().optional(),

  // View configuration
  view: z.string().optional(),

  // Link field properties
  entity: z.string().optional(),
  foreign: z.string().optional(),

  // File field properties
  maxFileSize: z.number().optional(),
  accept: z.array(z.string()).optional(),
  maxCount: z.number().optional(),

  // Currency field
  currency: z.string().optional(),

  // Phone field
  typeList: z.array(z.string()).optional(),
  defaultType: z.string().optional(),

  // Layout/UI properties
  layoutListDisabled: z.boolean().optional(),
  layoutDetailDisabled: z.boolean().optional(),
  layoutMassUpdateDisabled: z.boolean().optional(),
  layoutSearchDisabled: z.boolean().optional(),

  // Auditing
  audited: z.boolean().optional(),
  isPersonalData: z.boolean().optional(),
}).passthrough();

export type FieldDef = z.infer<typeof FieldDefSchema>;

// Link definition schema
export const LinkDefSchema = z.object({
  type: z.string(),
  entity: z.string().optional(),
  foreign: z.string().optional(),
  relationName: z.string().optional(),
}).passthrough();

export type LinkDef = z.infer<typeof LinkDefSchema>;

// Entity definition schema
export const EntityDefSchema = z.object({
  fields: z.record(FieldDefSchema).optional(),
  links: z.record(LinkDefSchema).optional(),
  collection: z.object({
    orderBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }).passthrough().optional(),
}).passthrough();

export type EntityDef = z.infer<typeof EntityDefSchema>;

// Scope definition schema
export const ScopeDefSchema = z.object({
  entity: z.boolean().optional(),
  object: z.boolean().optional(),
  tab: z.boolean().optional(),
  disabled: z.boolean().optional(),
  module: z.string().optional(),
}).passthrough();

export type ScopeDef = z.infer<typeof ScopeDefSchema>;

// Full metadata schema (partial - add more as needed)
export const MetadataSchema = z.object({
  entityDefs: z.record(EntityDefSchema).optional(),
  clientDefs: z.record(z.unknown()).optional(),
  scopes: z.record(ScopeDefSchema).optional(),
  aclDefs: z.record(z.unknown()).optional(),
  fields: z.record(z.unknown()).optional(),
}).passthrough();

export type Metadata = z.infer<typeof MetadataSchema>;

// Metadata context type
export interface MetadataContextType {
  metadata: Metadata | null;
  isLoading: boolean;
  error: Error | null;
  getEntityDef: (entityType: string) => EntityDef | undefined;
  getFieldDef: (entityType: string, field: string) => FieldDef | undefined;
  getLinkDef: (entityType: string, link: string) => LinkDef | undefined;
  getScopeDef: (scope: string) => ScopeDef | undefined;
  isEntityEnabled: (entityType: string) => boolean;
  getEntityList: () => string[];
}
