/**
 * AdminPanelGrid - Main admin index page with search and panel cards
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Settings, Users, Palette, Mail, Globe, Database, Plug, ExternalLink } from 'lucide-react';
import { adminMenuGroups, searchAdminItems } from '../config/adminPanels';
import { useAdminStore } from '../store';
import { cn } from '@/lib/utils/cn';

const iconMap: Record<string, React.ElementType> = {
  Settings,
  Users,
  Palette,
  Mail,
  Globe,
  Database,
  Plug,
};

export function AdminPanelGrid(): React.ReactElement {
  const { searchQuery, setSearchQuery } = useAdminStore();

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return null; // Show grouped view
    }
    return searchAdminItems(searchQuery);
  }, [searchQuery]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Administration</h1>
        <p className="text-gray-500">Configure and customize your CRM</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search admin settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
        />
      </div>

      {/* Search results view */}
      {filteredItems !== null ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 mb-4">
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} found
          </p>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No settings found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-500">
                      {item.group} &middot; {item.description}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Grouped panel view */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminMenuGroups.map((group) => {
            const Icon = iconMap[group.icon ?? 'Settings'] ?? Settings;
            return (
              <div
                key={group.name}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Panel header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <h2 className="font-medium text-gray-900">{group.label}</h2>
                </div>

                {/* Panel items */}
                <div className="divide-y divide-gray-100">
                  {group.items.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={cn(
                        'block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors',
                        'focus:outline-none focus:bg-gray-50'
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminPanelGrid;
