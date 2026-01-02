import { useMemo } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Target,
  Mail,
  Calendar,
  FileText,
  Phone,
  Briefcase,
  FolderOpen,
  MessageSquare,
  CheckSquare,
  type LucideIcon,
  Grid,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store';
import { useMetadata } from '@/lib/metadata/useMetadata';

export interface NavItem {
  name: string;
  label: string;
  href: string;
  icon: LucideIcon;
  color?: string;
  isGroup?: boolean;
  isDivider?: boolean;
  children?: NavItem[];
}

// Map entity types to icons
const entityIconMap: Record<string, LucideIcon> = {
  Account: Building2,
  Contact: Users,
  Lead: UserCheck,
  Opportunity: Target,
  Email: Mail,
  Meeting: Calendar,
  Call: Phone,
  Task: CheckSquare,
  Case: Briefcase,
  Document: FileText,
  Campaign: MessageSquare,
  KnowledgeBaseArticle: FolderOpen,
};

// Default icon for entities not in the map
const defaultEntityIcon = Grid;

/**
 * Hook to get navigation items based on settings and metadata
 *
 * Performance optimization: We don't block on metadata loading.
 * The settings.tabList (from login response) is sufficient for navigation.
 * Metadata is only used to filter out disabled scopes when available.
 */
export function useNavigation(): {
  navItems: NavItem[];
  isLoading: boolean;
} {
  const { settings, user } = useAuthStore();
  const { metadata, getEntityList } = useMetadata();

  const navItems = useMemo<NavItem[]>(() => {
    // Start with Dashboard
    const items: NavItem[] = [
      {
        name: 'Home',
        label: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
      },
    ];

    // Get tabList from settings
    const tabList = settings?.tabList ?? [];
    let addedFromSettings = false;

    // Process each tab
    for (const tab of tabList) {
      if (typeof tab === 'string') {
        // Simple entity tab
        if (tab === '_delimiter_') continue; // Skip delimiter

        // Check if entity is enabled in metadata
        const scopeDef = metadata?.scopes?.[tab];
        if (scopeDef?.disabled === true) continue;

        // Get label from metadata or use tab name
        const label = tab; // In real implementation, would get from translations

        items.push({
          name: tab,
          label,
          href: `/${tab}`,
          icon: entityIconMap[tab] ?? defaultEntityIcon,
        });
        addedFromSettings = true;
      } else if (tab.type === 'divider') {
        // Render dividers as section headers
        const dividerText = tab.text ?? '';
        // Remove $ prefix if present (EspoCRM convention for translation keys)
        const label = dividerText.startsWith('$') ? dividerText.substring(1) : dividerText;

        if (label) {
          items.push({
            name: `divider-${tab.id ?? items.length}`,
            label,
            href: '#',
            icon: Grid,
            isDivider: true,
          });
        }
        addedFromSettings = true;
        continue;
      } else if (tab.type === 'group' && tab.itemList) {
        // Group tab with children
        const children: NavItem[] = [];

        for (const childName of tab.itemList) {
          const scopeDef = metadata?.scopes?.[childName];
          if (scopeDef?.disabled === true) continue;

          children.push({
            name: childName,
            label: childName,
            href: `/${childName}`,
            icon: entityIconMap[childName] ?? defaultEntityIcon,
          });
        }

        if (children.length > 0) {
          items.push({
            name: tab.text ?? 'Group',
            label: tab.text ?? 'Group',
            href: '#',
            icon: Grid,
            isGroup: true,
            color: tab.color ?? undefined,
            children,
          });
          addedFromSettings = true;
        }
      }
    }

    // If no valid tabs from settings, use entities from metadata
    if (!addedFromSettings) {
      // Get all enabled entities from metadata
      const entityList = getEntityList();

      // Prioritize common CRM entities, then add others
      const priorityEntities = ['Account', 'Contact', 'Lead', 'Opportunity', 'Email', 'Meeting', 'Call', 'Task', 'Case', 'Document'];
      const sortedEntities = [
        ...priorityEntities.filter(e => entityList.includes(e)),
        ...entityList.filter(e => !priorityEntities.includes(e)),
      ];

      for (const entity of sortedEntities) {
        items.push({
          name: entity,
          label: entity,
          href: `/${entity}`,
          icon: entityIconMap[entity] ?? defaultEntityIcon,
        });
      }
    }

    return items;
  }, [settings, metadata, getEntityList]);

  // Add admin section if user is admin
  const finalItems = useMemo<NavItem[]>(() => {
    if (user?.isAdmin) {
      return [
        ...navItems,
        {
          name: 'Admin',
          label: 'Administration',
          href: '/Admin',
          icon: Settings,
        },
      ];
    }
    return navItems;
  }, [navItems, user?.isAdmin]);

  return {
    navItems: finalItems,
    // Don't block on metadata - settings.tabList is sufficient for immediate rendering
    isLoading: false,
  };
}
