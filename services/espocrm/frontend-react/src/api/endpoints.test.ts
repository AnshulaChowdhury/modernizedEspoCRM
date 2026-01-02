import { describe, it, expect } from 'vitest';
import { API_ENDPOINTS } from './endpoints';

describe('API_ENDPOINTS', () => {
  describe('static endpoints', () => {
    it('should have correct AUTH_LOGIN endpoint', () => {
      expect(API_ENDPOINTS.AUTH_LOGIN).toBe('/App/user');
    });

    it('should have correct AUTH_LOGOUT endpoint', () => {
      expect(API_ENDPOINTS.AUTH_LOGOUT).toBe('/App/action/logout');
    });

    it('should have correct METADATA endpoint', () => {
      expect(API_ENDPOINTS.METADATA).toBe('/Metadata');
    });

    it('should have correct SETTINGS endpoint', () => {
      expect(API_ENDPOINTS.SETTINGS).toBe('/Settings');
    });
  });

  describe('entity endpoint', () => {
    it('should generate correct entity endpoint', () => {
      expect(API_ENDPOINTS.entity('Account')).toBe('/Account');
      expect(API_ENDPOINTS.entity('Contact')).toBe('/Contact');
      expect(API_ENDPOINTS.entity('Lead')).toBe('/Lead');
    });
  });

  describe('entityById endpoint', () => {
    it('should generate correct entity by ID endpoint', () => {
      expect(API_ENDPOINTS.entityById('Account', '123')).toBe('/Account/123');
      expect(API_ENDPOINTS.entityById('Contact', 'abc-def')).toBe('/Contact/abc-def');
    });
  });

  describe('entityAction endpoint', () => {
    it('should generate correct entity action endpoint', () => {
      expect(API_ENDPOINTS.entityAction('Account', 'merge')).toBe('/Account/action/merge');
      expect(API_ENDPOINTS.entityAction('Contact', 'export')).toBe('/Contact/action/export');
    });
  });

  describe('layout endpoint', () => {
    it('should generate correct layout endpoint', () => {
      expect(API_ENDPOINTS.layout('Account', 'list')).toBe('/Account/layout/list');
      expect(API_ENDPOINTS.layout('Contact', 'detail')).toBe('/Contact/layout/detail');
    });
  });

  describe('related endpoint', () => {
    it('should generate correct related records endpoint', () => {
      expect(API_ENDPOINTS.related('Account', '123', 'contacts')).toBe('/Account/123/contacts');
      expect(API_ENDPOINTS.related('Contact', 'abc', 'meetings')).toBe('/Contact/abc/meetings');
    });
  });
});
