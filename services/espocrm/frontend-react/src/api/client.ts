import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import { z } from 'zod';

// API Error Schema
const ApiErrorSchema = z.object({
  message: z.string().optional(),
  messageTranslation: z.string().optional(),
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: '/api/v1',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth-token');
      const isTokenAuth = localStorage.getItem('auth-is-token') === 'true';
      if (token) {
        // Both auth types use Base64 encoded string, just different content:
        // - Token auth: Base64(userName:tokenSecret)
        // - Credentials auth: Base64(userName:password)
        config.headers.Authorization = `Basic ${token}`;
        config.headers['Espo-Authorization'] = token;
        config.headers['Espo-Authorization-By-Token'] = isTokenAuth ? 'true' : 'false';
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        const { status, data } = error.response;

        // Handle 401 - clear token, let calling code handle redirect
        if (status === 401) {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-is-token');
          // Don't do hard redirect here - let React handle it
          return Promise.reject(new ApiError('Unauthorized', 401));
        }

        // Handle 403 - forbidden
        if (status === 403) {
          return Promise.reject(new ApiError('Access denied', 403));
        }

        // Parse error message
        // EspoCRM returns either 'message' (plain text) or 'messageTranslation' (translation key)
        const parsed = ApiErrorSchema.safeParse(data);
        let message = 'An error occurred';

        if (parsed.success) {
          if (parsed.data.message) {
            message = parsed.data.message;
          } else if (parsed.data.messageTranslation) {
            // Map common translation keys to human-readable messages
            const translationMap: Record<string, string> = {
              'nameIsAlreadyUsed': 'This name is already in use.',
              'nameIsNotAllowed': 'This name is not allowed.',
              'nameIsTooLong': 'The name is too long.',
              'nameIsTooShort': 'The name is too short.',
            };
            message = translationMap[parsed.data.messageTranslation] ?? parsed.data.messageTranslation;
          }
        }

        return Promise.reject(new ApiError(message, status, undefined, data));
      }

      // Network error
      return Promise.reject(new ApiError('Network error', 0));
    }
  );

  return client;
}

export const apiClient = createApiClient();

// Typed request helpers
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function post<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function put<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

export async function del<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}
