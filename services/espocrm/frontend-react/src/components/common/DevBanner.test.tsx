/**
 * BetaBanner Component Tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BetaBanner, DevBanner } from './DevBanner';

function renderWithRouter(ui: React.ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}

describe('BetaBanner', () => {
  it('renders beta banner with correct text', () => {
    renderWithRouter(<BetaBanner />);
    expect(screen.getByText(/Our new frontend is in Beta/i)).toBeInTheDocument();
  });

  it('has link to classic view with root path', () => {
    renderWithRouter(<BetaBanner />);
    const link = screen.getByRole('link', { name: /Switch to Classic View/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/classic/#');
  });

  it('preserves current route in classic URL', () => {
    renderWithRouter(<BetaBanner />, { route: '/Account' });
    const link = screen.getByRole('link', { name: /Switch to Classic View/i });
    expect(link).toHaveAttribute('href', '/classic/#Account');
  });

  it('preserves nested route in classic URL', () => {
    renderWithRouter(<BetaBanner />, { route: '/Account/view/123' });
    const link = screen.getByRole('link', { name: /Switch to Classic View/i });
    expect(link).toHaveAttribute('href', '/classic/#Account/view/123');
  });

  it('allows custom classic base path', () => {
    renderWithRouter(<BetaBanner classicBasePath="/legacy" />, { route: '/Contact' });
    const link = screen.getByRole('link', { name: /Switch to Classic View/i });
    expect(link).toHaveAttribute('href', '/legacy/#Contact');
  });

  it('has fixed positioning', () => {
    renderWithRouter(<BetaBanner />);
    const banner = screen.getByText(/Our new frontend is in Beta/i).parentElement;
    expect(banner).toHaveStyle({ position: 'fixed' });
  });

  it('has high z-index', () => {
    renderWithRouter(<BetaBanner />);
    const banner = screen.getByText(/Our new frontend is in Beta/i).parentElement;
    expect(banner).toHaveStyle({ zIndex: '9999' });
  });

  it('is positioned at top of page', () => {
    renderWithRouter(<BetaBanner />);
    const banner = screen.getByText(/Our new frontend is in Beta/i).parentElement;
    expect(banner).toHaveStyle({ top: '0' });
    expect(banner).toHaveStyle({ left: '0' });
    expect(banner).toHaveStyle({ right: '0' });
  });
});

describe('DevBanner (deprecated)', () => {
  it('renders BetaBanner in development mode', () => {
    renderWithRouter(<DevBanner />);
    expect(screen.getByText(/Our new frontend is in Beta/i)).toBeInTheDocument();
  });
});
