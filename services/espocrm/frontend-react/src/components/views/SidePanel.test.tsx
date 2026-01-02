/**
 * SidePanel Component Tests
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidePanel, PanelEmptyState, PanelItem } from './SidePanel';
import { Mail } from 'lucide-react';

describe('SidePanel', () => {
  describe('rendering', () => {
    it('renders title', () => {
      render(
        <SidePanel title="Activities">
          <div>Content</div>
        </SidePanel>
      );

      expect(screen.getByText('Activities')).toBeInTheDocument();
    });

    it('renders children content when expanded', () => {
      render(
        <SidePanel title="Activities">
          <div>Panel content here</div>
        </SidePanel>
      );

      expect(screen.getByText('Panel content here')).toBeInTheDocument();
    });

    it('hides content when collapsed by default', () => {
      render(
        <SidePanel title="Activities" defaultCollapsed>
          <div>Panel content here</div>
        </SidePanel>
      );

      expect(screen.queryByText('Panel content here')).not.toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(
        <SidePanel title="Activities" icon={<Mail data-testid="icon" />}>
          <div>Content</div>
        </SidePanel>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders count badge when provided', () => {
      render(
        <SidePanel title="Activities" count={5}>
          <div>Content</div>
        </SidePanel>
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('hides count badge when count is 0', () => {
      render(
        <SidePanel title="Activities" count={0}>
          <div>Content</div>
        </SidePanel>
      );

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('renders header actions', () => {
      render(
        <SidePanel
          title="Activities"
          headerActions={<button>Add</button>}
        >
          <div>Content</div>
        </SidePanel>
      );

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });
  });

  describe('collapsing', () => {
    it('toggles content when header clicked', () => {
      render(
        <SidePanel title="Activities">
          <div>Panel content</div>
        </SidePanel>
      );

      // Initially expanded
      expect(screen.getByText('Panel content')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(screen.getByText('Activities'));
      expect(screen.queryByText('Panel content')).not.toBeInTheDocument();

      // Click to expand again
      fireEvent.click(screen.getByText('Activities'));
      expect(screen.getByText('Panel content')).toBeInTheDocument();
    });

    it('starts collapsed when defaultCollapsed is true', () => {
      render(
        <SidePanel title="Activities" defaultCollapsed>
          <div>Panel content</div>
        </SidePanel>
      );

      expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when isLoading', () => {
      render(
        <SidePanel title="Activities" isLoading>
          <div>Panel content</div>
        </SidePanel>
      );

      // Content should be hidden during loading
      expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    });

    it('hides loading spinner in collapsed state', () => {
      render(
        <SidePanel title="Activities" isLoading defaultCollapsed>
          <div>Panel content</div>
        </SidePanel>
      );

      // No content shown when collapsed, even during loading
      expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    });
  });

  describe('refresh', () => {
    it('shows refresh button when onRefresh provided', () => {
      render(
        <SidePanel title="Activities" onRefresh={vi.fn()}>
          <div>Content</div>
        </SidePanel>
      );

      expect(screen.getByTitle('Refresh')).toBeInTheDocument();
    });

    it('hides refresh button when onRefresh not provided', () => {
      render(
        <SidePanel title="Activities">
          <div>Content</div>
        </SidePanel>
      );

      expect(screen.queryByTitle('Refresh')).not.toBeInTheDocument();
    });

    it('calls onRefresh when refresh button clicked', () => {
      const onRefresh = vi.fn();
      render(
        <SidePanel title="Activities" onRefresh={onRefresh}>
          <div>Content</div>
        </SidePanel>
      );

      fireEvent.click(screen.getByTitle('Refresh'));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('disables refresh button when loading', () => {
      render(
        <SidePanel title="Activities" onRefresh={vi.fn()} isLoading>
          <div>Content</div>
        </SidePanel>
      );

      expect(screen.getByTitle('Refresh')).toBeDisabled();
    });

    it('does not collapse panel when refresh clicked', () => {
      render(
        <SidePanel title="Activities" onRefresh={vi.fn()}>
          <div>Content</div>
        </SidePanel>
      );

      fireEvent.click(screen.getByTitle('Refresh'));
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <SidePanel title="Activities" className="custom-class">
          <div>Content</div>
        </SidePanel>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('PanelEmptyState', () => {
  it('renders default message', () => {
    render(<PanelEmptyState />);
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<PanelEmptyState message="No activities yet" />);
    expect(screen.getByText('No activities yet')).toBeInTheDocument();
  });
});

describe('PanelItem', () => {
  it('renders title', () => {
    render(<PanelItem title="Meeting with John" />);
    expect(screen.getByText('Meeting with John')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PanelItem title="Meeting" subtitle="Tomorrow at 2pm" />);
    expect(screen.getByText('Tomorrow at 2pm')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <PanelItem
        title="Email"
        icon={<Mail data-testid="mail-icon" />}
      />
    );
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
  });

  it('renders meta content when provided', () => {
    render(
      <PanelItem
        title="Task"
        meta={<span>Due today</span>}
      />
    );
    expect(screen.getByText('Due today')).toBeInTheDocument();
  });

  it('renders as button when onClick provided', () => {
    render(<PanelItem title="Clickable item" onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders as div when onClick not provided', () => {
    render(<PanelItem title="Static item" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<PanelItem title="Clickable" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <PanelItem title="Item" className="custom-item-class" />
    );
    expect(container.firstChild).toHaveClass('custom-item-class');
  });
});
