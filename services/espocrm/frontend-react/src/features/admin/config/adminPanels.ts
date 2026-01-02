/**
 * Admin panel definitions
 * Based on EspoCRM's adminPanel metadata structure
 */
import type { AdminMenuGroup } from '../types';

export const adminMenuGroups: AdminMenuGroup[] = [
  {
    name: 'system',
    label: 'System',
    icon: 'Settings',
    items: [
      { name: 'settings', label: 'Settings', path: '/Admin/settings', description: 'System settings' },
      { name: 'userInterface', label: 'User Interface', path: '/Admin/userInterface', description: 'UI customization' },
      { name: 'authentication', label: 'Authentication', path: '/Admin/authentication', description: 'Authentication settings' },
      { name: 'currency', label: 'Currency', path: '/Admin/currency', description: 'Currency settings' },
      { name: 'notifications', label: 'Notifications', path: '/Admin/notifications', description: 'Notification settings' },
      { name: 'jobSettings', label: 'Scheduled Jobs', path: '/Admin/scheduledJobs', description: 'Scheduled jobs configuration' },
      { name: 'upgrade', label: 'Upgrade', path: '/Admin/upgrade', description: 'System upgrade' },
      { name: 'clearCache', label: 'Clear Cache', path: '/Admin/clearCache', description: 'Clear application cache' },
      { name: 'rebuild', label: 'Rebuild', path: '/Admin/rebuild', description: 'Rebuild application' },
    ],
  },
  {
    name: 'users',
    label: 'Users',
    icon: 'Users',
    items: [
      { name: 'users', label: 'Users', path: '/Admin/users', description: 'Manage users' },
      { name: 'teams', label: 'Teams', path: '/Admin/teams', description: 'Manage teams' },
      { name: 'roles', label: 'Roles', path: '/Admin/roles', description: 'Manage roles and permissions' },
      { name: 'authLog', label: 'Auth Log', path: '/Admin/authLog', description: 'Authentication log' },
      { name: 'authTokens', label: 'Auth Tokens', path: '/Admin/authTokens', description: 'Active auth tokens' },
      { name: 'apiUsers', label: 'API Users', path: '/Admin/apiUsers', description: 'API user management' },
    ],
  },
  {
    name: 'customization',
    label: 'Customization',
    icon: 'Palette',
    items: [
      { name: 'entityManager', label: 'Entity Manager', path: '/Admin/entityManager', description: 'Manage custom entities' },
      { name: 'fieldManager', label: 'Field Manager', path: '/Admin/fieldManager', description: 'Manage entity fields' },
      { name: 'layoutManager', label: 'Layout Manager', path: '/Admin/layouts', description: 'Customize layouts' },
      { name: 'labelManager', label: 'Label Manager', path: '/Admin/labelManager', description: 'Customize labels' },
      { name: 'templateManager', label: 'Template Manager', path: '/Admin/templateManager', description: 'Manage templates' },
    ],
  },
  {
    name: 'email',
    label: 'Email',
    icon: 'Mail',
    items: [
      { name: 'outboundEmails', label: 'Outbound Emails', path: '/Admin/outboundEmails', description: 'Outbound email settings' },
      { name: 'inboundEmails', label: 'Group Email Accounts', path: '/Admin/inboundEmails', description: 'Group email accounts' },
      { name: 'personalEmails', label: 'Personal Email Accounts', path: '/Admin/personalEmailAccounts', description: 'Personal email accounts' },
      { name: 'emailTemplates', label: 'Email Templates', path: '/Admin/emailTemplates', description: 'Manage email templates' },
      { name: 'emailFilters', label: 'Email Filters', path: '/Admin/emailFilters', description: 'Configure email filters' },
    ],
  },
  {
    name: 'portal',
    label: 'Portal',
    icon: 'Globe',
    items: [
      { name: 'portals', label: 'Portals', path: '/Admin/portals', description: 'Manage portals' },
      { name: 'portalUsers', label: 'Portal Users', path: '/Admin/portalUsers', description: 'Manage portal users' },
      { name: 'portalRoles', label: 'Portal Roles', path: '/Admin/portalRoles', description: 'Manage portal roles' },
    ],
  },
  {
    name: 'data',
    label: 'Data',
    icon: 'Database',
    items: [
      { name: 'import', label: 'Import', path: '/Admin/import', description: 'Import data' },
      { name: 'attachments', label: 'Attachments', path: '/Admin/attachments', description: 'Manage attachments' },
      { name: 'jobs', label: 'Jobs', path: '/Admin/jobs', description: 'View scheduled jobs' },
      { name: 'webhooks', label: 'Webhooks', path: '/Admin/webhooks', description: 'Manage webhooks' },
      { name: 'actionHistory', label: 'Action History', path: '/Admin/actionHistory', description: 'View action history' },
    ],
  },
  {
    name: 'integrations',
    label: 'Integrations',
    icon: 'Plug',
    items: [
      { name: 'integrations', label: 'Integrations', path: '/Admin/integrations', description: 'Configure integrations' },
      { name: 'extensions', label: 'Extensions', path: '/Admin/extensions', description: 'Manage extensions' },
      { name: 'leadCapture', label: 'Lead Capture', path: '/Admin/leadCapture', description: 'Lead capture settings' },
    ],
  },
];

/**
 * Get all admin menu items flattened
 */
export function getAllAdminItems(): { name: string; label: string; path: string; group: string; description?: string }[] {
  return adminMenuGroups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      group: group.label,
    }))
  );
}

/**
 * Search admin items by query
 */
export function searchAdminItems(query: string): ReturnType<typeof getAllAdminItems> {
  if (!query.trim()) {
    return getAllAdminItems();
  }

  const lowerQuery = query.toLowerCase();
  return getAllAdminItems().filter(
    (item) =>
      item.label.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.group.toLowerCase().includes(lowerQuery)
  );
}
