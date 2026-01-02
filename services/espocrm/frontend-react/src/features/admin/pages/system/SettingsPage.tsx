/**
 * SettingsPage - System settings configuration page
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/adminEndpoints';
import { cn } from '@/lib/utils/cn';

// Settings field groups
const settingsGroups = [
  {
    name: 'general',
    label: 'General',
    fields: [
      { name: 'siteUrl', label: 'Site URL', type: 'varchar', tooltip: 'The base URL of your CRM installation' },
      { name: 'applicationName', label: 'Application Name', type: 'varchar' },
      { name: 'companyLogo', label: 'Company Logo', type: 'varchar', tooltip: 'URL to company logo image' },
      { name: 'timeZone', label: 'Time Zone', type: 'varchar' },
      { name: 'dateFormat', label: 'Date Format', type: 'varchar' },
      { name: 'timeFormat', label: 'Time Format', type: 'varchar' },
      { name: 'weekStart', label: 'Week Start', type: 'int' },
      { name: 'language', label: 'Default Language', type: 'varchar' },
    ],
  },
  {
    name: 'records',
    label: 'Records',
    fields: [
      { name: 'recordsPerPage', label: 'Records Per Page', type: 'int' },
      { name: 'recordsPerPageSmall', label: 'Records Per Page (Small)', type: 'int' },
      { name: 'recordsPerPageSelect', label: 'Records Per Page (Select)', type: 'int' },
      { name: 'displayListViewRecordCount', label: 'Display Record Count', type: 'bool' },
      { name: 'exportDisabled', label: 'Disable Export', type: 'bool' },
      { name: 'globalSearchEntityList', label: 'Global Search Entities', type: 'array' },
    ],
  },
  {
    name: 'currency',
    label: 'Currency',
    fields: [
      { name: 'defaultCurrency', label: 'Default Currency', type: 'varchar' },
      { name: 'baseCurrency', label: 'Base Currency', type: 'varchar' },
      { name: 'currencyList', label: 'Currency List', type: 'array' },
      { name: 'thousandSeparator', label: 'Thousand Separator', type: 'varchar' },
      { name: 'decimalMark', label: 'Decimal Mark', type: 'varchar' },
    ],
  },
  {
    name: 'email',
    label: 'Email',
    fields: [
      { name: 'outboundEmailFromName', label: 'From Name', type: 'varchar' },
      { name: 'outboundEmailFromAddress', label: 'From Address', type: 'varchar' },
      { name: 'smtpServer', label: 'SMTP Server', type: 'varchar' },
      { name: 'smtpPort', label: 'SMTP Port', type: 'int' },
      { name: 'smtpAuth', label: 'SMTP Authentication', type: 'bool' },
      { name: 'smtpSecurity', label: 'SMTP Security', type: 'varchar' },
    ],
  },
];

export function SettingsPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSettings,
    staleTime: 60000,
  });

  // Update local values when settings load
  React.useEffect(() => {
    if (settings) {
      setValues(settings);
    }
  }, [settings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: adminApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setIsDirty(false);
      setNotification({ type: 'success', message: 'Settings saved successfully' });
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

  const activeGroup = settingsGroups.find((g) => g.name === activeTab);

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
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
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
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={cn(
            'flex items-center gap-2 p-4 rounded-md mb-6',
            notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {notification.message}
        </div>
      )}

      {/* Tabs and Content */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Tab navigation */}
        <div className="flex border-b border-gray-200">
          {settingsGroups.map((group) => (
            <button
              key={group.name}
              onClick={() => setActiveTab(group.name)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors',
                activeTab === group.name
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {group.label}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <div className="p-6">
          {activeGroup && (
            <div className="space-y-6">
              {activeGroup.fields.map((field) => (
                <div key={field.name} className="grid grid-cols-3 gap-4 items-start">
                  <label className="text-sm font-medium text-gray-700 pt-2">
                    {field.label}
                  </label>
                  <div className="col-span-2">
                    {field.type === 'bool' ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(values[field.name])}
                          onChange={(e) => handleChange(field.name, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-600">
                          {values[field.name] ? 'Yes' : 'No'}
                        </span>
                      </label>
                    ) : field.type === 'int' ? (
                      <input
                        type="number"
                        value={values[field.name] as number ?? ''}
                        onChange={(e) => handleChange(field.name, parseInt(e.target.value, 10) || 0)}
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
                        value={values[field.name] as string ?? ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    )}
                    {field.tooltip && (
                      <p className="mt-1 text-xs text-gray-500">{field.tooltip}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
