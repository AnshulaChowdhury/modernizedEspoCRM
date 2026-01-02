/**
 * RoleDetailPage - Role permissions editor
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Loader2,
  AlertCircle,
  Save,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils/cn';

interface RoleData {
  id: string;
  name: string;
  assignmentPermission?: string;
  userPermission?: string;
  portalPermission?: string;
  groupEmailAccountPermission?: string;
  exportPermission?: string;
  massUpdatePermission?: string;
  dataPrivacyPermission?: string;
  data?: Record<string, ScopePermissions>;
  fieldData?: Record<string, Record<string, FieldPermissions>>;
}

interface ScopePermissions {
  create?: string;
  read?: string;
  edit?: string;
  delete?: string;
  stream?: string;
}

interface FieldPermissions {
  read?: string;
  edit?: string;
}

interface ScopeMetadata {
  entity?: boolean;
  object?: boolean;
  stream?: boolean;
  acl?: boolean | string;
  aclActionList?: string[];
  aclPortal?: boolean | string;
}

type PermissionValue = 'all' | 'team' | 'own' | 'no' | 'yes' | 'not-set';

const PERMISSION_OPTIONS: { value: PermissionValue; label: string }[] = [
  { value: 'not-set', label: 'Not Set' },
  { value: 'all', label: 'All' },
  { value: 'team', label: 'Team' },
  { value: 'own', label: 'Own' },
  { value: 'no', label: 'No' },
];

const BOOLEAN_OPTIONS: { value: PermissionValue; label: string }[] = [
  { value: 'not-set', label: 'Not Set' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const ACTIONS = ['create', 'read', 'edit', 'delete', 'stream'] as const;

export function RoleDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [expandedScopes, setExpandedScopes] = useState<Set<string>>(new Set());
  const [permissions, setPermissions] = useState<Record<string, ScopePermissions>>({});
  const [fieldPermissions, setFieldPermissions] = useState<Record<string, Record<string, FieldPermissions>>>({});
  const [globalPermissions, setGlobalPermissions] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch role data
  const { data: role, isLoading: roleLoading, error: roleError } = useQuery({
    queryKey: ['admin', 'role', id],
    queryFn: async () => {
      const response = await apiClient.get<RoleData>(`/Role/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch scopes metadata
  const { data: scopes, isLoading: scopesLoading } = useQuery({
    queryKey: ['metadata', 'scopes'],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, ScopeMetadata>>('/Metadata', {
        params: { type: 'scopes' },
      });
      return response.data;
    },
  });

  // Initialize state from role data
  useEffect(() => {
    if (role) {
      setPermissions(role.data ?? {});
      setFieldPermissions(role.fieldData ?? {});
      setGlobalPermissions({
        assignmentPermission: role.assignmentPermission ?? '',
        userPermission: role.userPermission ?? '',
        portalPermission: role.portalPermission ?? '',
        groupEmailAccountPermission: role.groupEmailAccountPermission ?? '',
        exportPermission: role.exportPermission ?? '',
        massUpdatePermission: role.massUpdatePermission ?? '',
        dataPrivacyPermission: role.dataPrivacyPermission ?? '',
      });
    }
  }, [role]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<RoleData>) => {
      const response = await apiClient.put(`/Role/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'role', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setHasChanges(false);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...globalPermissions,
      data: permissions,
      fieldData: fieldPermissions,
    });
  };

  const toggleScope = (scope: string) => {
    const newExpanded = new Set(expandedScopes);
    if (newExpanded.has(scope)) {
      newExpanded.delete(scope);
    } else {
      newExpanded.add(scope);
    }
    setExpandedScopes(newExpanded);
  };

  const updateScopePermission = (scope: string, action: string, value: PermissionValue) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      if (!updated[scope]) {
        updated[scope] = {};
      }
      if (value === 'not-set') {
        delete updated[scope][action as keyof ScopePermissions];
        if (Object.keys(updated[scope]).length === 0) {
          delete updated[scope];
        }
      } else {
        updated[scope] = { ...updated[scope], [action]: value };
      }
      return updated;
    });
    setHasChanges(true);
  };

  const updateGlobalPermission = (key: string, value: string) => {
    setGlobalPermissions((prev) => ({ ...prev, [key]: value || '' }));
    setHasChanges(true);
  };

  const getPermissionValue = (scope: string, action: string): PermissionValue => {
    return (permissions[scope]?.[action as keyof ScopePermissions] as PermissionValue) || 'not-set';
  };

  const getPermissionColor = (value: PermissionValue) => {
    const colors: Record<PermissionValue, string> = {
      all: 'bg-green-100 text-green-800 border-green-200',
      team: 'bg-blue-100 text-blue-800 border-blue-200',
      own: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      no: 'bg-red-100 text-red-800 border-red-200',
      yes: 'bg-green-100 text-green-800 border-green-200',
      'not-set': 'bg-gray-50 text-gray-500 border-gray-200',
    };
    return colors[value];
  };

  // Get entity scopes that support ACL
  const entityScopes = Object.entries(scopes ?? {})
    .filter(([, meta]) => meta.entity && meta.acl !== false)
    .map(([name]) => name)
    .sort();

  const isLoading = roleLoading || scopesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (roleError || !role) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Failed to load role</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/Admin/roles')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-gray-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{role.name}</h1>
              <p className="text-sm text-gray-500">Configure role permissions</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            hasChanges
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* Global Permissions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Global Permissions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'assignmentPermission', label: 'Assignment' },
            { key: 'userPermission', label: 'User' },
            { key: 'exportPermission', label: 'Export' },
            { key: 'massUpdatePermission', label: 'Mass Update' },
            { key: 'portalPermission', label: 'Portal' },
            { key: 'groupEmailAccountPermission', label: 'Group Email' },
            { key: 'dataPrivacyPermission', label: 'Data Privacy' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <select
                value={globalPermissions[key] || ''}
                onChange={(e) => updateGlobalPermission(key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not Set</option>
                {key === 'assignmentPermission' || key === 'userPermission' ? (
                  <>
                    <option value="all">All</option>
                    <option value="team">Team</option>
                    <option value="own">Own</option>
                    <option value="no">No</option>
                  </>
                ) : (
                  <>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </>
                )}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Scope Permissions */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Entity Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure access permissions for each entity type
          </p>
        </div>

        {/* ACL Table Header */}
        <div className="grid grid-cols-7 gap-2 px-4 py-3 bg-gray-100 border-b text-xs font-medium text-gray-500 uppercase">
          <div className="col-span-2">Scope</div>
          {ACTIONS.map((action) => (
            <div key={action} className="text-center">{action}</div>
          ))}
        </div>

        {/* ACL Table Body */}
        <div className="divide-y divide-gray-200">
          {entityScopes.map((scope) => {
            const scopeMeta = scopes?.[scope];
            const isExpanded = expandedScopes.has(scope);
            const hasStreamAction = scopeMeta?.stream;

            return (
              <div key={scope}>
                <div className="grid grid-cols-7 gap-2 px-4 py-3 hover:bg-gray-50 items-center">
                  <div className="col-span-2 flex items-center gap-2">
                    <button
                      onClick={() => toggleScope(scope)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <span className="font-medium text-gray-900">{scope}</span>
                  </div>
                  {ACTIONS.map((action) => {
                    if (action === 'stream' && !hasStreamAction) {
                      return <div key={action} className="text-center text-gray-300">—</div>;
                    }

                    const value = getPermissionValue(scope, action);
                    const options = action === 'stream' ? BOOLEAN_OPTIONS : PERMISSION_OPTIONS;

                    return (
                      <div key={action} className="text-center">
                        <select
                          value={value}
                          onChange={(e) => updateScopePermission(scope, action, e.target.value as PermissionValue)}
                          className={cn(
                            'w-full px-2 py-1 text-xs border rounded text-center',
                            getPermissionColor(value)
                          )}
                        >
                          {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* Expanded field-level permissions */}
                {isExpanded && (
                  <div className="bg-gray-50 px-8 py-4 border-t">
                    <p className="text-sm text-gray-500">
                      Field-level permissions for {scope} can be configured in the full Role editor.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Help section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Permission Levels</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700">
          <div>
            <span className="font-medium">All:</span> Access to all records
          </div>
          <div>
            <span className="font-medium">Team:</span> Records in user&apos;s teams
          </div>
          <div>
            <span className="font-medium">Own:</span> Records assigned to user
          </div>
          <div>
            <span className="font-medium">No:</span> No access
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleDetailPage;
