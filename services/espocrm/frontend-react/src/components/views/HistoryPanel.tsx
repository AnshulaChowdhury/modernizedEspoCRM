/**
 * HistoryPanel - Shows past activities (completed meetings, calls, emails)
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { History, Calendar, Phone, Mail, Clock } from 'lucide-react';
import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/api/client';
import { SidePanel, PanelItem, PanelEmptyState } from './SidePanel';

interface HistoryItem {
  id: string;
  name: string;
  dateStart?: string;
  dateSent?: string;
  createdAt?: string;
  status?: string;
  _scope: 'Meeting' | 'Call' | 'Email';
}

export interface HistoryPanelProps {
  /** Parent entity type */
  entityType: string;
  /** Parent record ID */
  recordId: string;
  /** Whether panel is initially collapsed */
  defaultCollapsed?: boolean;
}

const historyTypes = ['Meeting', 'Call', 'Email'] as const;

const historyIcons: Record<string, React.ReactNode> = {
  Meeting: <Calendar className="h-4 w-4 text-blue-500" />,
  Call: <Phone className="h-4 w-4 text-green-500" />,
  Email: <Mail className="h-4 w-4 text-purple-500" />,
};

export function HistoryPanel({
  entityType,
  recordId,
  defaultCollapsed = false,
}: HistoryPanelProps): React.ReactElement {
  const {
    data: historyItems,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['history', entityType, recordId],
    queryFn: async () => {
      const results: HistoryItem[] = [];

      for (const type of historyTypes) {
        try {
          const statusFilter = type === 'Email'
            ? [] // Emails don't have status filter
            : [
                {
                  type: 'or',
                  value: [
                    { type: 'equals', attribute: 'status', value: 'Held' },
                    { type: 'equals', attribute: 'status', value: 'Completed' },
                  ],
                },
              ];

          const response = await apiClient.get<{ list: Record<string, unknown>[] }>(
            `/api/v1/${entityType}/${recordId}/${type}`,
            {
              params: {
                maxSize: 10,
                where: statusFilter,
                orderBy: type === 'Email' ? 'dateSent' : 'dateStart',
                order: 'desc',
              },
            }
          );

          if (response.data.list) {
            results.push(
              ...response.data.list.map((item) => ({
                ...item,
                _scope: type,
              } as HistoryItem))
            );
          }
        } catch {
          // Relationship might not exist, ignore
        }
      }

      // Sort by date (most recent first)
      return results.sort((a, b) => {
        const dateA = getItemDate(a);
        const dateB = getItemDate(b);
        return dateB - dateA;
      }).slice(0, 15); // Limit to 15 items
    },
    staleTime: 60000, // 1 minute
  });

  return (
    <SidePanel
      title="History"
      icon={<History className="h-4 w-4" />}
      count={historyItems?.length}
      isLoading={isLoading}
      onRefresh={() => refetch()}
      defaultCollapsed={defaultCollapsed}
    >
      {!historyItems || historyItems.length === 0 ? (
        <PanelEmptyState message="No history" />
      ) : (
        <div className="space-y-1">
          {historyItems.map((item) => (
            <Link
              key={`${item._scope}-${item.id}`}
              to={`/${item._scope}/view/${item.id}`}
              className="block"
            >
              <PanelItem
                icon={historyIcons[item._scope]}
                title={item.name}
                subtitle={item._scope}
                meta={
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatItemDate(item)}
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

function getItemDate(item: HistoryItem): number {
  const dateStr = item.dateSent ?? item.dateStart ?? item.createdAt;
  if (!dateStr) return 0;
  const date = parseISO(dateStr);
  return isValid(date) ? date.getTime() : 0;
}

function formatItemDate(item: HistoryItem): string {
  const dateStr = item.dateSent ?? item.dateStart ?? item.createdAt;
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  if (!isValid(date)) return '';

  // If within last 7 days, show relative time
  const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return format(date, 'MMM d');
}
