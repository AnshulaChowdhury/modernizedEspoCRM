/**
 * UsersListPage - Admin user management
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Loader2,
  AlertCircle,
  Plus,
  Search,
  MoreVertical,
  Shield,
  ShieldOff,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils/cn';

interface User {
  id: string;
  userName: string;
  name?: string;
  emailAddress?: string;
  type: string;
  isActive: boolean;
  createdAt?: string;
  teamsIds?: string[];
  teamsNames?: Record<string, string>;
}

export function UsersListPage(): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', searchQuery, filterType],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        maxSize: 50,
        orderBy: 'userName',
        order: 'asc',
      };

      if (searchQuery) {
        params.where = [
          {
            type: 'or',
            value: [
              { type: 'contains', attribute: 'userName', value: searchQuery },
              { type: 'contains', attribute: 'name', value: searchQuery },
              { type: 'contains', attribute: 'emailAddress', value: searchQuery },
            ],
          },
        ];
      }

      if (filterType !== 'all') {
        params.where = [
          ...(params.where as unknown[] || []),
          { type: 'equals', attribute: 'type', value: filterType },
        ];
      }

      const response = await apiClient.get<{ list: User[]; total: number }>('/User', { params });
      return response.data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiClient.put(`/User/${id}`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setOpenMenu(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/User/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setOpenMenu(null);
    },
  });

  const getUserTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      admin: 'Administrator',
      regular: 'Regular',
      portal: 'Portal',
      api: 'API',
      system: 'System',
    };
    return types[type] || type;
  };

  const getUserTypeBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      regular: 'bg-blue-100 text-blue-800',
      portal: 'bg-green-100 text-green-800',
      api: 'bg-yellow-100 text-yellow-800',
      system: 'bg-gray-100 text-gray-800',
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
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
          <p className="text-gray-600">Failed to load users</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <span className="text-sm text-gray-500">({data?.total ?? 0})</span>
        </div>
        <button
          onClick={() => navigate('/User/create')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="admin">Administrators</option>
          <option value="regular">Regular Users</option>
          <option value="portal">Portal Users</option>
          <option value="api">API Users</option>
        </select>
      </div>

      {/* Users table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teams
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
                    <div className="text-sm text-gray-500">{user.emailAddress}</div>
                    <div className="text-xs text-gray-400">@{user.userName}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getUserTypeBadgeClass(user.type))}>
                    {getUserTypeLabel(user.type)}
                  </span>
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
                    {user.teamsNames && Object.entries(user.teamsNames).slice(0, 3).map(([id, name]) => (
                      <span key={id} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        {name}
                      </span>
                    ))}
                    {user.teamsNames && Object.keys(user.teamsNames).length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                        +{Object.keys(user.teamsNames).length - 3}
                      </span>
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
                          onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
                        >
                          {user.isActive ? (
                            <>
                              <ShieldOff className="h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4" />
                              Activate
                            </>
                          )}
                        </button>
                        <hr className="my-1" />
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user?')) {
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
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersListPage;
