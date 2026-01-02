/**
 * AuthTokensPage - Active authentication tokens management
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Key,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  User,
  Globe,
  Monitor,
  Calendar,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils/cn';
import { format, formatDistanceToNow } from 'date-fns';

interface AuthToken {
  id: string;
  userId: string;
  userName?: string;
  ipAddress?: string;
  lastAccess?: string;
  createdAt: string;
  isActive: boolean;
  portal?: string;
  portalId?: string;
}

export function AuthTokensPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'authTokens'],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        maxSize: 100,
        orderBy: 'lastAccess',
        order: 'desc',
        where: [
          { type: 'equals', attribute: 'isActive', value: true },
        ],
      };

      const response = await apiClient.get<{ list: AuthToken[]; total: number }>('/AuthToken', { params });
      return response.data;
    },
    staleTime: 30000,
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.put(`/AuthToken/${id}`, { isActive: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'authTokens'] });
      setSelectedTokens(new Set());
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => apiClient.put(`/AuthToken/${id}`, { isActive: false }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'authTokens'] });
      setSelectedTokens(new Set());
    },
  });

  const toggleToken = (id: string) => {
    const newSelected = new Set(selectedTokens);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTokens(newSelected);
  };

  const selectAll = () => {
    if (data?.list) {
      if (selectedTokens.size === data.list.length) {
        setSelectedTokens(new Set());
      } else {
        setSelectedTokens(new Set(data.list.map((t) => t.id)));
      }
    }
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
          <p className="text-gray-600">Failed to load auth tokens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Key className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Active Auth Tokens</h1>
          <span className="text-sm text-gray-500">({data?.total ?? 0} active)</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedTokens.size > 0 && (
            <button
              onClick={() => {
                if (confirm(`Revoke ${selectedTokens.size} selected token(s)?`)) {
                  revokeAllMutation.mutate(Array.from(selectedTokens));
                }
              }}
              disabled={revokeAllMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Revoke Selected ({selectedTokens.size})
            </button>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tokens table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={data?.list && selectedTokens.size === data.list.length}
                  onChange={selectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Access
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.list.map((token) => (
              <tr key={token.id} className={cn('hover:bg-gray-50', selectedTokens.has(token.id) && 'bg-blue-50')}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedTokens.has(token.id)}
                    onChange={() => toggleToken(token.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{token.userName}</div>
                      {token.portal && (
                        <div className="text-xs text-gray-500">Portal: {token.portal}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <code className="text-sm text-gray-600">{token.ipAddress || '—'}</code>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-900">
                        {format(new Date(token.createdAt), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(token.createdAt), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-gray-400" />
                    <div>
                      {token.lastAccess ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {formatDistanceToNow(new Date(token.lastAccess), { addSuffix: true })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(token.lastAccess), 'MMM d, HH:mm')}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Never</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => {
                      if (confirm('Revoke this token? The user will need to log in again.')) {
                        revokeTokenMutation.mutate(token.id);
                      }
                    }}
                    disabled={revokeTokenMutation.isPending}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {(!data?.list || data.list.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No active auth tokens found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">About Auth Tokens</h3>
        <p className="text-sm text-blue-700">
          Auth tokens represent active login sessions. Revoking a token will immediately log out the user
          from that session. Users can have multiple active tokens from different devices.
        </p>
      </div>
    </div>
  );
}

export default AuthTokensPage;
