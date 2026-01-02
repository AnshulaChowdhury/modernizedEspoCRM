import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

export async function initI18n(): Promise<typeof i18n> {
  await i18n
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en_US',
      debug: import.meta.env.DEV,

      interpolation: {
        escapeValue: false, // React already escapes
      },

      backend: {
        // Load from EspoCRM API
        loadPath: '/api/v1/I18n?language={{lng}}',
        parse: (data: string): Record<string, unknown> => {
          const parsed: unknown = JSON.parse(data);
          return parsed as Record<string, unknown>;
        },
      },

      react: {
        useSuspense: false, // Avoid suspense for smoother loading
      },
    });

  return i18n;
}

export default i18n;
