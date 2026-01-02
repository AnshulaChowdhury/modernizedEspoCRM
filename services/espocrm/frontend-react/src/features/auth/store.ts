import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, post, ApiError } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import {
  type AuthStore,
  type User,
  AuthResponseSchema,
  UserSchema,
} from './types';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      acl: null,
      preferences: null,
      settings: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          // Create base64 credentials (not stored until login succeeds)
          const credentials = btoa(`${username}:${password}`);

          // Fetch user data with EspoCRM-specific headers
          // Note: Don't store token yet - interceptor would overwrite our headers
          const headers = {
            'Authorization': `Basic ${credentials}`,
            'Espo-Authorization': credentials,
            'Espo-Authorization-By-Token': 'false',
            'Espo-Authorization-Create-Token-Secret': 'true',
          };

          const response: unknown = await get(API_ENDPOINTS.AUTH_LOGIN, { headers });
          const parsed = AuthResponseSchema.parse(response);
          const user: User = UserSchema.parse(parsed.user);

          // Build auth token: if auth.token exists, use Base64(userName:token)
          // Otherwise fall back to credentials (Base64 encoded username:password)
          let tokenToStore: string;
          let isTokenAuth = false;

          if (parsed.auth?.token) {
            // Token-based auth: Base64(userName:tokenSecret)
            tokenToStore = btoa(`${parsed.auth.userName}:${parsed.auth.token}`);
            isTokenAuth = true;
          } else if (parsed.token) {
            // Legacy token format
            tokenToStore = btoa(`${username}:${parsed.token}`);
            isTokenAuth = true;
          } else {
            // Fall back to credentials
            tokenToStore = credentials;
          }

          // Store token only after successful authentication
          localStorage.setItem('auth-token', tokenToStore);
          // Track whether we're using a token secret (affects auth header format)
          localStorage.setItem('auth-is-token', isTokenAuth ? 'true' : 'false');

          set({
            user,
            token: tokenToStore,
            acl: parsed.acl ?? null,
            preferences: parsed.preferences ?? null,
            settings: parsed.settings ?? null,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          localStorage.removeItem('auth-token');

          const message =
            error instanceof ApiError ? error.message : 'Login failed';

          set({
            user: null,
            token: null,
            acl: null,
            preferences: null,
            settings: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });

          throw error;
        }
      },

      logout: async (): Promise<void> => {
        try {
          await post(API_ENDPOINTS.AUTH_LOGOUT);
        } catch {
          // Ignore logout errors
        } finally {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-is-token');
          set({
            user: null,
            token: null,
            acl: null,
            preferences: null,
            settings: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      checkAuth: async (): Promise<boolean> => {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          set({ isAuthenticated: false });
          return false;
        }

        try {
          const response: unknown = await get(API_ENDPOINTS.AUTH_LOGIN);
          const parsed = AuthResponseSchema.parse(response);
          const user: User = UserSchema.parse(parsed.user);

          set({
            user,
            token,
            acl: parsed.acl ?? null,
            preferences: parsed.preferences ?? null,
            settings: parsed.settings ?? null,
            isAuthenticated: true,
          });

          return true;
        } catch {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-is-token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      clearError: (): void => {
        set({ error: null });
      },
    }),
    {
      name: 'espo-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        acl: state.acl,
        settings: state.settings,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
