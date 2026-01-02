/**
 * LoginPage Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the auth store
vi.mock('../store', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: false,
  })),
}));

import { useAuthStore } from '../store';

const mockUseAuthStore = vi.mocked(useAuthStore);

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock LoginForm
vi.mock('../components/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form">Login Form Mock</div>,
}));

// Mock BetaBanner
vi.mock('@/components/common/DevBanner', () => ({
  BetaBanner: () => <div data-testid="beta-banner">Beta Banner</div>,
  DevBanner: () => <div data-testid="dev-banner">Dev Banner</div>,
}));

import LoginPage from './LoginPage';

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      token: null,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    });
  });

  it('renders the page title', () => {
    renderLoginPage();
    expect(screen.getByText('EspoCRM')).toBeInTheDocument();
  });

  it('renders sign in text', () => {
    renderLoginPage();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('renders the login form', () => {
    renderLoginPage();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('renders the beta banner', () => {
    renderLoginPage();
    expect(screen.getByTestId('beta-banner')).toBeInTheDocument();
  });

  it('redirects to home when already authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      token: 'valid-token',
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    });

    renderLoginPage();

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('does not redirect when not authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      token: null,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    });

    renderLoginPage();

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
