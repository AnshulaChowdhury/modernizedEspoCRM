/**
 * Label Manager types
 */

/**
 * Scope data containing categories and their labels
 * Structure: { category: { "Category[.]labelKey": "Label Value" } }
 */
export type ScopeData = Record<string, Record<string, string>>;

/**
 * Label item for display
 */
export interface LabelItem {
  /** Full path like "Category[.]labelKey" */
  path: string;
  /** Category name */
  category: string;
  /** Label key without category prefix */
  key: string;
  /** Current label value */
  value: string;
  /** Whether label has been modified */
  isDirty?: boolean;
}

/**
 * Category group for display
 */
export interface CategoryGroup {
  name: string;
  labels: LabelItem[];
  isExpanded: boolean;
}
