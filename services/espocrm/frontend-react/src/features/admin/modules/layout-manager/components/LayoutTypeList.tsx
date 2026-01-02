/**
 * LayoutTypeList - Shows available layout types for an entity
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  LayoutGrid,
  SidebarClose,
  Filter,
  Edit3,
  Columns,
  PanelBottom,
} from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useTranslation } from '@/hooks/useTranslation';
import type { LayoutType } from '../types';
import { DEFAULT_LAYOUT_TYPES } from '../types';

interface LayoutTypeListProps {
  scope: string;
  baseUrl?: string;
}

interface LayoutTypeItem {
  type: LayoutType | string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const LAYOUT_TYPE_ICONS: Record<string, React.ReactNode> = {
  list: <List className="h-5 w-5" />,
  listSmall: <List className="h-5 w-5" />,
  detail: <LayoutGrid className="h-5 w-5" />,
  detailSmall: <LayoutGrid className="h-5 w-5" />,
  defaultSidePanel: <SidebarClose className="h-5 w-5" />,
  sidePanelsDetail: <SidebarClose className="h-5 w-5" />,
  sidePanelsEdit: <SidebarClose className="h-5 w-5" />,
  sidePanelsDetailSmall: <SidebarClose className="h-5 w-5" />,
  sidePanelsEditSmall: <SidebarClose className="h-5 w-5" />,
  bottomPanelsDetail: <PanelBottom className="h-5 w-5" />,
  bottomPanelsEdit: <PanelBottom className="h-5 w-5" />,
  filters: <Filter className="h-5 w-5" />,
  massUpdate: <Edit3 className="h-5 w-5" />,
  kanban: <Columns className="h-5 w-5" />,
};

const LAYOUT_TYPE_DESCRIPTIONS: Record<string, string> = {
  list: 'Configure columns shown in list view',
  listSmall: 'Configure columns for compact list view',
  detail: 'Configure fields layout in detail view',
  detailSmall: 'Configure fields for modal/popup detail view',
  defaultSidePanel: 'Configure default side panel fields',
  sidePanelsDetail: 'Configure side panels for detail view',
  sidePanelsEdit: 'Configure side panels for edit view',
  sidePanelsDetailSmall: 'Configure side panels for modal detail',
  sidePanelsEditSmall: 'Configure side panels for modal edit',
  bottomPanelsDetail: 'Configure bottom panels for detail view',
  bottomPanelsEdit: 'Configure bottom panels for edit view',
  filters: 'Configure available search filters',
  massUpdate: 'Configure fields for mass update',
  kanban: 'Configure kanban board layout',
};

export function LayoutTypeList({ scope, baseUrl }: LayoutTypeListProps): React.ReactElement {
  const navigate = useNavigate();
  const { metadata } = useMetadata();
  const { translateLayoutName } = useTranslation();

  // Get available layout types for this entity
  const layoutTypes = useMemo(() => {
    if (!metadata?.clientDefs?.[scope]) {
      return DEFAULT_LAYOUT_TYPES;
    }

    const clientDefs = metadata.clientDefs[scope] as Record<string, unknown>;
    let types: (LayoutType | string)[] = [...DEFAULT_LAYOUT_TYPES];

    // Add bottomPanelsEdit if configured
    if (clientDefs.bottomPanels && typeof clientDefs.bottomPanels === 'object') {
      const bottomPanels = clientDefs.bottomPanels as Record<string, unknown>;
      if (bottomPanels.edit) {
        types.push('bottomPanelsEdit');
      }
    }

    // Remove defaultSidePanel if disabled or has custom field list
    if (clientDefs.defaultSidePanelDisabled || clientDefs.defaultSidePanelFieldList) {
      types = types.filter(t => t !== 'defaultSidePanel');
    }

    // Add kanban if enabled
    if (clientDefs.kanbanViewMode) {
      types.push('kanban');
    }

    // Add additional custom layouts
    if (clientDefs.additionalLayouts && typeof clientDefs.additionalLayouts === 'object') {
      const additionalLayouts = clientDefs.additionalLayouts as Record<string, unknown>;
      for (const layoutName in additionalLayouts) {
        if (!types.includes(layoutName)) {
          types.push(layoutName);
        }
      }
    }

    // Filter out disabled layout types
    types = types.filter(type => {
      const disabledKey = `layout${type.charAt(0).toUpperCase() + type.slice(1)}Disabled`;
      return !clientDefs[disabledKey];
    });

    return types;
  }, [metadata, scope]);

  // Build layout type items with labels and icons
  const layoutTypeItems: LayoutTypeItem[] = useMemo(() => {
    return layoutTypes.map(type => ({
      type,
      label: translateLayoutName(type, scope),
      icon: LAYOUT_TYPE_ICONS[type] || <LayoutGrid className="h-5 w-5" />,
      description: LAYOUT_TYPE_DESCRIPTIONS[type] || `Configure ${type} layout`,
    }));
  }, [layoutTypes, scope, translateLayoutName]);

  // Group layouts by category
  const groupedLayouts = useMemo(() => {
    const listViews: LayoutTypeItem[] = [];
    const detailViews: LayoutTypeItem[] = [];
    const sidePanels: LayoutTypeItem[] = [];
    const other: LayoutTypeItem[] = [];

    for (const item of layoutTypeItems) {
      if (item.type.includes('list') || item.type === 'list') {
        listViews.push(item);
      } else if (item.type.includes('detail') || item.type === 'detail' || item.type.includes('edit')) {
        detailViews.push(item);
      } else if (item.type.includes('Panel') || item.type.includes('panel')) {
        sidePanels.push(item);
      } else {
        other.push(item);
      }
    }

    const groups: Record<string, LayoutTypeItem[]> = {};
    if (listViews.length > 0) groups['List Views'] = listViews;
    if (detailViews.length > 0) groups['Detail Views'] = detailViews;
    if (sidePanels.length > 0) groups['Side Panels'] = sidePanels;
    if (other.length > 0) groups['Other'] = other;

    return groups;
  }, [layoutTypeItems]);

  const handleLayoutClick = (type: string) => {
    const url = baseUrl
      ? `${baseUrl}/type/${type}`
      : `/Admin/layouts/scope/${scope}/type/${type}`;
    navigate(url);
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedLayouts).map(([groupName, items]) => (
        <div key={groupName}>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            {groupName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(item => (
              <button
                key={item.type}
                onClick={() => handleLayoutClick(item.type)}
                className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-left group"
              >
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-500 truncate">{item.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default LayoutTypeList;
