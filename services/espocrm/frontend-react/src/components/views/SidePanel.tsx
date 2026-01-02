/**
 * SidePanel - Generic collapsible side panel container
 * Used for Activities, History, and Related record panels
 */
import React, { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SidePanelProps {
  /** Panel title */
  title: string;
  /** Panel icon (optional) */
  icon?: ReactNode;
  /** Panel content */
  children: ReactNode;
  /** Whether panel is initially collapsed */
  defaultCollapsed?: boolean;
  /** Total count for badge (optional) */
  count?: number;
  /** Whether content is loading */
  isLoading?: boolean;
  /** Callback when refresh is requested */
  onRefresh?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Header actions (buttons, etc.) */
  headerActions?: ReactNode;
}

export function SidePanel({
  title,
  icon,
  children,
  defaultCollapsed = false,
  count,
  isLoading = false,
  onRefresh,
  className,
  headerActions,
}: SidePanelProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={cn('border rounded-lg bg-card', className)}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          {icon}
          <span className="font-medium text-sm">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {headerActions}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1 hover:bg-muted rounded"
              title="Refresh"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Empty state for panels
 */
export function PanelEmptyState({
  message = 'No records found',
}: {
  message?: string;
}): React.ReactElement {
  return (
    <div className="text-center py-6 text-muted-foreground text-sm">
      {message}
    </div>
  );
}

/**
 * Item in a panel list
 */
export interface PanelItemProps {
  /** Item icon */
  icon?: ReactNode;
  /** Primary text */
  title: string;
  /** Secondary text */
  subtitle?: string;
  /** Right-side content (date, status, etc.) */
  meta?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional classes */
  className?: string;
}

export function PanelItem({
  icon,
  title,
  subtitle,
  meta,
  onClick,
  className,
}: PanelItemProps): React.ReactElement {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-2 rounded-md text-left',
        onClick && 'hover:bg-muted cursor-pointer',
        className
      )}
    >
      {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
        )}
      </div>
      {meta && <div className="flex-shrink-0 text-xs text-muted-foreground">{meta}</div>}
    </Component>
  );
}
