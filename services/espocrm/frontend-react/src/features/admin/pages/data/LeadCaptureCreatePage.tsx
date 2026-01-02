/**
 * LeadCaptureCreatePage - Create new Lead Capture configuration
 * Matches Backbone detailSmall layout: name, isActive, campaign, subscribeToTargetList,
 * subscribeContactToTargetList, targetList, leadSource
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileInput,
  Loader2,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { apiClient, ApiError } from '@/api/client';
import { LinkFieldWithCreate } from '@/components/common/LinkFieldWithCreate';

interface TargetList {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface CreateLeadCaptureData {
  name: string;
  isActive: boolean;
  campaignId?: string;
  subscribeToTargetList: boolean;
  subscribeContactToTargetList: boolean;
  targetListId?: string;
  leadSource: string;
  fieldList: string[];
}

const LEAD_SOURCE_OPTIONS = [
  'Web Site',
  'Call',
  'Email',
  'Existing Customer',
  'Partner',
  'Campaign',
  'Other',
];

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

const DEFAULT_FIELD_LIST = ['firstName', 'lastName', 'emailAddress'];

export function LeadCaptureCreatePage(): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateLeadCaptureData>({
    name: '',
    isActive: true,
    campaignId: undefined,
    subscribeToTargetList: true,
    subscribeContactToTargetList: true,
    targetListId: undefined,
    leadSource: 'Web Site',
    fieldList: DEFAULT_FIELD_LIST,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateLeadCaptureData) => {
      // Build payload matching EspoCRM entity structure
      const payload: Record<string, unknown> = {
        name: data.name,
        isActive: data.isActive,
        subscribeToTargetList: data.subscribeToTargetList,
        subscribeContactToTargetList: data.subscribeContactToTargetList,
        leadSource: data.leadSource,
        fieldList: data.fieldList,
      };

      if (data.campaignId) {
        payload.campaignId = data.campaignId;
      }

      if (data.targetListId) {
        payload.targetListId = data.targetListId;
      }

      const response = await apiClient.post('/LeadCapture', payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leadCapture'] });
      navigate(`/Admin/leadCapture/${data.id}`);
    },
    onError: (error: unknown) => {
      let message = 'Failed to create lead capture';
      if (error instanceof ApiError) {
        message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      setErrors({ submit: message });
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // If subscribeToTargetList is true, targetList is required
    if (formData.subscribeToTargetList && !formData.targetListId) {
      newErrors.targetListId = 'Target List is required when subscription is enabled';
    }

    // fieldList is required
    if (formData.fieldList.length === 0) {
      newErrors.fieldList = 'At least one field must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldToggle = (fieldName: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      fieldList: checked
        ? [...prev.fieldList, fieldName]
        : prev.fieldList.filter((f) => f !== fieldName),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/Admin/leadCapture')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <FileInput className="h-6 w-6 text-gray-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create Lead Capture</h1>
            <p className="text-sm text-gray-500">Set up a new lead capture configuration</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {/* Row 1: Name, Is Active */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Is Active
              </label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Row 2: Campaign (full width) - with quick create */}
          <LinkFieldWithCreate
            label="Campaign"
            value={formData.campaignId}
            onChange={(value) => setFormData((prev) => ({ ...prev, campaignId: value }))}
            options={campaigns}
            entityType="Campaign"
            queryKey="campaigns"
          />

          {/* Row 3: Subscribe to Target List, Subscribe Contact to Target List */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscribe to Target List
              </label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.subscribeToTargetList}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subscribeToTargetList: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enabled</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscribe Contact to Target List
              </label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.subscribeContactToTargetList}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subscribeContactToTargetList: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enabled</span>
                </label>
              </div>
            </div>
          </div>

          {/* Row 4: Target List (full width) - with quick create */}
          <LinkFieldWithCreate
            label="Target List"
            value={formData.targetListId}
            onChange={(value) => setFormData((prev) => ({ ...prev, targetListId: value }))}
            options={targetLists}
            entityType="TargetList"
            queryKey="targetLists"
            required={formData.subscribeToTargetList}
            error={errors.targetListId}
          />

          {/* Row 5: Lead Source (full width) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead Source
            </label>
            <select
              value={formData.leadSource}
              onChange={(e) => setFormData((prev) => ({ ...prev, leadSource: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LEAD_SOURCE_OPTIONS.map((source) => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          {/* Payload Fields Section - matches Backbone fieldList multiEnum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payload Fields <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Select which Lead fields will be captured from the form submission.
            </p>
            <div className={`border rounded-md p-4 ${errors.fieldList ? 'border-red-500' : 'border-gray-300'}`}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_LEAD_FIELDS.map((field) => (
                  <label key={field.name} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.fieldList.includes(field.name)}
                      onChange={(e) => handleFieldToggle(field.name, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {errors.fieldList && (
              <p className="mt-1 text-sm text-red-500">{errors.fieldList}</p>
            )}
          </div>
        </div>

        {/* Error message */}
        {errors.submit && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/Admin/leadCapture')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default LeadCaptureCreatePage;
