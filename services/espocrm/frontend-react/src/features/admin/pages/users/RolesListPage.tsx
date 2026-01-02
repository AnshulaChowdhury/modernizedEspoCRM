/**
 * RolesListPage - Role management
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Loader2,
  AlertCircle,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Users,
  Copy,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils/cn';

interface Role {
  id: string;
  name: string;
  assignmentPermission?: string;
  userPermission?: string;
  portalPermission?: string;
  groupEmailAccountPermission?: string;
  exportPermission?: string;
  massUpdatePermission?: string;
  dataPrivacyPermission?: string;
  teamsCount?: number;
  usersCount?: number;
}

export function RolesListPage(): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'roles', searchQuery],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        maxSize: 50,
        orderBy: 'name',
        order: 'asc',
      };

      if (searchQuery) {
        params.where = [
          { type: 'contains', attribute: 'name', value: searchQuery },
        ];
      }

      const response = await apiClient.get<{ list: Role[]; total: number }>('/Role', { params });
      return response.data;
    },
  });

  const duplicateRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      // First get the role data
      const roleResponse = await apiClient.get<Role>(`/Role/${id}`);
      const role = roleResponse.data;

      // Create a copy without id
      const newRole = {
        ...role,
        name: `${role.name} (Copy)`,
      };
      delete (newRole as { id?: string }).id;

      const response = await apiClient.post('/Role', newRole);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setOpenMenu(null);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/Role/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setOpenMenu(null);
    },
  });

  const getPermissionBadge = (permission: string | undefined): { label: string; className: string } => {
    const defaultBadge = { label: 'Not Set', className: 'bg-gray-100 text-gray-500' };
    const badges: Record<string, { label: string; className: string }> = {
      all: { label: 'All', className: 'bg-green-100 text-green-800' },
      team: { label: 'Team', className: 'bg-blue-100 text-blue-800' },
      own: { label: 'Own', className: 'bg-yellow-100 text-yellow-800' },
      no: { label: 'No', className: 'bg-red-100 text-red-800' },
      yes: { label: 'Yes', className: 'bg-green-100 text-green-800' },
      not_set: defaultBadge,
    };
    return badges[permission ?? 'not_set'] ?? defaultBadge;
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
          <p className="text-gray-600">Failed to load roles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Roles</h1>
          <span className="text-sm text-gray-500">({data?.total ?? 0})</span>
        </div>
        <button
          onClick={() => navigate('/Role/create')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Roles table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Export
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mass Update
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.list.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/Admin/roles/${role.id}`)}
                  >
                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {role.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      <Users className="h-3 w-3" />
                      <span>{role.usersCount ?? 0} users</span>
                      <span className="text-gray-300">|</span>
                      <span>{role.teamsCount ?? 0} teams</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    const badge = getPermissionBadge(role.assignmentPermission);
                    return (
                      <span className={cn('px-2 py-1 text-xs font-medium rounded', badge.className)}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    const badge = getPermissionBadge(role.userPermission);
                    return (
                      <span className={cn('px-2 py-1 text-xs font-medium rounded', badge.className)}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    const badge = getPermissionBadge(role.exportPermission);
                    return (
                      <span className={cn('px-2 py-1 text-xs font-medium rounded', badge.className)}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    const badge = getPermissionBadge(role.massUpdatePermission);
                    return (
                      <span className={cn('px-2 py-1 text-xs font-medium rounded', badge.className)}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === role.id ? null : role.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {openMenu === role.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border py-1 z-10">
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenu(null);
                            navigate(`/Admin/roles/${role.id}`);
                          }}
                        >
                          <Shield className="h-4 w-4" />
                          Edit Permissions
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenu(null);
                            navigate(`/Role/edit/${role.id}`);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit Details
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => duplicateRoleMutation.mutate(role.id)}
                        >
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </button>
                        <hr className="my-1" />
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this role?')) {
                              deleteRoleMutation.mutate(role.id);
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
                  No roles found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">About Roles</h3>
        <p className="text-sm text-blue-700">
          Roles define what users can do in the system. Assign roles to users directly or through teams.
          Click on a role to configure detailed entity-level permissions.
        </p>
      </div>
    </div>
  );
}

export default RolesListPage;
