/**
 * RebuildPage - Rebuild application
 */
import React, { useState } from 'react';
import { RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAdminStore } from '../../store';
import { cn } from '@/lib/utils/cn';

export function RebuildPage(): React.ReactElement {
  const { rebuild, isRebuilding } = useAdminStore();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRebuild = async () => {
    setResult(null);
    const response = await rebuild();
    setResult({ success: response.success, message: response.message ?? '' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <RefreshCw className="h-6 w-6 text-gray-600" />
        <h1 className="text-2xl font-semibold text-gray-900">Rebuild</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="h-8 w-8 text-blue-600" />
          </div>

          <h2 className="text-lg font-medium text-gray-900 mb-2">Rebuild Application</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            This will rebuild the application including database schema updates, relationship rebuilding,
            and regenerating all cached metadata. This operation may take a few moments.
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
            onClick={handleRebuild}
            disabled={isRebuilding}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-md transition-colors',
              isRebuilding
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {isRebuilding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rebuilding...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Rebuild
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">What Rebuild Does</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Updates database schema for entity changes</li>
            <li>• Rebuilds relationship definitions</li>
            <li>• Regenerates metadata cache</li>
            <li>• Compiles layout and language files</li>
            <li>• Updates search indexes</li>
          </ul>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">When to Rebuild</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• After creating or modifying entities in Entity Manager</li>
            <li>• After adding or modifying fields</li>
            <li>• After changing relationships between entities</li>
            <li>• After installing extensions that add new entities</li>
            <li>• If data integrity issues are suspected</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RebuildPage;
