/**
 * ActivitiesPanel - Shows upcoming meetings, calls, and tasks
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Phone, CheckSquare, Plus, Clock } from 'lucide-react';
import { format, parseISO, isValid, isPast, isToday } from 'date-fns';
import { apiClient } from '@/api/client';
import { SidePanel, PanelItem, PanelEmptyState } from './SidePanel';
import { cn } from '@/lib/utils/cn';

interface Activity {
  id: string;
  name: string;
  dateStart?: string;
  dateEnd?: string;
  status?: string;
  _scope: 'Meeting' | 'Call' | 'Task';
}

export interface ActivitiesPanelProps {
  /** Parent entity type */
  entityType: string;
  /** Parent record ID */
  recordId: string;
  /** Whether panel is initially collapsed */
  defaultCollapsed?: boolean;
}

const activityTypes = ['Meeting', 'Call', 'Task'] as const;

const activityIcons: Record<string, React.ReactNode> = {
  Meeting: <Calendar className="h-4 w-4 text-blue-500" />,
  Call: <Phone className="h-4 w-4 text-green-500" />,
  Task: <CheckSquare className="h-4 w-4 text-orange-500" />,
};

export function ActivitiesPanel({
  entityType,
  recordId,
  defaultCollapsed = false,
}: ActivitiesPanelProps): React.ReactElement {
  const {
    data: activities,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['activities', entityType, recordId],
    queryFn: async () => {
      // Fetch upcoming activities for each type
      const results: Activity[] = [];

      for (const type of activityTypes) {
        try {
          const response = await apiClient.get<{ list: Record<string, unknown>[] }>(
            `/api/v1/${entityType}/${recordId}/${type}`,
            {
              params: {
                maxSize: 5,
                where: [
                  {
                    type: 'or',
                    value: [
                      { type: 'equals', attribute: 'status', value: 'Planned' },
                      { type: 'equals', attribute: 'status', value: 'Not Started' },
                    ],
                  },
                ],
                orderBy: 'dateStart',
                order: 'asc',
              },
            }
          );

          if (response.data.list) {
            results.push(
              ...response.data.list.map((item) => ({
                ...item,
                _scope: type,
              } as Activity))
            );
          }
        } catch {
          // Relationship might not exist, ignore
        }
      }

      // Sort by date
      return results.sort((a, b) => {
        const dateA = a.dateStart ? new Date(a.dateStart).getTime() : Infinity;
        const dateB = b.dateStart ? new Date(b.dateStart).getTime() : Infinity;
        return dateA - dateB;
      });
    },
    staleTime: 60000, // 1 minute
  });

  const formatActivityDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = parseISO(dateStr);
    if (!isValid(date)) return '';

    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  const getDateClass = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = parseISO(dateStr);
    if (!isValid(date)) return '';

    if (isPast(date)) return 'text-red-500';
    if (isToday(date)) return 'text-orange-500 font-medium';
    return '';
  };

  return (
    <SidePanel
      title="Activities"
      icon={<Calendar className="h-4 w-4" />}
      count={activities?.length}
      isLoading={isLoading}
      onRefresh={() => refetch()}
      defaultCollapsed={defaultCollapsed}
      headerActions={
        <div className="flex gap-1">
          {activityTypes.map((type) => (
            <Link
              key={type}
              to={`/${type}/create?parentType=${entityType}&parentId=${recordId}`}
              className="p-1 hover:bg-muted rounded"
              title={`Create ${type}`}
            >
              <Plus className="h-4 w-4" />
            </Link>
          ))}
        </div>
      }
    >
      {!activities || activities.length === 0 ? (
        <PanelEmptyState message="No upcoming activities" />
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => (
            <Link
              key={`${activity._scope}-${activity.id}`}
              to={`/${activity._scope}/view/${activity.id}`}
              className="block"
            >
              <PanelItem
                icon={activityIcons[activity._scope]}
                title={activity.name}
                subtitle={activity._scope}
                meta={
                  <span className={cn('flex items-center gap-1', getDateClass(activity.dateStart))}>
                    <Clock className="h-3 w-3" />
                    {formatActivityDate(activity.dateStart)}
                  </span>
                }
              />
            </Link>
          ))}
        </div>
      )}
    </SidePanel>
  );
}
