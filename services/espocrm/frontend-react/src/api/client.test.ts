import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApiError } from './client';

// Mock axios before importing the client
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('ApiError', () => {
    it('should create an error with message and status', () => {
      const error = new ApiError('Not found', 404);
      expect(error.message).toBe('Not found');
      expect(error.status).toBe(404);
      expect(error.name).toBe('ApiError');
    });

    it('should create an error with optional code and details', () => {
      const error = new ApiError('Bad request', 400, 'VALIDATION_ERROR', { field: 'email' });
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should be an instance of Error', () => {
      const error = new ApiError('Test error', 500);
      expect(error).toBeInstanceOf(Error);
    });

    it('should have correct error properties', () => {
      const error = new ApiError('Unauthorized', 401, 'AUTH_ERROR');
      expect(error.status).toBe(401);
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.name).toBe('ApiError');
    });
  });

  describe('Auth token handling', () => {
    it('should store auth token in localStorage', () => {
      localStorage.setItem('auth-token', 'test-token');
      expect(localStorage.getItem('auth-token')).toBe('test-token');
    });

    it('should remove auth token from localStorage', () => {
      localStorage.setItem('auth-token', 'test-token');
      localStorage.removeItem('auth-token');
      expect(localStorage.getItem('auth-token')).toBeNull();
    });
  });

  describe('get function', () => {
    it('should call axios get and return data', async () => {
      const { get } = await import('./client');
      const axios = (await import('axios')).default;
      const mockClient = axios.create();
      (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: '123', name: 'Test' } });

      const result = await get<{ id: string; name: string }>('/test');

      expect(mockClient.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({ id: '123', name: 'Test' });
    });
  });

  describe('post function', () => {
    it('should call axios post and return data', async () => {
      const { post } = await import('./client');
      const axios = (await import('axios')).default;
      const mockClient = axios.create();
      (mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } });

      const result = await post<{ success: boolean }>('/test', { name: 'Test' });

      expect(mockClient.post).toHaveBeenCalledWith('/test', { name: 'Test' }, undefined);
      expect(result).toEqual({ success: true });
    });
  });

  describe('put function', () => {
    it('should call axios put and return data', async () => {
      const { put } = await import('./client');
      const axios = (await import('axios')).default;
      const mockClient = axios.create();
      (mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { updated: true } });

      const result = await put<{ updated: boolean }>('/test/123', { name: 'Updated' });

      expect(mockClient.put).toHaveBeenCalledWith('/test/123', { name: 'Updated' }, undefined);
      expect(result).toEqual({ updated: true });
    });
  });

  describe('del function', () => {
    it('should call axios delete and return data', async () => {
      const { del } = await import('./client');
      const axios = (await import('axios')).default;
      const mockClient = axios.create();
      (mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { deleted: true } });

      const result = await del<{ deleted: boolean }>('/test/123');

      expect(mockClient.delete).toHaveBeenCalledWith('/test/123', undefined);
      expect(result).toEqual({ deleted: true });
    });
  });
});
