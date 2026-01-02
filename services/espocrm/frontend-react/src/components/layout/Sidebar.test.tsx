/**
 * Sidebar Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Grid, Building2, Users, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';
import type { NavItem } from '@/hooks/useNavigation';

// Mock useNavigation
vi.mock('@/hooks/useNavigation', () => ({
  useNavigation: vi.fn(),
}));

import { useNavigation } from '@/hooks/useNavigation';

const mockUseNavigation = vi.mocked(useNavigation);

function renderSidebar(isOpen = true) {
  return render(
    <MemoryRouter>
      <Sidebar isOpen={isOpen} />
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  const baseNavItems: NavItem[] = [
    { name: 'Home', label: 'Dashboard', href: '/', icon: Grid },
    { name: 'Account', label: 'Accounts', href: '/Account', icon: Building2 },
    { name: 'Contact', label: 'Contacts', href: '/Contact', icon: Users },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigation.mockReturnValue({
      navItems: baseNavItems,
      isLoading: false,
    });
  });

  describe('rendering', () => {
    it('should render navigation', () => {
      renderSidebar();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have main navigation aria label', () => {
      renderSidebar();
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
    });

    it('should render all nav items', () => {
      renderSidebar();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Accounts')).toBeInTheDocument();
      expect(screen.getByText('Contacts')).toBeInTheDocument();
    });

    it('should render nav items as links', () => {
      renderSidebar();
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/');

      const accountsLink = screen.getByRole('link', { name: /accounts/i });
      expect(accountsLink).toHaveAttribute('href', '/Account');
    });
  });

  describe('visibility', () => {
    it('should be visible when isOpen is true', () => {
      renderSidebar(true);
      const sidebar = screen.getByLabelText('Main navigation');
      expect(sidebar).not.toHaveClass('-translate-x-full');
    });

    it('should be hidden when isOpen is false', () => {
      renderSidebar(false);
      const sidebar = screen.getByLabelText('Main navigation');
      expect(sidebar).toHaveClass('-translate-x-full');
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      mockUseNavigation.mockReturnValue({
        navItems: [],
        isLoading: true,
      });

      renderSidebar();
      expect(screen.getByRole('navigation').querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should not show nav items when loading', () => {
      mockUseNavigation.mockReturnValue({
        navItems: baseNavItems,
        isLoading: true,
      });

      renderSidebar();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('admin section', () => {
    it('should render admin item in separate section', () => {
      mockUseNavigation.mockReturnValue({
        navItems: [
          ...baseNavItems,
          { name: 'Admin', label: 'Administration', href: '/Admin', icon: Settings },
        ],
        isLoading: false,
      });

      renderSidebar();
      expect(screen.getByText('Administration')).toBeInTheDocument();

      // Check it's in a separate section with border
      const adminLink = screen.getByRole('link', { name: /administration/i });
      expect(adminLink.closest('.border-t')).toBeInTheDocument();
    });

    it('should not render admin section if no admin item', () => {
      renderSidebar();
      expect(screen.queryByText('Administration')).not.toBeInTheDocument();
    });
  });

  describe('divider items', () => {
    it('should render dividers as section headers', () => {
      mockUseNavigation.mockReturnValue({
        navItems: [
          { name: 'Home', label: 'Dashboard', href: '/', icon: Grid },
          { name: 'divider-1', label: 'Sales', href: '#', icon: Grid, isDivider: true },
          { name: 'Account', label: 'Accounts', href: '/Account', icon: Building2 },
        ],
        isLoading: false,
      });

      renderSidebar();
      expect(screen.getByText('Sales')).toBeInTheDocument();

      // Dividers should be styled as headers, not links
      expect(screen.queryByRole('link', { name: /sales/i })).not.toBeInTheDocument();
    });
  });

  describe('group items', () => {
    it('should render group items with expand button', () => {
      mockUseNavigation.mockReturnValue({
        navItems: [
          { name: 'Home', label: 'Dashboard', href: '/', icon: Grid },
          {
            name: 'Sales',
            label: 'Sales',
            href: '#',
            icon: Grid,
            isGroup: true,
            children: [
              { name: 'Account', label: 'Accounts', href: '/Account', icon: Building2 },
              { name: 'Contact', label: 'Contacts', href: '/Contact', icon: Users },
            ],
          },
        ],
        isLoading: false,
      });

      renderSidebar();

      const groupButton = screen.getByRole('button', { name: /sales/i });
      expect(groupButton).toBeInTheDocument();
    });

    it('should not show children initially', () => {
      mockUseNavigation.mockReturnValue({
        navItems: [
          {
            name: 'Sales',
            label: 'Sales',
            href: '#',
            icon: Grid,
            isGroup: true,
            children: [
              { name: 'Account', label: 'Accounts', href: '/Account', icon: Building2 },
            ],
          },
        ],
        isLoading: false,
      });

      renderSidebar();
      expect(screen.queryByRole('link', { name: /accounts/i })).not.toBeInTheDocument();
    });

    it('should show children when group is expanded', () => {
      mockUseNavigation.mockReturnValue({
        navItems: [
          {
            name: 'Sales',
            label: 'Sales',
            href: '#',
            icon: Grid,
            isGroup: true,
            children: [
              { name: 'Account', label: 'Accounts', href: '/Account', icon: Building2 },
              { name: 'Contact', label: 'Contacts', href: '/Contact', icon: Users },
            ],
          },
        ],
        isLoading: false,
      });

      renderSidebar();

      const groupButton = screen.getByRole('button', { name: /sales/i });
      fireEvent.click(groupButton);

      expect(screen.getByRole('link', { name: /accounts/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contacts/i })).toBeInTheDocument();
    });

    it('should collapse children when group is clicked again', () => {
      mockUseNavigation.mockReturnValue({
        navItems: [
          {
            name: 'Sales',
            label: 'Sales',
            href: '#',
            icon: Grid,
            isGroup: true,
            children: [
              { name: 'Account', label: 'Accounts', href: '/Account', icon: Building2 },
            ],
          },
        ],
        isLoading: false,
      });

      renderSidebar();

      const groupButton = screen.getByRole('button', { name: /sales/i });

      // Expand
      fireEvent.click(groupButton);
      expect(screen.getByRole('link', { name: /accounts/i })).toBeInTheDocument();

      // Collapse
      fireEvent.click(groupButton);
      expect(screen.queryByRole('link', { name: /accounts/i })).not.toBeInTheDocument();
    });
  });

  describe('nav item styling', () => {
    it('should apply custom color to group items', () => {
      mockUseNavigation.mockReturnValue({
        navItems: [
          {
            name: 'Sales',
            label: 'Sales',
            href: '#',
            icon: Grid,
            isGroup: true,
            color: '#ff0000',
            children: [
              { name: 'Account', label: 'Accounts', href: '/Account', icon: Building2 },
            ],
          },
        ],
        isLoading: false,
      });

      renderSidebar();

      const groupButton = screen.getByRole('button', { name: /sales/i });
      expect(groupButton).toHaveStyle({ borderLeftColor: '#ff0000' });
    });
  });
});
