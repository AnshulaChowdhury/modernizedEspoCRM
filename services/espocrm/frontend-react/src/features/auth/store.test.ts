import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './store';

// Mock the API client
vi.mock('@/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message: string, public status: number) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAuthStore.setState({
      user: null,
      token: null,
      acl: null,
      preferences: null,
      settings: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    // Clear localStorage
    localStorage.clear();
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should set isLoading to true when login starts', async () => {
      const { get } = await import('@/api/client');
      (get as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const loginPromise = useAuthStore.getState().login('test', 'password');

      // Check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      // Clean up
      loginPromise.catch(() => {});
    });

    it('should set user and token on successful login', async () => {
      const { get } = await import('@/api/client');
      const mockResponse = {
        user: {
          id: '123',
          userName: 'testuser',
          name: 'Test User',
          type: 'regular',
          isAdmin: false,
        },
        settings: { tabList: ['Account', 'Contact'] },
        preferences: {},
      };
      (get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await useAuthStore.getState().login('testuser', 'password');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockResponse.user);
      expect(state.token).toBe(btoa('testuser:password'));
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should store token in localStorage on successful login', async () => {
      const { get } = await import('@/api/client');
      const mockResponse = {
        user: {
          id: '123',
          userName: 'testuser',
          name: 'Test User',
          type: 'regular',
        },
      };
      (get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await useAuthStore.getState().login('testuser', 'password');

      expect(localStorage.getItem('auth-token')).toBe(btoa('testuser:password'));
    });

    it('should set error on failed login', async () => {
      const { get, ApiError } = await import('@/api/client');
      (get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError('Invalid credentials', 401)
      );

      await expect(
        useAuthStore.getState().login('testuser', 'wrongpassword')
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should remove token from localStorage on failed login', async () => {
      const { get, ApiError } = await import('@/api/client');
      localStorage.setItem('auth-token', 'old-token');
      (get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError('Invalid credentials', 401)
      );

      await expect(
        useAuthStore.getState().login('testuser', 'wrongpassword')
      ).rejects.toThrow();

      expect(localStorage.getItem('auth-token')).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear user and token on logout', async () => {
      const { post } = await import('@/api/client');
      (post as ReturnType<typeof vi.fn>).mockResolvedValue({});

      // Set up authenticated state
      useAuthStore.setState({
        user: { id: '123', userName: 'test', type: 'regular', isAdmin: false },
        token: 'test-token',
        isAuthenticated: true,
      });
      localStorage.setItem('auth-token', 'test-token');

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth-token')).toBeNull();
    });

    it('should clear state even if logout API call fails', async () => {
      const { post } = await import('@/api/client');
      (post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      useAuthStore.setState({
        user: { id: '123', userName: 'test', type: 'regular', isAdmin: false },
        token: 'test-token',
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should return false if no token in localStorage', async () => {
      const result = await useAuthStore.getState().checkAuth();
      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should return true and set user if token is valid', async () => {
      const { get } = await import('@/api/client');
      const mockResponse = {
        user: {
          id: '123',
          userName: 'testuser',
          type: 'regular',
        },
      };
      (get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
      localStorage.setItem('auth-token', 'valid-token');

      const result = await useAuthStore.getState().checkAuth();

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.userName).toBe('testuser');
    });

    it('should return false and clear state if token is invalid', async () => {
      const { get } = await import('@/api/client');
      (get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Unauthorized'));
      localStorage.setItem('auth-token', 'invalid-token');

      const result = await useAuthStore.getState().checkAuth();

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth-token')).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear the error state', () => {
      useAuthStore.setState({ error: 'Some error' });
      expect(useAuthStore.getState().error).toBe('Some error');

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
