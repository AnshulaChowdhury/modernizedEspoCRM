/**
 * TeamsListPage - Team management
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users2,
  Loader2,
  AlertCircle,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  User,
} from 'lucide-react';
import { apiClient } from '@/api/client';

interface Team {
  id: string;
  name: string;
  description?: string;
  positionList?: string[];
  rolesIds?: string[];
  rolesNames?: Record<string, string>;
  usersIds?: string[];
  usersCount?: number;
  createdAt?: string;
}

export function TeamsListPage(): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'teams', searchQuery],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        maxSize: 50,
        orderBy: 'name',
        order: 'asc',
      };

      if (searchQuery) {
        params.where = [
          {
            type: 'or',
            value: [
              { type: 'contains', attribute: 'name', value: searchQuery },
              { type: 'contains', attribute: 'description', value: searchQuery },
            ],
          },
        ];
      }

      const response = await apiClient.get<{ list: Team[]; total: number }>('/Team', { params });
      return response.data;
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/Team/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] });
      setOpenMenu(null);
    },
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
          <p className="text-gray-600">Failed to load teams</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users2 className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>
          <span className="text-sm text-gray-500">({data?.total ?? 0})</span>
        </div>
        <button
          onClick={() => navigate('/Team/create')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Teams grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.list.map((team) => (
          <div
            key={team.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => navigate(`/Team/view/${team.id}`)}
              >
                <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                  {team.name}
                </h3>
                {team.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{team.description}</p>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === team.id ? null : team.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {openMenu === team.id && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border py-1 z-10">
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      onClick={() => {
                        setOpenMenu(null);
                        navigate(`/Team/edit/${team.id}`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <hr className="my-1" />
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this team?')) {
                          deleteTeamMutation.mutate(team.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{team.usersCount ?? 0} members</span>
              </div>
              {team.rolesNames && Object.keys(team.rolesNames).length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {Object.values(team.rolesNames).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {team.positionList && team.positionList.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-gray-500 mb-1">Positions:</div>
                <div className="flex flex-wrap gap-1">
                  {team.positionList.map((position) => (
                    <span key={position} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                      {position}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {(!data?.list || data.list.length === 0) && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Users2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No teams found</p>
          <button
            onClick={() => navigate('/Team/create')}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Create your first team
          </button>
        </div>
      )}
    </div>
  );
}

export default TeamsListPage;
