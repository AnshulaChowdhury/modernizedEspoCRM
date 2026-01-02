import type { FieldComponent } from './types';

// Field component registry
const fieldRegistry: Record<string, FieldComponent> = {};

/**
 * Register a field component for a field type
 */
export function registerField(type: string, component: FieldComponent): void {
  fieldRegistry[type] = component;
}

/**
 * Get a field component by type
 */
export function getFieldComponent(type: string): FieldComponent | undefined {
  return fieldRegistry[type];
}

/**
 * Check if a field type is registered
 */
export function hasFieldType(type: string): boolean {
  return type in fieldRegistry;
}

/**
 * Get all registered field types
 */
export function getRegisteredTypes(): string[] {
  return Object.keys(fieldRegistry);
}

// Export registry for direct access if needed
export { fieldRegistry };
