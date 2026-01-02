import { useTranslation as useI18nTranslation } from 'react-i18next';

interface TranslationHelpers {
  t: (key: string, options?: Record<string, unknown>) => string;
  translateOption: (entityType: string, field: string, value: string) => string;
  translateField: (entityType: string, field: string) => string;
  translateEntity: (entityType: string, plural?: boolean) => string;
  translateLayoutName: (layoutType: string, scope?: string) => string;
  isReady: boolean;
}

export function useTranslation(): TranslationHelpers {
  const { t, ready } = useI18nTranslation();

  return {
    t: (key: string, options?: Record<string, unknown>): string => {
      return t(key, options);
    },

    translateOption: (
      entityType: string,
      field: string,
      value: string
    ): string => {
      const key = `${entityType}.options.${field}.${value}`;
      const translated = t(key);
      return translated !== key ? translated : value;
    },

    translateField: (entityType: string, field: string): string => {
      const key = `${entityType}.fields.${field}`;
      const translated = t(key);
      return translated !== key ? translated : field;
    },

    translateEntity: (entityType: string, plural = false): string => {
      const suffix = plural ? 'Plural' : '';
      const key = `${entityType}.label${suffix}`;
      const translated = t(key);
      return translated !== key ? translated : entityType;
    },

    translateLayoutName: (layoutType: string, scope?: string): string => {
      // Try scope-specific translation first
      if (scope) {
        const scopeKey = `${scope}.layouts.${layoutType}`;
        const scopeTranslated = t(scopeKey);
        if (scopeTranslated !== scopeKey) {
          return scopeTranslated;
        }
      }
      // Fall back to Admin layouts translation
      const adminKey = `Admin.layouts.${layoutType}`;
      const adminTranslated = t(adminKey);
      if (adminTranslated !== adminKey) {
        return adminTranslated;
      }
      // Fall back to human-readable format
      return layoutType
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    },

    isReady: ready,
  };
}
