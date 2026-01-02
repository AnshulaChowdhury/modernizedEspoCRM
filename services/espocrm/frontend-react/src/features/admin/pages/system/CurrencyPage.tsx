/**
 * CurrencyPage - Currency configuration
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Save, Loader2, AlertCircle, CheckCircle, Plus, X } from 'lucide-react';
import { adminApi } from '../../api/adminEndpoints';
import { cn } from '@/lib/utils/cn';

export function CurrencyPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [newCurrency, setNewCurrency] = useState('');
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
      setNotification({ type: 'success', message: 'Currency settings saved' });
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

  const currencyList = (values.currencyList as string[]) ?? [];

  const addCurrency = () => {
    if (newCurrency && !currencyList.includes(newCurrency.toUpperCase())) {
      handleChange('currencyList', [...currencyList, newCurrency.toUpperCase()]);
      setNewCurrency('');
    }
  };

  const removeCurrency = (currency: string) => {
    handleChange('currencyList', currencyList.filter((c) => c !== currency));
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
          <DollarSign className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Currency</h1>
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

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* Default Currency */}
        <div className="grid grid-cols-3 gap-4 items-start">
          <label className="text-sm font-medium text-gray-700 pt-2">Default Currency</label>
          <div className="col-span-2">
            <select
              value={(values.defaultCurrency as string) ?? ''}
              onChange={(e) => handleChange('defaultCurrency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="">— Select —</option>
              {currencyList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Base Currency */}
        <div className="grid grid-cols-3 gap-4 items-start">
          <label className="text-sm font-medium text-gray-700 pt-2">Base Currency</label>
          <div className="col-span-2">
            <select
              value={(values.baseCurrency as string) ?? ''}
              onChange={(e) => handleChange('baseCurrency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="">— Select —</option>
              {currencyList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Used for currency conversion calculations</p>
          </div>
        </div>

        {/* Formatting */}
        <div className="grid grid-cols-3 gap-4 items-start">
          <label className="text-sm font-medium text-gray-700 pt-2">Thousand Separator</label>
          <div className="col-span-2">
            <input
              type="text"
              value={(values.thousandSeparator as string) ?? ','}
              onChange={(e) => handleChange('thousandSeparator', e.target.value)}
              maxLength={1}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 items-start">
          <label className="text-sm font-medium text-gray-700 pt-2">Decimal Mark</label>
          <div className="col-span-2">
            <input
              type="text"
              value={(values.decimalMark as string) ?? '.'}
              onChange={(e) => handleChange('decimalMark', e.target.value)}
              maxLength={1}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Currency List */}
        <div className="grid grid-cols-3 gap-4 items-start">
          <label className="text-sm font-medium text-gray-700 pt-2">Currencies</label>
          <div className="col-span-2">
            <div className="flex flex-wrap gap-2 mb-3">
              {currencyList.map((currency) => (
                <span
                  key={currency}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
                >
                  {currency}
                  <button
                    onClick={() => removeCurrency(currency)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value.toUpperCase())}
                placeholder="Add currency (e.g., EUR)"
                maxLength={3}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none uppercase"
              />
              <button
                onClick={addCurrency}
                disabled={!newCurrency}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CurrencyPage;
