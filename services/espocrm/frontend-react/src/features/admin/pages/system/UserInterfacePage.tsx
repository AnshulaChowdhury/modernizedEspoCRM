/**
 * UserInterfacePage - UI customization settings
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/adminEndpoints';
import { cn } from '@/lib/utils/cn';

const uiSettings = [
  { name: 'theme', label: 'Theme', type: 'enum', options: ['Espo', 'EspoRtl', 'Sakura', 'Violet', 'Hazyblue', 'Dark'] },
  { name: 'navbar', label: 'Navbar Style', type: 'enum', options: ['side', 'top'] },
  { name: 'layoutSidePanelsDefaultDisabled', label: 'Disable Side Panels by Default', type: 'bool' },
  { name: 'scopeColorsDisabled', label: 'Disable Scope Colors', type: 'bool' },
  { name: 'tabColorsDisabled', label: 'Disable Tab Colors', type: 'bool' },
  { name: 'avatarsDisabled', label: 'Disable Avatars', type: 'bool' },
  { name: 'textFilterUseContainsForVarchar', label: 'Text Filter Uses Contains', type: 'bool' },
  { name: 'quickCreateFormLayoutType', label: 'Quick Create Layout', type: 'enum', options: ['simple', 'detail'] },
  { name: 'dashboardLayout', label: 'Dashboard Layout', type: 'enum', options: ['1', '2', '3'] },
  { name: 'calendarEntityList', label: 'Calendar Entities', type: 'array' },
  { name: 'activitiesEntityList', label: 'Activities Entities', type: 'array' },
  { name: 'historyEntityList', label: 'History Entities', type: 'array' },
];

export function UserInterfacePage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [isDirty, setIsDirty] = useState(false);
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
      setNotification({ type: 'success', message: 'UI settings saved successfully' });
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
          <Palette className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">User Interface</h1>
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

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-6">
          {uiSettings.map((field) => (
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
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserInterfacePage;
