export interface ConfirmationModalConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

export interface RecordSelectModalConfig {
  entityType: string;
  title?: string;
  multiple?: boolean;
  filters?: Record<string, unknown>;
  excludeIds?: string[];
}

export interface QuickCreateModalConfig {
  entityType: string;
  title?: string;
  defaultValues?: Record<string, unknown>;
  requiredFields?: string[];
}

export interface SelectedRecord {
  id: string;
  name: string;
  [key: string]: unknown;
}

export type ModalType = 'confirmation' | 'recordSelect' | 'quickCreate';

export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  config: ConfirmationModalConfig | RecordSelectModalConfig | QuickCreateModalConfig | null;
  resolve: ((value: unknown) => void) | null;
  reject: ((reason?: unknown) => void) | null;
}
