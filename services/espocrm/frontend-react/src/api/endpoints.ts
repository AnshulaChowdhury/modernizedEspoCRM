export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/App/user',
  AUTH_LOGOUT: '/App/action/logout',

  // Metadata
  METADATA: '/Metadata',
  SETTINGS: '/Settings',

  // Entity CRUD
  entity: (entityType: string): string => `/${entityType}`,
  entityById: (entityType: string, id: string): string =>
    `/${entityType}/${id}`,
  entityAction: (entityType: string, action: string): string =>
    `/${entityType}/action/${action}`,

  // Layouts
  layout: (entityType: string, layoutType: string): string =>
    `/${entityType}/layout/${layoutType}`,

  // Related records
  related: (entityType: string, id: string, link: string): string =>
    `/${entityType}/${id}/${link}`,
} as const;
