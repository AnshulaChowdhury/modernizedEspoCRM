/**
 * ImportPage - Data import functionality
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, History } from 'lucide-react';
import { RecordList } from '@/features/entities/components/RecordList';

export function ImportPage(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Upload className="h-6 w-6 text-gray-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Import
            </h1>
            <p className="text-sm text-gray-500">
              Import data from CSV files
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/Import/create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Import
        </button>
      </div>

      {/* Import history */}
      <div className="mb-4 flex items-center gap-2 text-gray-600">
        <History className="h-4 w-4" />
        <span className="text-sm font-medium">Import History</span>
      </div>

      {/* Record list */}
      <RecordList entityType="Import" />
    </div>
  );
}

export default ImportPage;
