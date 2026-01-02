import React, { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Plus, List, LayoutGrid, Calendar as CalendarIcon, Download } from 'lucide-react';
import { useMetadata } from '@/lib/metadata/useMetadata';
import { useAcl } from '@/lib/acl';
import { RecordList } from '../components';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/views/KanbanBoard';
import { CalendarView } from '@/components/views/CalendarView';
import { ExportModal } from '@/components/export/ExportModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

type ViewMode = 'list' | 'kanban' | 'calendar';

export default function EntityListPage(): React.ReactElement {
  const { entityType = '' } = useParams<{ entityType: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { metadata, isLoading: metadataLoading, error: metadataError, isEntityEnabled } = useMetadata();
  const { checkScope } = useAcl();
  const [showExportModal, setShowExportModal] = useState(false);

  // Get view mode from URL or default to list
  const viewMode = (searchParams.get('view') as ViewMode) || 'list';

  const setViewMode = (mode: ViewMode): void => {
    setSearchParams((prev) => {
      if (mode === 'list') {
        prev.delete('view');
      } else {
        prev.set('view', mode);
      }
      return prev;
    });
  };

  // Get Kanban field (first enum field, if any)
  const kanbanField = useMemo(() => {
    const fields = metadata?.entityDefs?.[entityType]?.fields ?? {};
    for (const [name, def] of Object.entries(fields)) {
      const fieldDef = def as { type?: string; options?: string[] };
      if (fieldDef.type === 'enum' && fieldDef.options && fieldDef.options.length > 0) {
        // Prefer status-like fields
        if (name.toLowerCase().includes('status') || name.toLowerCase().includes('stage')) {
          return name;
        }
      }
    }
    // Fall back to first enum field
    for (const [name, def] of Object.entries(fields)) {
      const fieldDef = def as { type?: string; options?: string[] };
      if (fieldDef.type === 'enum' && fieldDef.options && fieldDef.options.length > 0) {
        return name;
      }
    }
    return null;
  }, [metadata, entityType]);

  // Get date field for calendar (first date/datetime field)
  const dateField = useMemo(() => {
    const fields = metadata?.entityDefs?.[entityType]?.fields ?? {};
    // Prefer specific date field names
    const preferredNames = ['dateStart', 'dateEnd', 'date', 'scheduledDate', 'dueDate', 'closeDate'];
    for (const name of preferredNames) {
      const def = fields[name] as { type?: string } | undefined;
      if (def && (def.type === 'date' || def.type === 'datetime')) {
        return name;
      }
    }
    // Fall back to first date field
    for (const [name, def] of Object.entries(fields)) {
      const fieldDef = def as { type?: string };
      if (fieldDef.type === 'date' || fieldDef.type === 'datetime') {
        return name;
      }
    }
    return 'createdAt'; // Fallback
  }, [metadata, entityType]);

  const enabled = isEntityEnabled(entityType);
  const canCreate = checkScope(entityType, 'create');

  // Show loading while metadata is being fetched
  if (metadataLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show error if metadata failed to load
  if (metadataError) {
    return (
      <div className="bg-card rounded-lg shadow p-8 text-center">
        <h1 className="text-xl font-bold text-destructive mb-2">Metadata Error</h1>
        <p className="text-muted-foreground mb-4">
          Failed to load metadata: {metadataError.message}
        </p>
        <p className="text-sm text-muted-foreground">
          Check browser console for details.
        </p>
      </div>
    );
  }

  if (!enabled) {
    const hasMetadata = metadata !== null;
    const hasScopes = hasMetadata && metadata.scopes !== undefined;
    const scopeCount = hasScopes ? Object.keys(metadata.scopes ?? {}).length : 0;

    return (
      <div className="bg-card rounded-lg shadow p-8 text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">Entity Not Available</h1>
        <p className="text-muted-foreground mb-4">
          The entity type "{entityType}" is not enabled or does not exist.
        </p>
        {!hasMetadata && (
          <p className="text-sm text-muted-foreground">
            Debug: Metadata is null - API may have returned empty response
          </p>
        )}
        {hasMetadata && !hasScopes && (
          <p className="text-sm text-muted-foreground">
            Debug: Metadata loaded but scopes are undefined
          </p>
        )}
        {hasScopes && scopeCount === 0 && (
          <p className="text-sm text-muted-foreground">
            Debug: Scopes object is empty
          </p>
        )}
        {hasScopes && scopeCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Debug: {scopeCount} scopes found, but "{entityType}" is not among them
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{entityType}</h1>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-md">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-2 text-sm transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            {kanbanField && (
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'px-3 py-2 text-sm transition-colors border-l',
                  viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
                title="Kanban view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'px-3 py-2 text-sm transition-colors border-l',
                viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
              title="Calendar view"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Export button */}
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {canCreate && (
            <Link to={`/${entityType}/create`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create {entityType}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* View content */}
      {viewMode === 'list' && <RecordList entityType={entityType} />}

      {viewMode === 'kanban' && kanbanField && (
        <KanbanBoard
          entityType={entityType}
          groupField={kanbanField}
        />
      )}

      {viewMode === 'calendar' && (
        <CalendarView
          entityType={entityType}
          dateField={dateField}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          entityType={entityType}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
