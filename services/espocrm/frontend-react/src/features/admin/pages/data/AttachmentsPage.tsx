/**
 * AttachmentsPage - Manage attachments
 */
import React from 'react';
import { Paperclip } from 'lucide-react';
import { RecordList } from '@/features/entities/components/RecordList';

export function AttachmentsPage(): React.ReactElement {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Paperclip className="h-6 w-6 text-gray-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Attachments
            </h1>
            <p className="text-sm text-gray-500">
              View and manage file attachments
            </p>
          </div>
        </div>
      </div>

      {/* Record list */}
      <RecordList entityType="Attachment" />
    </div>
  );
}

export default AttachmentsPage;
