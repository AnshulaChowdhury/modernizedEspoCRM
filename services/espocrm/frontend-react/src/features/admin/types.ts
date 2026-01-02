/**
 * Admin module types
 */

export interface AdminPanelItem {
  label: string;
  description?: string;
  url?: string;
  iconClass?: string;
  view?: string;
  recordView?: string;
}

export interface AdminPanel {
  label: string;
  itemList: AdminPanelItem[];
}

export interface AdminPanelDefs {
  [key: string]: AdminPanel;
}

export interface AdminMenuItem {
  name: string;
  label: string;
  path: string;
  icon?: string;
  description?: string;
}

export interface AdminMenuGroup {
  name: string;
  label: string;
  items: AdminMenuItem[];
  icon?: string;
}

export interface AdminBreadcrumb {
  label: string;
  path?: string;
}

export interface AdminSettingsField {
  name: string;
  type: string;
  label?: string;
  tooltip?: string;
  required?: boolean;
  readOnly?: boolean;
  options?: string[];
  default?: unknown;
}

export interface AdminSettingsPanel {
  name: string;
  label: string;
  fields: AdminSettingsField[];
}

export type AdminAction =
  | 'clearCache'
  | 'rebuild'
  | 'runJob';

export interface AdminActionResult {
  success: boolean;
  message?: string;
}
