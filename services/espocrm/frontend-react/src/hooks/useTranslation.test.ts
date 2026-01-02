/**
 * useTranslation Hook Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTranslation } from './useTranslation';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

import { useTranslation as useI18nTranslation } from 'react-i18next';

const mockUseI18nTranslation = vi.mocked(useI18nTranslation);

describe('useTranslation', () => {
  const mockT = vi.fn((key: string) => key);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseI18nTranslation.mockReturnValue({
      t: mockT,
      ready: true,
      i18n: {} as never,
    });
  });

  describe('t function', () => {
    it('should pass key to i18n t function', () => {
      const { result } = renderHook(() => useTranslation());

      result.current.t('some.key');

      expect(mockT).toHaveBeenCalledWith('some.key', undefined);
    });

    it('should pass options to i18n t function', () => {
      const { result } = renderHook(() => useTranslation());

      result.current.t('some.key', { count: 5 });

      expect(mockT).toHaveBeenCalledWith('some.key', { count: 5 });
    });
  });

  describe('translateOption', () => {
    it('should translate enum option', () => {
      mockT.mockImplementation((key) =>
        key === 'Account.options.status.Active' ? 'Active Status' : key
      );

      const { result } = renderHook(() => useTranslation());

      const translated = result.current.translateOption('Account', 'status', 'Active');

      expect(translated).toBe('Active Status');
    });

    it('should return value if translation not found', () => {
      mockT.mockImplementation((key) => key); // Return key as-is

      const { result } = renderHook(() => useTranslation());

      const translated = result.current.translateOption('Account', 'status', 'Unknown');

      expect(translated).toBe('Unknown');
    });
  });

  describe('translateField', () => {
    it('should translate field name', () => {
      mockT.mockImplementation((key) =>
        key === 'Contact.fields.firstName' ? 'First Name' : key
      );

      const { result } = renderHook(() => useTranslation());

      const translated = result.current.translateField('Contact', 'firstName');

      expect(translated).toBe('First Name');
    });

    it('should return field name if translation not found', () => {
      mockT.mockImplementation((key) => key);

      const { result } = renderHook(() => useTranslation());

      const translated = result.current.translateField('Contact', 'customField');

      expect(translated).toBe('customField');
    });
  });

  describe('translateEntity', () => {
    it('should translate entity singular label', () => {
      mockT.mockImplementation((key) =>
        key === 'Account.label' ? 'Account' : key
      );

      const { result } = renderHook(() => useTranslation());

      const translated = result.current.translateEntity('Account');

      expect(translated).toBe('Account');
    });

    it('should translate entity plural label', () => {
      mockT.mockImplementation((key) =>
        key === 'Account.labelPlural' ? 'Accounts' : key
      );

      const { result } = renderHook(() => useTranslation());

      const translated = result.current.translateEntity('Account', true);

      expect(translated).toBe('Accounts');
    });

    it('should return entity type if translation not found', () => {
      mockT.mockImplementation((key) => key);

      const { result } = renderHook(() => useTranslation());

      const translated = result.current.translateEntity('CustomEntity');

      expect(translated).toBe('CustomEntity');
    });
  });

  describe('translateLayoutName', () => {
    it('should translate layout with scope', () => {
      mockT.mockImplementation((key) =>
        key === 'Account.layouts.detail' ? 'Detail View' : key
      );

      const { result } = renderHook(() => useTranslation());

      const translated = result.current.translateLayoutName('detail', 'Account');

      expect(translated).toBe('Detail View');
    });

    it('should fall back to Admin translation', () => {
      mockT.mockImplementation((key) => {
        if (key === 'Account.layouts.detail') return key; // Not found
        if (key === 'Admin.layouts.detail') return 'Detail Layout';
        return key;
      });

      const { result } = renderHook(() => useTranslation());

      const translated = result.current.translateLayoutName('detail', 'Account');

      expect(translated).toBe('Detail Layout');
    });

    it('should format layout name if no translation', () => {
      mockT.mockImplementation((key) => key);

      const { result } = renderHook(() => useTranslation());

      const translated = result.current.translateLayoutName('sidePanels');

      expect(translated).toBe('Side Panels');
    });

    it('should work without scope', () => {
      mockT.mockImplementation((key) =>
        key === 'Admin.layouts.list' ? 'List Layout' : key
      );

      const { result } = renderHook(() => useTranslation());

      const translated = result.current.translateLayoutName('list');

      expect(translated).toBe('List Layout');
    });
  });

  describe('isReady', () => {
    it('should return true when i18n is ready', () => {
      mockUseI18nTranslation.mockReturnValue({
        t: mockT,
        ready: true,
        i18n: {} as never,
      });

      const { result } = renderHook(() => useTranslation());

      expect(result.current.isReady).toBe(true);
    });

    it('should return false when i18n is not ready', () => {
      mockUseI18nTranslation.mockReturnValue({
        t: mockT,
        ready: false,
        i18n: {} as never,
      });

      const { result } = renderHook(() => useTranslation());

      expect(result.current.isReady).toBe(false);
    });
  });
});
