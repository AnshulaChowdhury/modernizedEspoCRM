/**
 * ScheduledJobsPage - Scheduled jobs configuration and monitoring
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Loader2, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';

interface ScheduledJob {
  id: string;
  name: string;
  job: string;
  status: 'Active' | 'Inactive';
  scheduling: string;
  lastRun?: string;
  isInternal?: boolean;
}

export function ScheduledJobsPage(): React.ReactElement {
  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'scheduledJobs'],
    queryFn: async () => {
      const response = await apiClient.get<{ list: ScheduledJob[]; total: number }>('/api/v1/ScheduledJob', {
        params: { maxSize: 100, orderBy: 'name' },
      });
      return response.data.list;
    },
    staleTime: 30000,
  });

  const getStatusIcon = (status: string) => {
    if (status === 'Active') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  const formatScheduling = (scheduling: string) => {
    // Simple cron to human-readable (basic implementation)
    const parts = scheduling.split(' ');
    if (parts.length !== 5) return scheduling;

    const [minute, hour, dayOfMonth, , dayOfWeek] = parts;

    if (minute === '*' && hour === '*') return 'Every minute';
    if (minute === '*/5') return 'Every 5 minutes';
    if (minute === '*/10') return 'Every 10 minutes';
    if (minute === '*/15') return 'Every 15 minutes';
    if (minute === '*/30') return 'Every 30 minutes';
    if (minute === '0' && hour === '*') return 'Every hour';
    if (minute === '0' && hour === '0') return 'Daily at midnight';
    if (dayOfWeek === '1' && minute === '0' && hour === '0') return 'Weekly on Monday';
    if (dayOfMonth === '1' && minute === '0' && hour === '0') return 'Monthly on 1st';

    return scheduling;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Failed to load scheduled jobs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Scheduled Jobs</h1>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scheduling
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Run
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs?.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <span className={cn('text-sm', job.status === 'Active' ? 'text-green-600' : 'text-gray-500')}>
                      {job.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{job.name}</div>
                  {job.isInternal && (
                    <span className="text-xs text-gray-500">(Internal)</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{job.job}</code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatScheduling(job.scheduling)}</div>
                  <div className="text-xs text-gray-500 font-mono">{job.scheduling}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {job.lastRun ? format(new Date(job.lastRun), 'MMM d, yyyy HH:mm') : '—'}
                </td>
              </tr>
            ))}
            {(!jobs || jobs.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No scheduled jobs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Cron Job Setup</h3>
        <p className="text-sm text-blue-700 mb-2">
          To enable scheduled jobs, add the following cron entry to your server:
        </p>
        <code className="block text-sm bg-blue-100 p-2 rounded text-blue-900">
          * * * * * cd /path/to/espocrm; php cron.php &gt; /dev/null 2&gt;&amp;1
        </code>
      </div>
    </div>
  );
}

export default ScheduledJobsPage;
