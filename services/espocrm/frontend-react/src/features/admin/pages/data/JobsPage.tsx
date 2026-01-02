/**
 * JobsPage - View scheduled and failed jobs
 */
import React, { useState } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { RecordList } from '@/features/entities/components/RecordList';

type JobTab = 'scheduled' | 'failed';

export function JobsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<JobTab>('scheduled');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-gray-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Jobs
            </h1>
            <p className="text-sm text-gray-500">
              View scheduled and failed background jobs
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 -mb-px transition-colors ${
            activeTab === 'scheduled'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          Scheduled Jobs
        </button>
        <button
          onClick={() => setActiveTab('failed')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 -mb-px transition-colors ${
            activeTab === 'failed'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          Failed Jobs
        </button>
      </div>

      {/* Record list */}
      <RecordList entityType="Job" />
    </div>
  );
}

export default JobsPage;
