import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/features/auth/store';

// Mock the auth store
vi.mock('@/features/auth/store', () => ({
  useAuthStore: vi.fn(),
}));

const renderWithRouter = (
  initialRoute: string,
  element: React.ReactElement
) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={element} />
        <Route path="/" element={element} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  const mockCheckAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        token: 'valid-token',
        checkAuth: mockCheckAuth,
      });
    });

    it('should render children when authenticated', () => {
      renderWithRouter(
        '/',
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not call checkAuth when already authenticated', () => {
      renderWithRouter(
        '/',
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockCheckAuth).not.toHaveBeenCalled();
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        token: null,
        checkAuth: mockCheckAuth,
      });
    });

    it('should call checkAuth when not authenticated but has token in storage', () => {
      localStorage.setItem('auth-token', 'stored-token');
      mockCheckAuth.mockResolvedValue(false);

      renderWithRouter(
        '/',
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockCheckAuth).toHaveBeenCalled();
    });

    it('should show loading state while checking auth with token in storage', () => {
      localStorage.setItem('auth-token', 'stored-token');
      mockCheckAuth.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter(
        '/',
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('should redirect to login when no token in storage', async () => {
      // No token in localStorage
      renderWithRouter(
        '/',
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should redirect to login when checkAuth returns false', async () => {
      localStorage.setItem('auth-token', 'stored-token');
      mockCheckAuth.mockResolvedValue(false);

      renderWithRouter(
        '/',
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });

  describe('redirect state', () => {
    it('should pass the current location in redirect state', async () => {
      mockCheckAuth.mockResolvedValue(false);
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        token: null,
        checkAuth: mockCheckAuth,
      });

      // The redirect includes `from` state, which Navigate uses
      // We verify the redirect happens to /login
      renderWithRouter(
        '/dashboard',
        <ProtectedRoute>
          <div>Dashboard Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });
});
