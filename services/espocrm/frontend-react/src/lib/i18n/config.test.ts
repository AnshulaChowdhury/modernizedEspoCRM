/**
 * i18n Config Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18next and related modules
const mockInit = vi.fn().mockResolvedValue(undefined);
const mockUse = vi.fn().mockReturnThis();

vi.mock('i18next', () => ({
  default: {
    use: mockUse,
    init: mockInit,
  },
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('i18next-http-backend', () => ({
  default: { type: 'backend', init: vi.fn() },
}));

// Need to reset modules to ensure fresh import
beforeEach(() => {
  vi.clearAllMocks();
  mockUse.mockReturnThis();
  mockInit.mockResolvedValue(undefined);
});

describe('i18n config', () => {
  it('exports initI18n function', async () => {
    const { initI18n } = await import('./config');
    expect(typeof initI18n).toBe('function');
  });

  it('initI18n returns i18n instance', async () => {
    const { initI18n } = await import('./config');
    const result = await initI18n();
    expect(result).toBeDefined();
  });

  it('uses HttpBackend plugin', async () => {
    const { initI18n } = await import('./config');
    await initI18n();
    expect(mockUse).toHaveBeenCalled();
  });

  it('uses initReactI18next plugin', async () => {
    const { initI18n } = await import('./config');
    await initI18n();
    // Should be called twice (HttpBackend and initReactI18next)
    expect(mockUse).toHaveBeenCalledTimes(2);
  });

  it('calls init with correct configuration', async () => {
    const { initI18n } = await import('./config');
    await initI18n();

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        fallbackLng: 'en_US',
        interpolation: expect.objectContaining({
          escapeValue: false,
        }),
        backend: expect.objectContaining({
          loadPath: '/api/v1/I18n?language={{lng}}',
        }),
        react: expect.objectContaining({
          useSuspense: false,
        }),
      })
    );
  });

  it('has backend with parse function', async () => {
    const { initI18n } = await import('./config');
    await initI18n();

    const initCall = mockInit.mock.calls[0][0];
    expect(initCall.backend.parse).toBeDefined();
    expect(typeof initCall.backend.parse).toBe('function');
  });

  it('backend parse function parses JSON', async () => {
    const { initI18n } = await import('./config');
    await initI18n();

    const initCall = mockInit.mock.calls[0][0];
    const parseResult = initCall.backend.parse('{"key": "value"}');
    expect(parseResult).toEqual({ key: 'value' });
  });

  it('exports default i18n instance', async () => {
    const i18nModule = await import('./config');
    expect(i18nModule.default).toBeDefined();
  });
});
