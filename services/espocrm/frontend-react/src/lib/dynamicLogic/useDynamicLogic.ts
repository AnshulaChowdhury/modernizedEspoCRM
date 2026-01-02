/**
 * Dynamic Logic React Hook
 *
 * Provides dynamic field state based on metadata and form data.
 */

import { useMemo } from 'react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { evaluateEntityDynamicLogic, evaluateFieldDynamicLogic } from './evaluator';
import type {
  DynamicFieldState,
  DynamicEntityState,
  EntityDynamicLogic,
  DynamicLogicDef,
} from './types';

interface UseDynamicLogicOptions {
  /** Entity type to get dynamic logic for */
  entityType: string;
  /** Current form/record data */
  data: Record<string, unknown>;
}

interface UseDynamicLogicResult {
  /** Dynamic state for all fields */
  fieldStates: Record<string, DynamicFieldState>;
  /** Dynamic state for all panels */
  panelStates: Record<string, { visible: boolean }>;
  /** Get state for a specific field */
  getFieldState: (fieldName: string) => DynamicFieldState;
  /** Get state for a specific panel */
  getPanelState: (panelName: string) => { visible: boolean };
  /** Check if a field is visible */
  isFieldVisible: (fieldName: string) => boolean;
  /** Check if a field is required (including dynamic requirement) */
  isFieldRequired: (fieldName: string) => boolean;
  /** Check if a field is read-only (including dynamic read-only) */
  isFieldReadOnly: (fieldName: string) => boolean;
  /** Get filtered options for an enum field */
  getFilteredOptions: (fieldName: string) => string[] | undefined;
  /** Whether dynamic logic is loaded and ready */
  isReady: boolean;
}

const DEFAULT_FIELD_STATE: DynamicFieldState = {
  visible: true,
  required: false,
  readOnly: false,
  invalid: false,
  filteredOptions: undefined,
};

const DEFAULT_PANEL_STATE = { visible: true };

/**
 * Hook to use dynamic logic for an entity
 */
export function useDynamicLogic({
  entityType,
  data,
}: UseDynamicLogicOptions): UseDynamicLogicResult {
  const { metadata } = useMetadata();

  // Get dynamic logic definition from metadata
  const dynamicLogic = useMemo<EntityDynamicLogic | undefined>(() => {
    const clientDefs = metadata?.clientDefs?.[entityType] as
      | { dynamicLogic?: EntityDynamicLogic }
      | undefined;
    return clientDefs?.dynamicLogic;
  }, [metadata, entityType]);

  // Get field options from metadata (for filtering)
  const fieldOptions = useMemo<Record<string, string[]>>(() => {
    const options: Record<string, string[]> = {};
    const entityDef = metadata?.entityDefs?.[entityType];

    if (entityDef?.fields) {
      for (const [fieldName, fieldDef] of Object.entries(entityDef.fields)) {
        const def = fieldDef as { options?: string[] };
        if (def.options) {
          options[fieldName] = def.options;
        }
      }
    }

    return options;
  }, [metadata, entityType]);

  // Evaluate dynamic logic
  const dynamicState = useMemo<DynamicEntityState>(() => {
    return evaluateEntityDynamicLogic(dynamicLogic, data, fieldOptions);
  }, [dynamicLogic, data, fieldOptions]);

  // Get state for a specific field
  const getFieldState = useMemo(
    () => (fieldName: string): DynamicFieldState => {
      return dynamicState.fields[fieldName] ?? DEFAULT_FIELD_STATE;
    },
    [dynamicState.fields]
  );

  // Get state for a specific panel
  const getPanelState = useMemo(
    () => (panelName: string): { visible: boolean } => {
      return dynamicState.panels[panelName] ?? DEFAULT_PANEL_STATE;
    },
    [dynamicState.panels]
  );

  // Check if a field is visible
  const isFieldVisible = useMemo(
    () => (fieldName: string): boolean => {
      return getFieldState(fieldName).visible;
    },
    [getFieldState]
  );

  // Check if a field is required
  const isFieldRequired = useMemo(
    () => (fieldName: string): boolean => {
      return getFieldState(fieldName).required;
    },
    [getFieldState]
  );

  // Check if a field is read-only
  const isFieldReadOnly = useMemo(
    () => (fieldName: string): boolean => {
      return getFieldState(fieldName).readOnly;
    },
    [getFieldState]
  );

  // Get filtered options
  const getFilteredOptions = useMemo(
    () => (fieldName: string): string[] | undefined => {
      return getFieldState(fieldName).filteredOptions;
    },
    [getFieldState]
  );

  return {
    fieldStates: dynamicState.fields,
    panelStates: dynamicState.panels,
    getFieldState,
    getPanelState,
    isFieldVisible,
    isFieldRequired,
    isFieldReadOnly,
    getFilteredOptions,
    isReady: !!metadata,
  };
}

/**
 * Hook to use dynamic logic for a single field
 */
export function useFieldDynamicLogic(
  entityType: string,
  fieldName: string,
  data: Record<string, unknown>
): DynamicFieldState {
  const { metadata } = useMetadata();

  // Get dynamic logic definition for this field
  const fieldLogic = useMemo<DynamicLogicDef | undefined>(() => {
    const clientDefs = metadata?.clientDefs?.[entityType] as
      | { dynamicLogic?: EntityDynamicLogic }
      | undefined;
    return clientDefs?.dynamicLogic?.fields?.[fieldName];
  }, [metadata, entityType, fieldName]);

  // Get field options
  const fieldOptions = useMemo<string[] | undefined>(() => {
    const entityDef = metadata?.entityDefs?.[entityType];
    const fieldDef = entityDef?.fields?.[fieldName] as { options?: string[] } | undefined;
    return fieldDef?.options;
  }, [metadata, entityType, fieldName]);

  // Evaluate
  return useMemo(() => {
    return evaluateFieldDynamicLogic(fieldLogic, data, fieldOptions);
  }, [fieldLogic, data, fieldOptions]);
}
