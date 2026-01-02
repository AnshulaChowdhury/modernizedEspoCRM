/**
 * AuthenticationPage - Authentication settings
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/adminEndpoints';
import { cn } from '@/lib/utils/cn';

const authSettings = [
  { name: 'authenticationMethod', label: 'Authentication Method', type: 'enum', options: ['Espo', 'LDAP', 'OIDC'], tooltip: 'Primary authentication method' },
  { name: 'auth2FA', label: 'Enable 2FA', type: 'bool', tooltip: 'Enable two-factor authentication' },
  { name: 'auth2FAForced', label: 'Force 2FA', type: 'bool', tooltip: 'Require 2FA for all users' },
  { name: 'auth2FAMethodList', label: '2FA Methods', type: 'array', tooltip: 'Available 2FA methods (TOTP, Email, SMS)' },
  { name: 'passwordRecoveryDisabled', label: 'Disable Password Recovery', type: 'bool' },
  { name: 'passwordRecoveryForAdminDisabled', label: 'Disable Admin Password Recovery', type: 'bool' },
  { name: 'passwordRecoveryNoExposure', label: 'No Email Exposure on Recovery', type: 'bool' },
  { name: 'authTokenLifetime', label: 'Auth Token Lifetime (hours)', type: 'int', tooltip: '0 = never expires' },
  { name: 'authTokenMaxIdleTime', label: 'Max Idle Time (hours)', type: 'int', tooltip: '0 = no limit' },
  { name: 'authTokenPreventConcurrent', label: 'Prevent Concurrent Sessions', type: 'bool' },
  { name: 'authIpAddressCheck', label: 'Check IP Address', type: 'bool' },
  { name: 'authAnotherUserDisabled', label: 'Disable Login as Another User', type: 'bool' },
  { name: 'authLogDisabled', label: 'Disable Auth Log', type: 'bool' },
];

const ldapSettings = [
  { name: 'ldapHost', label: 'LDAP Host', type: 'varchar' },
  { name: 'ldapPort', label: 'LDAP Port', type: 'int' },
  { name: 'ldapSecurity', label: 'Security', type: 'enum', options: ['', 'SSL', 'TLS'] },
  { name: 'ldapUsername', label: 'Username', type: 'varchar' },
  { name: 'ldapPassword', label: 'Password', type: 'password' },
  { name: 'ldapBindRequiresDn', label: 'Bind Requires DN', type: 'bool' },
  { name: 'ldapBaseDn', label: 'Base DN', type: 'varchar' },
  { name: 'ldapUserLoginFilter', label: 'User Login Filter', type: 'varchar' },
  { name: 'ldapAccountCanonicalForm', label: 'Account Canonical Form', type: 'enum', options: ['Dn', 'Username', 'Backslash', 'Principal'] },
  { name: 'ldapAccountDomainName', label: 'Account Domain Name', type: 'varchar' },
  { name: 'ldapAccountDomainNameShort', label: 'Account Domain Name Short', type: 'varchar' },
  { name: 'ldapCreateEspoUser', label: 'Create EspoCRM User', type: 'bool' },
  { name: 'ldapUserNameAttribute', label: 'Username Attribute', type: 'varchar' },
  { name: 'ldapUserFirstNameAttribute', label: 'First Name Attribute', type: 'varchar' },
  { name: 'ldapUserLastNameAttribute', label: 'Last Name Attribute', type: 'varchar' },
  { name: 'ldapUserEmailAddressAttribute', label: 'Email Attribute', type: 'varchar' },
];

export function AuthenticationPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSettings,
    staleTime: 60000,
  });

  React.useEffect(() => {
    if (settings) {
      setValues(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: adminApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setIsDirty(false);
      setNotification({ type: 'success', message: 'Authentication settings saved' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: () => {
      setNotification({ type: 'error', message: 'Failed to save settings' });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const handleChange = (fieldName: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    saveMutation.mutate(values);
  };

  const renderField = (field: { name: string; label: string; type: string; options?: string[]; tooltip?: string }) => (
    <div key={field.name} className="grid grid-cols-3 gap-4 items-start">
      <label className="text-sm font-medium text-gray-700 pt-2">{field.label}</label>
      <div className="col-span-2">
        {field.type === 'bool' ? (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(values[field.name])}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600">{values[field.name] ? 'Yes' : 'No'}</span>
          </label>
        ) : field.type === 'enum' ? (
          <select
            value={(values[field.name] as string) ?? ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">— Select —</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt || '(None)'}</option>
            ))}
          </select>
        ) : field.type === 'int' ? (
          <input
            type="number"
            value={(values[field.name] as number) ?? ''}
            onChange={(e) => handleChange(field.name, parseInt(e.target.value, 10) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        ) : field.type === 'password' ? (
          <input
            type="password"
            value={(values[field.name] as string) ?? ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        ) : field.type === 'array' ? (
          <input
            type="text"
            value={Array.isArray(values[field.name]) ? (values[field.name] as string[]).join(', ') : ''}
            onChange={(e) => handleChange(field.name, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder="Comma-separated values"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        ) : (
          <input
            type="text"
            value={(values[field.name] as string) ?? ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        )}
        {field.tooltip && <p className="mt-1 text-xs text-gray-500">{field.tooltip}</p>}
      </div>
    </div>
  );

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
          <p className="text-gray-600">Failed to load settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Authentication</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || saveMutation.isPending}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            isDirty && !saveMutation.isPending
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>

      {notification && (
        <div className={cn('flex items-center gap-2 p-4 rounded-md mb-6', notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800')}>
          {notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {notification.message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('general')}
            className={cn('px-4 py-3 text-sm font-medium transition-colors', activeTab === 'general' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-600 hover:text-gray-900')}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('ldap')}
            className={cn('px-4 py-3 text-sm font-medium transition-colors', activeTab === 'ldap' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-600 hover:text-gray-900')}
          >
            LDAP
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {activeTab === 'general' && authSettings.map(renderField)}
            {activeTab === 'ldap' && ldapSettings.map(renderField)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthenticationPage;
