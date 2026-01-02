/**
 * AdminHeader - Breadcrumb navigation header for admin pages
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { adminMenuGroups, getAllAdminItems } from '../config/adminPanels';
import type { AdminBreadcrumb } from '../types';

/**
 * Generate breadcrumbs from current path
 */
function generateBreadcrumbs(pathname: string): AdminBreadcrumb[] {
  const breadcrumbs: AdminBreadcrumb[] = [
    { label: 'Admin', path: '/Admin' },
  ];

  if (pathname === '/Admin') {
    return breadcrumbs;
  }

  // Try to find matching menu item
  const allItems = getAllAdminItems();
  const matchingItem = allItems.find((item) => pathname.startsWith(item.path));

  if (matchingItem) {
    // Add group breadcrumb
    const group = adminMenuGroups.find((g) =>
      g.items.some((i) => i.name === matchingItem.name)
    );
    if (group) {
      breadcrumbs.push({ label: group.label });
    }

    // Add item breadcrumb
    breadcrumbs.push({ label: matchingItem.label, path: matchingItem.path });
  }

  // Handle sub-paths (e.g., /Admin/entityManager/scope/Account)
  const pathParts = pathname.replace('/Admin/', '').split('/');
  if (pathParts.length > 1) {
    // Add scope or ID breadcrumb
    const scopeIndex = pathParts.indexOf('scope');
    const scopeName = pathParts[scopeIndex + 1];
    if (scopeIndex !== -1 && scopeName) {
      breadcrumbs.push({ label: scopeName });
    }

    const fieldIndex = pathParts.indexOf('field');
    const fieldName = pathParts[fieldIndex + 1];
    if (fieldIndex !== -1 && fieldName) {
      breadcrumbs.push({ label: fieldName });
    }
  }

  return breadcrumbs;
}

export function AdminHeader(): React.ReactElement {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  // Don't render on admin index page
  if (location.pathname === '/Admin') {
    return <></>;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <nav className="flex items-center space-x-1 text-sm">
        <Link
          to="/Admin"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Home className="h-4 w-4" />
        </Link>

        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {crumb.path && index < breadcrumbs.length - 1 ? (
              <Link
                to={crumb.path}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500'
                }
              >
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}

export default AdminHeader;
