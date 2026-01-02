/**
 * LeadCapturePage - Lead Capture configuration management
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileInput,
  Loader2,
  AlertCircle,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Key,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/api/client';

interface LeadCapture {
  id: string;
  name: string;
  isActive: boolean;
  campaignId?: string;
  campaignName?: string;
}

export function LeadCapturePage(): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'leadCapture', searchQuery],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        maxSize: 50,
        orderBy: 'createdAt',
        order: 'desc',
      };

      if (searchQuery) {
        params.where = [
          { type: 'contains', attribute: 'name', value: searchQuery },
        ];
      }

      const response = await apiClient.get<{ list: LeadCapture[]; total: number }>('/LeadCapture', { params });
      return response.data;
    },
  });

  const generateApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post('/LeadCapture/action/generateNewApiKey', { id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leadCapture'] });
      setOpenMenu(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/LeadCapture/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leadCapture'] });
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
          <p className="text-gray-600">Failed to load lead capture configurations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileInput className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Lead Capture</h1>
          <span className="text-sm text-gray-500">({data?.total ?? 0})</span>
        </div>
        <button
          onClick={() => navigate('/Admin/leadCapture/create')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Lead Capture
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search lead captures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lead Capture table - matches Backbone layout: name, isActive, campaign */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Is Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Campaign
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.list.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/Admin/leadCapture/${item.id}`)}
                  >
                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {item.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3" />
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                      <XCircle className="h-3 w-3" />
                      No
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.campaignName ? (
                    <span className="text-sm text-blue-600">{item.campaignName}</span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {openMenu === item.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border py-1 z-10">
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenu(null);
                            navigate(`/Admin/leadCapture/${item.id}`);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            if (confirm('Are you sure you want to generate a new API key? The existing key will stop working.')) {
                              generateApiKeyMutation.mutate(item.id);
                            }
                          }}
                        >
                          <Key className="h-4 w-4" />
                          Generate New API Key
                        </button>
                        <hr className="my-1" />
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this lead capture configuration?')) {
                              deleteMutation.mutate(item.id);
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
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No lead capture configurations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">About Lead Capture</h3>
        <p className="text-sm text-blue-700">
          Lead Capture allows you to create embeddable web forms and API endpoints to capture leads from external websites.
          Features include double opt-in email confirmation, target list subscription, campaign tracking, and duplicate detection.
        </p>
      </div>
    </div>
  );
}

export default LeadCapturePage;
