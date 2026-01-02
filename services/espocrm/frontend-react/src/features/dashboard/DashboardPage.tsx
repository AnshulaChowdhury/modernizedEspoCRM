import { useQuery } from '@tanstack/react-query';
import { get } from '@/api/client';
import { useAuthStore } from '@/features/auth/store';
import { useMetadata } from '@/lib/metadata/useMetadata';
import {
  Building2,
  Users,
  UserCheck,
  Target,
  Mail,
  Calendar,
  CheckSquare,
  TrendingUp,
  Clock,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ListResponse {
  total: number;
  list: unknown[];
}

// Individual count dashlet that uses its own query
function EntityCountDashlet({
  entityType,
  title,
  icon: Icon,
  color,
}: {
  entityType: string;
  title: string;
  icon: LucideIcon;
  color: string;
}): React.ReactElement {
  const { isEntityEnabled } = useMetadata();
  const enabled = isEntityEnabled(entityType);

  const { data, isLoading } = useQuery({
    queryKey: ['entityCount', entityType],
    queryFn: async () => {
      const response = await get<ListResponse>(`/${entityType}`, {
        params: { maxSize: 0 },
      });
      return response.total;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (!enabled) return <></>;

  return (
    <a
      href={`/${entityType}`}
      className={cn(
        'bg-white rounded-lg shadow p-6 border-l-4 hover:shadow-md transition-shadow',
        color
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading ? (
              <span className="inline-block h-8 w-16 bg-gray-200 animate-pulse rounded" />
            ) : data !== undefined && data >= 0 ? (
              data.toLocaleString()
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </p>
          <p className="text-sm text-gray-500">Total records</p>
        </div>
        <Icon className="h-10 w-10 text-gray-400" />
      </div>
    </a>
  );
}

// Activity stream item - matches EspoCRM Note entity structure
interface StreamNote {
  id: string;
  type: 'Post' | 'Email' | 'Call' | 'Meeting' | 'Task' | 'Update' | 'Create' | 'Status' | string;
  post?: string;
  data?: Record<string, unknown>;
  parentType?: string;
  parentId?: string;
  parentName?: string;
  createdAt: string;
  createdById?: string;
  createdByName?: string;
  isInternal?: boolean;
}

// Get icon for stream item type
function getStreamIcon(type: string): React.ReactElement {
  switch (type) {
    case 'Create':
      return <TrendingUp className="h-4 w-4" />;
    case 'Update':
    case 'Status':
      return <Clock className="h-4 w-4" />;
    default:
      return <TrendingUp className="h-4 w-4" />;
  }
}

// Get action text for stream type
function getStreamAction(type: string): string {
  switch (type) {
    case 'Create':
      return 'created';
    case 'Update':
      return 'updated';
    case 'Status':
      return 'changed status of';
    case 'Post':
      return 'posted on';
    default:
      return type.toLowerCase();
  }
}

// Format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 1000 / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

// Activity stream dashlet
function ActivityStreamDashlet(): React.ReactElement {
  const { data, isLoading } = useQuery({
    queryKey: ['globalStream'],
    queryFn: async () => {
      // Use GlobalStream endpoint - shows all activity regardless of follow status
      // Note: Only entities with "stream": true in metadata will generate notes
      // (Account, Case, Contact, Lead, Meeting, Opportunity, Task)
      const response = await get<{ list: StreamNote[]; total: number }>('/GlobalStream?maxSize=10');
      return response;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Stream
        </h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.list && data.list.length > 0 ? (
          <ul className="space-y-4">
            {data.list.slice(0, 5).map((note) => (
              <li key={note.id} className="flex items-start gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  {getStreamIcon(note.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900">
                    <span className="font-medium">{note.createdByName ?? 'System'}</span>
                    {' '}{getStreamAction(note.type)}{' '}
                    {note.parentType && note.parentName ? (
                      <a
                        href={`/${note.parentType}/view/${note.parentId}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {note.parentName}
                      </a>
                    ) : (
                      <span className="font-medium">{note.parentType ?? 'record'}</span>
                    )}
                  </p>
                  {note.post && (
                    <p className="text-gray-600 truncate mt-0.5">{note.post}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-0.5">
                    {formatTimeAgo(new Date(note.createdAt))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No recent activity</p>
        )}
      </div>
    </div>
  );
}

// Tasks dashlet
interface Task {
  id: string;
  name: string;
  status: string;
  dateEnd?: string;
  priority: string;
}

function TasksDashlet(): React.ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', 'myTasks'],
    queryFn: async () => {
      const response = await get<{ list: Task[]; total: number }>('/Task', {
        params: {
          maxSize: 10,
          where: [
            { type: 'equals', attribute: 'status', value: 'Not Started' },
          ],
          orderBy: 'dateEnd',
          order: 'asc',
        },
      });
      return response;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          My Tasks
        </h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : error ? (
          <p className="text-gray-500 text-sm">Unable to load tasks</p>
        ) : data?.list && data.list.length > 0 ? (
          <ul className="space-y-3">
            {data.list.slice(0, 5).map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={`/Task/view/${task.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                  >
                    {task.name}
                  </a>
                  {task.dateEnd && (
                    <p className="text-xs text-gray-500">
                      Due: {new Date(task.dateEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    task.priority === 'High'
                      ? 'bg-red-100 text-red-700'
                      : task.priority === 'Low'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {task.priority}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No pending tasks</p>
        )}
      </div>
    </div>
  );
}

// Entity configurations
const ENTITY_DASHLETS = [
  { type: 'Account', title: 'Accounts', icon: Building2, color: 'border-blue-500' },
  { type: 'Contact', title: 'Contacts', icon: Users, color: 'border-green-500' },
  { type: 'Lead', title: 'Leads', icon: UserCheck, color: 'border-purple-500' },
  { type: 'Opportunity', title: 'Opportunities', icon: Target, color: 'border-yellow-500' },
  { type: 'Email', title: 'Emails', icon: Mail, color: 'border-red-500' },
  { type: 'Meeting', title: 'Meetings', icon: Calendar, color: 'border-indigo-500' },
] as const;

// Main Dashboard component
export default function DashboardPage(): React.ReactElement {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user?.name ?? user?.userName}
        </p>
      </div>

      {/* Entity count cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ENTITY_DASHLETS.map((entity) => (
          <EntityCountDashlet
            key={entity.type}
            entityType={entity.type}
            title={entity.title}
            icon={entity.icon}
            color={entity.color}
          />
        ))}
      </div>

      {/* Lower dashlets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TasksDashlet />
        <ActivityStreamDashlet />
      </div>

      {/* Quick access notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">React Migration</h4>
            <p className="text-sm text-blue-700 mt-1">
              This is the new React-based interface. Some features are still
              being migrated. Use the{' '}
              <a
                href="http://localhost:8080"
                className="underline hover:no-underline"
              >
                classic interface
              </a>{' '}
              for full functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
