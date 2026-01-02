/**
 * AdminSidebar - Navigation sidebar for admin panel
 */
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Settings,
  Users,
  Palette,
  Mail,
  Globe,
  Database,
  Plug,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { adminMenuGroups } from '../config/adminPanels';
import { useAdminStore } from '../store';
import { cn } from '@/lib/utils/cn';

const iconMap: Record<string, React.ReactNode> = {
  Settings: <Settings className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Palette: <Palette className="h-4 w-4" />,
  Mail: <Mail className="h-4 w-4" />,
  Globe: <Globe className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  Plug: <Plug className="h-4 w-4" />,
};

export function AdminSidebar(): React.ReactElement {
  const { sidebarCollapsed, toggleSidebar } = useAdminStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(adminMenuGroups.map((g) => g.name))
  );

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-12 h-[calc(100vh-3rem)] bg-white border-r border-gray-200 transition-all duration-200 z-30 overflow-hidden',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Collapse button */}
        <div className="flex items-center justify-end p-2 border-b border-gray-100">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto p-2">
          {adminMenuGroups.map((group) => (
            <div key={group.name} className="mb-2">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.name)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors',
                  sidebarCollapsed && 'justify-center'
                )}
                title={sidebarCollapsed ? group.label : undefined}
              >
                {iconMap[group.icon ?? 'Settings']}
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{group.label}</span>
                    {expandedGroups.has(group.name) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </>
                )}
              </button>

              {/* Group items */}
              {!sidebarCollapsed && expandedGroups.has(group.name) && (
                <div className="mt-1 ml-4 space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'block px-3 py-1.5 text-sm rounded-md transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Admin home link at bottom */}
        <div className="p-2 border-t border-gray-100">
          <NavLink
            to="/Admin"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-100',
                sidebarCollapsed && 'justify-center'
              )
            }
            title={sidebarCollapsed ? 'Admin Home' : undefined}
          >
            <Settings className="h-4 w-4" />
            {!sidebarCollapsed && <span>Admin Home</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
