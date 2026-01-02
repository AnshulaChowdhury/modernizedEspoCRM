import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useNavigation, type NavItem } from '@/hooks/useNavigation';

interface SidebarProps {
  isOpen: boolean;
}

function NavItemLink({ item, isNested = false }: { item: NavItem; isNested?: boolean }): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  // Render divider as section header
  if (item.isDivider) {
    return (
      <li className="pt-4 pb-1 first:pt-0">
        <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {item.label}
        </div>
      </li>
    );
  }

  if (item.isGroup && item.children) {
    return (
      <li>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center justify-between w-full gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            'text-gray-600 hover:bg-gray-100'
          )}
          style={item.color ? { borderLeftColor: item.color, borderLeftWidth: 3 } : undefined}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-6 w-5" />
            {item.label}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isExpanded && (
          <ul className="ml-4 mt-1 space-y-1">
            {item.children.map((child) => (
              <NavItemLink key={child.name} item={child} isNested />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={item.href}
        end={item.href === '/'}
        className={({ isActive }): string =>
          cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100',
            isNested && 'pl-6'
          )
        }
        style={item.color ? { borderLeftColor: item.color, borderLeftWidth: 3 } : undefined}
      >
        <item.icon className="h-5 w-5" />
        {item.label}
      </NavLink>
    </li>
  );
}

export function Sidebar({ isOpen }: SidebarProps): React.ReactElement {
  const { navItems, isLoading } = useNavigation();

  // Separate admin from main navigation
  const mainNavItems = navItems.filter((item) => item.name !== 'Admin');
  const adminItem = navItems.find((item) => item.name === 'Admin');

  return (
    <aside
      className={cn(
        'fixed left-0 top-[6.5rem] h-[calc(100vh-6.5rem)] w-64 border-r bg-white transition-transform duration-200 z-30',
        !isOpen && '-translate-x-full'
      )}
      aria-label="Main navigation"
    >
      <nav className="p-4 h-full overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <>
            <ul className="space-y-1">
              {mainNavItems.map((item) => (
                <NavItemLink key={item.name} item={item} />
              ))}
            </ul>

            {/* Admin section */}
            {adminItem && (
              <div className="mt-8 pt-4 border-t">
                <NavLink
                  to={adminItem.href}
                  className={({ isActive }): string =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    )
                  }
                >
                  <adminItem.icon className="h-5 w-5" />
                  {adminItem.label}
                </NavLink>
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}
