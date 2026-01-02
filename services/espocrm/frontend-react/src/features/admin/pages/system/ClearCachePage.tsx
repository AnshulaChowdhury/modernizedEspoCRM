/**
 * ClearCachePage - Clear application cache
 */
import React, { useState } from 'react';
import { Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAdminStore } from '../../store';
import { cn } from '@/lib/utils/cn';

export function ClearCachePage(): React.ReactElement {
  const { clearCache, isClearing } = useAdminStore();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleClearCache = async () => {
    setResult(null);
    const response = await clearCache();
    setResult({ success: response.success, message: response.message ?? '' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Trash2 className="h-6 w-6 text-gray-600" />
        <h1 className="text-2xl font-semibold text-gray-900">Clear Cache</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-8 w-8 text-orange-600" />
          </div>

          <h2 className="text-lg font-medium text-gray-900 mb-2">Clear Application Cache</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            This will clear all cached data including compiled templates, metadata cache, and other temporary files.
            The application may be slower for a moment while caches are rebuilt.
          </p>

          {result && (
            <div
              className={cn(
                'flex items-center justify-center gap-2 p-4 rounded-md mb-6',
                result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              )}
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              {result.message}
            </div>
          )}

          <button
            onClick={handleClearCache}
            disabled={isClearing}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-md transition-colors',
              isClearing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            )}
          >
            {isClearing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Clear Cache
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">When to Clear Cache</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• After modifying configuration files manually</li>
          <li>• After installing or updating extensions</li>
          <li>• If you experience display or data issues</li>
          <li>• After changing language files</li>
        </ul>
      </div>
    </div>
  );
}

export default ClearCachePage;
