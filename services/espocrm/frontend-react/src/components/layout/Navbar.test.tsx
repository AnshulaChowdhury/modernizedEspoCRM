/**
 * Navbar Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from './Navbar';

// Mock auth store
vi.mock('@/features/auth/store', () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from '@/features/auth/store';

const mockUseAuthStore = vi.mocked(useAuthStore);
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderNavbar(props = {}) {
  return render(
    <MemoryRouter>
      <Navbar onMenuClick={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  const mockUser = {
    id: '1',
    userName: 'admin',
    name: 'Admin User',
    isAdmin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      logout: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useAuthStore>);
  });

  describe('rendering', () => {
    it('should render the navbar', () => {
      renderNavbar();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should render the logo', () => {
      renderNavbar();
      expect(screen.getByText('Krisette & Co.')).toBeInTheDocument();
    });

    it('should render menu toggle button', () => {
      renderNavbar();
      expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
    });

    it('should render global search', () => {
      renderNavbar();
      expect(screen.getByRole('searchbox', { name: /global search/i })).toBeInTheDocument();
    });

    it('should render notifications button', () => {
      renderNavbar();
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });

    it('should render user name', () => {
      renderNavbar();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    it('should use userName as fallback when name is not available', () => {
      mockUseAuthStore.mockReturnValue({
        user: { ...mockUser, name: undefined },
        logout: vi.fn(),
      } as unknown as ReturnType<typeof useAuthStore>);

      renderNavbar();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });

  describe('menu toggle', () => {
    it('should call onMenuClick when menu button is clicked', () => {
      const handleMenuClick = vi.fn();
      render(
        <MemoryRouter>
          <Navbar onMenuClick={handleMenuClick} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }));
      expect(handleMenuClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('user dropdown', () => {
    it('should not show dropdown initially', () => {
      renderNavbar();
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });

    it('should show dropdown when user button is clicked', async () => {
      renderNavbar();

      const userButton = screen.getByRole('button', { name: /admin user/i });
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('should show Log out option in dropdown', async () => {
      renderNavbar();

      const userButton = screen.getByRole('button', { name: /admin user/i });
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Log out')).toBeInTheDocument();
      });
    });

    it('should show Administration option for admin users', async () => {
      renderNavbar();

      const userButton = screen.getByRole('button', { name: /admin user/i });
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Administration')).toBeInTheDocument();
      });
    });

    it('should not show Administration option for non-admin users', async () => {
      mockUseAuthStore.mockReturnValue({
        user: { ...mockUser, isAdmin: false },
        logout: vi.fn(),
      } as unknown as ReturnType<typeof useAuthStore>);

      renderNavbar();

      const userButton = screen.getByRole('button', { name: /admin user/i });
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });

      expect(screen.queryByText('Administration')).not.toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      renderNavbar();

      const userButton = screen.getByRole('button', { name: /admin user/i });
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('should navigate to profile when Profile is clicked', async () => {
      renderNavbar();

      const userButton = screen.getByRole('button', { name: /admin user/i });
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Profile'));

      expect(mockNavigate).toHaveBeenCalledWith('/User/view/1');
    });

    it('should navigate to Admin when Administration is clicked', async () => {
      renderNavbar();

      const userButton = screen.getByRole('button', { name: /admin user/i });
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Administration')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Administration'));

      expect(mockNavigate).toHaveBeenCalledWith('/Admin');
    });
  });

  describe('logout', () => {
    it('should call logout and navigate to login when Log out is clicked', async () => {
      const mockLogout = vi.fn().mockResolvedValue(undefined);
      mockUseAuthStore.mockReturnValue({
        user: mockUser,
        logout: mockLogout,
      } as unknown as ReturnType<typeof useAuthStore>);

      renderNavbar();

      const userButton = screen.getByRole('button', { name: /admin user/i });
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Log out')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Log out'));

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('aria attributes', () => {
    it('should have correct aria-expanded on user button', async () => {
      renderNavbar();

      const userButton = screen.getByRole('button', { name: /admin user/i });
      expect(userButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(userButton);

      await waitFor(() => {
        expect(userButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have aria-haspopup on user button', () => {
      renderNavbar();

      const userButton = screen.getByRole('button', { name: /admin user/i });
      expect(userButton).toHaveAttribute('aria-haspopup', 'true');
    });
  });
});
