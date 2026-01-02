/**
 * SmsPage - SMS configuration page
 */
import React from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';

export function SmsPage(): React.ReactElement {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              SMS
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Configure SMS sending capabilities
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            SMS Integration
          </h2>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            SMS functionality requires an SMS provider extension. Popular options include Twilio, Vonage, and other providers.
          </p>
          <a
            href="https://www.espocrm.com/extensions/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700"
          >
            Browse Extensions
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default SmsPage;
