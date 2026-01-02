/**
 * LeadCaptureDetailPage - View/Edit Lead Capture configuration
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileInput,
  Loader2,
  AlertCircle,
  Save,
  ArrowLeft,
  Key,
  Hash,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils/cn';

interface LeadCapture {
  id: string;
  name: string;
  isActive: boolean;
  apiKey: string;
  formId: string;
  leadSource?: string;
  targetListId?: string;
  targetListName?: string;
  targetTeamId?: string;
  targetTeamName?: string;
  campaignId?: string;
  campaignName?: string;
  fieldList: string[];
  formEnabled: boolean;
  formTitle?: string;
  formTheme?: string;
  formText?: string;
  formSuccessText?: string;
  formSuccessRedirectUrl?: string;
  formCaptcha: boolean;
  optInConfirmation: boolean;
  optInConfirmationEmailTemplateId?: string;
  optInConfirmationEmailTemplateName?: string;
  optInConfirmationLifetime: number;
  optInConfirmationSuccessMessage?: string;
  exampleRequestUrl?: string;
  formUrl?: string;
  createdAt: string;
  modifiedAt: string;
}

interface TargetList {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface EmailTemplate {
  id: string;
  name: string;
}

// Available Lead fields for capture (matches Backbone implementation)
const AVAILABLE_LEAD_FIELDS = [
  { name: 'name', label: 'Name' },
  { name: 'firstName', label: 'First Name' },
  { name: 'lastName', label: 'Last Name' },
  { name: 'salutationName', label: 'Salutation' },
  { name: 'title', label: 'Title' },
  { name: 'emailAddress', label: 'Email Address' },
  { name: 'phoneNumber', label: 'Phone Number' },
  { name: 'website', label: 'Website' },
  { name: 'accountName', label: 'Account Name' },
  { name: 'industry', label: 'Industry' },
  { name: 'address', label: 'Address' },
  { name: 'addressStreet', label: 'Street' },
  { name: 'addressCity', label: 'City' },
  { name: 'addressState', label: 'State' },
  { name: 'addressCountry', label: 'Country' },
  { name: 'addressPostalCode', label: 'Postal Code' },
  { name: 'description', label: 'Description' },
  { name: 'doNotCall', label: 'Do Not Call' },
];

const FORM_THEMES = [
  { value: '', label: 'Default' },
  { value: 'default', label: 'Default Theme' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function LeadCaptureDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<LeadCapture>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch lead capture data
  const { data: leadCapture, isLoading, error } = useQuery({
    queryKey: ['admin', 'leadCapture', id],
    queryFn: async () => {
      const response = await apiClient.get<LeadCapture>(`/LeadCapture/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch target lists
  const { data: targetLists } = useQuery({
    queryKey: ['targetLists'],
    queryFn: async () => {
      const response = await apiClient.get<{ list: TargetList[] }>('/TargetList', {
        params: { maxSize: 100, orderBy: 'name' },
      });
      return response.data.list;
    },
  });

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await apiClient.get<{ list: Team[] }>('/Team', {
        params: { maxSize: 100, orderBy: 'name' },
      });
      return response.data.list;
    },
  });

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await apiClient.get<{ list: Campaign[] }>('/Campaign', {
        params: { maxSize: 100, orderBy: 'name' },
      });
      return response.data.list;
    },
  });

  // Fetch email templates
  const { data: emailTemplates } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      const response = await apiClient.get<{ list: EmailTemplate[] }>('/EmailTemplate', {
        params: { maxSize: 100, orderBy: 'name' },
      });
      return response.data.list;
    },
  });

  // Initialize form data from fetched lead capture
  useEffect(() => {
    if (leadCapture) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initialize form with fetched data
      setFormData(leadCapture);
    }
  }, [leadCapture]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<LeadCapture>) => {
      const response = await apiClient.put(`/LeadCapture/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leadCapture', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'leadCapture'] });
      setHasChanges(false);
    },
  });

  // Generate new API key mutation
  const generateApiKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/LeadCapture/action/generateNewApiKey', { id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leadCapture', id] });
    },
  });

  // Generate new Form ID mutation
  const generateFormIdMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/LeadCapture/action/generateNewFormId', { id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leadCapture', id] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const updateField = <K extends keyof LeadCapture>(field: K, value: LeadCapture[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleFieldListChange = (field: string, checked: boolean) => {
    const currentFields = formData.fieldList ?? [];
    const newFields = checked
      ? [...currentFields, field]
      : currentFields.filter((f) => f !== field);
    updateField('fieldList', newFields);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !leadCapture) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Failed to load lead capture configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/Admin/leadCapture')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <FileInput className="h-6 w-6 text-gray-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{leadCapture.name}</h1>
              <p className="text-sm text-gray-500">Lead Capture Configuration</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            hasChanges
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* API Info Panel (Read-only) */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">API Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono">
                {leadCapture.apiKey}
              </code>
              <button
                onClick={() => copyToClipboard(leadCapture.apiKey, 'apiKey')}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Copy to clipboard"
              >
                {copiedField === 'apiKey' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  if (confirm('Generate a new API key? The existing key will stop working.')) {
                    generateApiKeyMutation.mutate();
                  }
                }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Key className="h-4 w-4" />
                Regenerate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form ID</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono">
                {leadCapture.formId}
              </code>
              <button
                onClick={() => copyToClipboard(leadCapture.formId, 'formId')}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Copy to clipboard"
              >
                {copiedField === 'formId' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  if (confirm('Generate a new Form ID? Existing form embeds will stop working.')) {
                    generateFormIdMutation.mutate();
                  }
                }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Hash className="h-4 w-4" />
                Regenerate
              </button>
            </div>
          </div>

          {leadCapture.formId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Form URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono overflow-x-auto">
                  {`${window.location.origin}/lead-capture/${leadCapture.formId}`}
                </code>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/lead-capture/${leadCapture.formId}`, 'formUrl')}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Copy to clipboard"
                >
                  {copiedField === 'formUrl' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
                <a
                  href={`/lead-capture/${leadCapture.formId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Open form"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {leadCapture.exampleRequestUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Example API URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono overflow-x-auto">
                  {leadCapture.exampleRequestUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(leadCapture.exampleRequestUrl!, 'exampleUrl')}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Copy to clipboard"
                >
                  {copiedField === 'exampleUrl' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name ?? ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
            <input
              type="text"
              value={formData.leadSource ?? ''}
              onChange={(e) => updateField('leadSource', e.target.value)}
              placeholder="e.g., Web Form, API"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive ?? false}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>
      </div>

      {/* Target Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Target Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target List</label>
            <select
              value={formData.targetListId ?? ''}
              onChange={(e) => updateField('targetListId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {targetLists?.map((list) => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Team</label>
            <select
              value={formData.targetTeamId ?? ''}
              onChange={(e) => updateField('targetTeamId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {teams?.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
            <select
              value={formData.campaignId ?? ''}
              onChange={(e) => updateField('campaignId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {campaigns?.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payload Fields Section - matches Backbone fieldList multiEnum */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payload Fields</h2>
        <p className="text-sm text-gray-500 mb-4">Select which Lead fields will be captured from the form submission.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AVAILABLE_LEAD_FIELDS.map((field) => (
            <label key={field.name} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.fieldList?.includes(field.name) ?? false}
                onChange={(e) => handleFieldListChange(field.name, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{field.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Form Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Form Settings</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.formEnabled ?? false}
              onChange={(e) => updateField('formEnabled', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Enable Embeddable Form</span>
          </label>

          {formData.formEnabled && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
                <input
                  type="text"
                  value={formData.formTitle ?? ''}
                  onChange={(e) => updateField('formTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Theme</label>
                <select
                  value={formData.formTheme ?? ''}
                  onChange={(e) => updateField('formTheme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FORM_THEMES.map((theme) => (
                    <option key={theme.value} value={theme.value}>{theme.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Text</label>
                <textarea
                  value={formData.formText ?? ''}
                  onChange={(e) => updateField('formText', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Text to display on the form..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Success Message</label>
                <textarea
                  value={formData.formSuccessText ?? ''}
                  onChange={(e) => updateField('formSuccessText', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Message to show after successful submission..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Success Redirect URL</label>
                <input
                  type="url"
                  value={formData.formSuccessRedirectUrl ?? ''}
                  onChange={(e) => updateField('formSuccessRedirectUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/thank-you"
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.formCaptcha ?? false}
                    onChange={(e) => updateField('formCaptcha', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable CAPTCHA</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Opt-In Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Opt-In Settings</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.optInConfirmation ?? false}
              onChange={(e) => updateField('optInConfirmation', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Require Double Opt-In Confirmation</span>
          </label>

          {formData.optInConfirmation && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Email Template</label>
                <select
                  value={formData.optInConfirmationEmailTemplateId ?? ''}
                  onChange={(e) => updateField('optInConfirmationEmailTemplateId', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select template...</option>
                  {emailTemplates?.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Link Lifetime (hours)</label>
                <input
                  type="number"
                  value={formData.optInConfirmationLifetime ?? 48}
                  onChange={(e) => updateField('optInConfirmationLifetime', parseInt(e.target.value, 10))}
                  min={1}
                  max={168}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Success Message</label>
                <textarea
                  value={formData.optInConfirmationSuccessMessage ?? ''}
                  onChange={(e) => updateField('optInConfirmationSuccessMessage', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Message shown after successful opt-in confirmation..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeadCaptureDetailPage;
