/**
 * Admin route configuration
 * Defines all routes within the /Admin path
 */
import React from 'react';
import { Route } from 'react-router-dom';

// Lazy load admin pages for code splitting
const AdminIndexPage = React.lazy(() => import('../pages/AdminIndexPage'));

// System pages (to be implemented in Phase 5B)
const SettingsPage = React.lazy(() =>
  import('../pages/system/SettingsPage').catch(() => ({ default: PlaceholderPage('Settings') }))
);

// Placeholder component for pages not yet implemented
function PlaceholderPage(name: string) {
  return function Placeholder(): React.ReactElement {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">{name}</h2>
        <p className="text-muted-foreground">This page is under construction.</p>
      </div>
    );
  };
}

/**
 * Admin route definitions
 */
export const adminRoutes = (
  <>
    <Route index element={<AdminIndexPage />} />
    <Route path="settings" element={<SettingsPage />} />
    {/* Additional routes will be added as pages are implemented */}
  </>
);

export default adminRoutes;
