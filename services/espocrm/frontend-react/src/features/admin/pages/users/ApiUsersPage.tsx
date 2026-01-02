/**
 * ApiUsersPage - API user management
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Code,
  Loader2,
  AlertCircle,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Key,
  Copy,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/api/client';

interface ApiUser {
  id: string;
  userName: string;
  name?: string;
  authMethod?: string;
  apiKey?: string;
  isActive: boolean;
  createdAt?: string;
  rolesIds?: string[];
  rolesNames?: Record<string, string>;
}

export function ApiUsersPage(): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'apiUsers', searchQuery],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        maxSize: 50,
        orderBy: 'userName',
        order: 'asc',
        where: [
          { type: 'equals', attribute: 'type', value: 'api' },
        ],
      };

      if (searchQuery) {
        params.where = [
          ...(params.where as unknown[] || []),
          {
            type: 'or',
            value: [
              { type: 'contains', attribute: 'userName', value: searchQuery },
              { type: 'contains', attribute: 'name', value: searchQuery },
            ],
          },
        ];
      }

      const response = await apiClient.get<{ list: ApiUser[]; total: number }>('/User', { params });
      return response.data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiClient.put(`/User/${id}`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'apiUsers'] });
      setOpenMenu(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/User/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'apiUsers'] });
      setOpenMenu(null);
    },
  });

  const copyApiKey = async (apiKey: string, id: string) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = apiKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
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
          <p className="text-gray-600">Failed to load API users</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Code className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">API Users</h1>
          <span className="text-sm text-gray-500">({data?.total ?? 0})</span>
        </div>
        <button
          onClick={() => navigate('/User/create?type=api')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create API User
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search API users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* API Users table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Auth Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                API Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.list.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/User/view/${user.id}`)}
                  >
                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {user.name || user.userName}
                    </div>
                    <div className="text-xs text-gray-400">@{user.userName}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {user.authMethod === 'apiKey' ? 'API Key' : 'HMAC'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.apiKey ? (
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {user.apiKey.substring(0, 8)}...
                      </code>
                      <button
                        onClick={() => copyApiKey(user.apiKey!, user.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Copy API Key"
                      >
                        {copiedId === user.id ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {user.isActive ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Inactive</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.rolesNames && Object.entries(user.rolesNames).slice(0, 2).map(([id, name]) => (
                      <span key={id} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        {name}
                      </span>
                    ))}
                    {user.rolesNames && Object.keys(user.rolesNames).length > 2 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                        +{Object.keys(user.rolesNames).length - 2}
                      </span>
                    )}
                    {(!user.rolesNames || Object.keys(user.rolesNames).length === 0) && (
                      <span className="text-xs text-gray-400">No roles</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {openMenu === user.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border py-1 z-10">
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenu(null);
                            navigate(`/User/edit/${user.id}`);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenu(null);
                            navigate(`/User/view/${user.id}`);
                          }}
                        >
                          <Key className="h-4 w-4" />
                          View API Key
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
                        >
                          {user.isActive ? (
                            <>
                              <XCircle className="h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Activate
                            </>
                          )}
                        </button>
                        <hr className="my-1" />
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this API user?')) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(!data?.list || data.list.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No API users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">About API Users</h3>
        <p className="text-sm text-blue-700 mb-2">
          API users are used for integrations and automated access to EspoCRM. They authenticate using
          API keys or HMAC authentication instead of passwords.
        </p>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>API Key: Simple key-based authentication</li>
          <li>HMAC: More secure signature-based authentication</li>
        </ul>
      </div>
    </div>
  );
}

export default ApiUsersPage;
