/**
 * PortalRolesPage - Manage portal roles
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus } from 'lucide-react';
import { RecordList } from '@/features/entities/components/RecordList';

export function PortalRolesPage(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-gray-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Portal Roles
            </h1>
            <p className="text-sm text-gray-500">
              Configure access permissions for portal users
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/PortalRole/create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </button>
      </div>

      {/* Record list */}
      <RecordList entityType="PortalRole" />
    </div>
  );
}

export default PortalRolesPage;
