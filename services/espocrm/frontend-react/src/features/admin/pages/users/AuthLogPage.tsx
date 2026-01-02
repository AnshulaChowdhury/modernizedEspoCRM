/**
 * AuthLogPage - Authentication log viewer
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  User,
  Globe,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';

interface AuthLogRecord {
  id: string;
  userName: string;
  userId?: string;
  ipAddress?: string;
  requestTime: string;
  isDenied: boolean;
  denialReason?: string;
  portal?: string;
  portalId?: string;
  authenticationMethod?: string;
  requestUrl?: string;
}

export function AuthLogPage(): React.ReactElement {
  const [filterDenied, setFilterDenied] = useState<boolean | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'authLog', filterDenied],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        maxSize: 100,
        orderBy: 'requestTime',
        order: 'desc',
      };

      if (filterDenied !== null) {
        params.where = [
          { type: 'equals', attribute: 'isDenied', value: filterDenied },
        ];
      }

      const response = await apiClient.get<{ list: AuthLogRecord[]; total: number }>('/AuthLogRecord', { params });
      return response.data;
    },
    staleTime: 30000,
  });

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
          <p className="text-gray-600">Failed to load authentication log</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Authentication Log</h1>
          <span className="text-sm text-gray-500">({data?.total ?? 0} records)</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterDenied(null)}
          className={cn(
            'px-4 py-2 text-sm rounded-md border transition-colors',
            filterDenied === null
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilterDenied(false)}
          className={cn(
            'px-4 py-2 text-sm rounded-md border transition-colors flex items-center gap-2',
            filterDenied === false
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          )}
        >
          <CheckCircle className="h-4 w-4" />
          Successful
        </button>
        <button
          onClick={() => setFilterDenied(true)}
          className={cn(
            'px-4 py-2 text-sm rounded-md border transition-colors flex items-center gap-2',
            filterDenied === true
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          )}
        >
          <XCircle className="h-4 w-4" />
          Denied
        </button>
      </div>

      {/* Log table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.list.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {record.isDenied ? (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Denied</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Success</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {format(new Date(record.requestTime), 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(record.requestTime), 'HH:mm:ss')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{record.userName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <code className="text-sm text-gray-600">{record.ipAddress || '—'}</code>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {record.authenticationMethod || 'Basic'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {record.isDenied && record.denialReason && (
                    <span className="text-sm text-red-600">{record.denialReason}</span>
                  )}
                  {record.portal && (
                    <span className="text-sm text-gray-500">Portal: {record.portal}</span>
                  )}
                </td>
              </tr>
            ))}
            {(!data?.list || data.list.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No authentication records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Security Note</h3>
        <p className="text-sm text-yellow-700">
          Failed login attempts may indicate brute-force attacks. Consider blocking IP addresses with
          multiple failed attempts using your server&apos;s firewall.
        </p>
      </div>
    </div>
  );
}

export default AuthLogPage;
