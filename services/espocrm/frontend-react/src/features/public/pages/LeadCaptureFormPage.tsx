/**
 * LeadCaptureFormPage - Public lead capture form for external users
 * This page is accessible without authentication
 *
 * URL format: /lead-capture/{formId}
 * where formId is the LeadCapture entity's formId field (not the entity ID)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { apiClient, ApiError } from '@/api/client';

// Declare grecaptcha on window for TypeScript (reCAPTCHA v3)
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface FieldDef {
  type: string;
  required?: boolean;
  options?: string[];
  onlyPrimary?: boolean;
}

interface LayoutRow {
  name: string;
}

interface LayoutPanel {
  rows: LayoutRow[][];
}

interface LeadCaptureFormConfig {
  formId: string;
  name: string;
  title?: string;
  text?: string;
  successText?: string;
  fieldDefs: Record<string, FieldDef>;
  detailLayout: LayoutPanel[];
  language: {
    Lead?: {
      fields?: Record<string, string>;
      options?: Record<string, Record<string, string>>;
    };
  };
  optInConfirmation: boolean;
  formSuccessRedirectUrl?: string;
  isDark?: boolean;
  captchaKey?: string;
}

interface SubmitResponse {
  redirectUrl?: string;
}

// Get field list from layout
function getFieldListFromLayout(layout: LayoutPanel[]): string[] {
  const fields: string[] = [];
  for (const panel of layout) {
    for (const row of panel.rows) {
      for (const cell of row) {
        if (cell.name) {
          fields.push(cell.name);
        }
      }
    }
  }
  return fields;
}

// Get field label from language data
function getFieldLabel(field: string, language: LeadCaptureFormConfig['language']): string {
  const label = language?.Lead?.fields?.[field];
  if (label) return label;

  // Fallback: convert camelCase to Title Case
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Get input type for field
function getInputType(fieldDef: FieldDef): string {
  switch (fieldDef.type) {
    case 'email':
      return 'email';
    case 'phone':
      return 'tel';
    case 'url':
      return 'url';
    case 'int':
    case 'float':
    case 'currency':
      return 'number';
    case 'text':
      return 'textarea';
    default:
      return 'text';
  }
}

export function LeadCaptureFormPage(): React.ReactElement {
  const { formId } = useParams<{ formId: string }>();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Fetch form configuration from public API endpoint
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['leadCaptureForm', formId],
    queryFn: async () => {
      const response = await apiClient.get<LeadCaptureFormConfig>(`/LeadCapture/form/${formId}`);
      return response.data;
    },
    enabled: !!formId,
    retry: false,
  });

  // Load reCAPTCHA v3 script when captchaKey is available
  useEffect(() => {
    if (!config?.captchaKey) return;

    // Check if script already loaded
    if (window.grecaptcha) {
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`);
    if (existingScript) {
      return;
    }

    // Load the reCAPTCHA v3 script with render parameter
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${config.captchaKey}`;
    script.async = true;
    document.head.appendChild(script);
  }, [config?.captchaKey]);

  // Get captcha token (matches Backbone: action = 'leadCaptureSubmit')
  const getCaptchaToken = useCallback(async (): Promise<string | null> => {
    if (!config?.captchaKey) return null;

    // Wait for grecaptcha to be available
    const waitForGrecaptcha = (): Promise<void> => {
      return new Promise((resolve) => {
        if (window.grecaptcha) {
          resolve();
          return;
        }
        const interval = setInterval(() => {
          if (window.grecaptcha) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    };

    await waitForGrecaptcha();

    return new Promise((resolve) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(config.captchaKey!, { action: 'leadCaptureSubmit' });
          resolve(token);
        } catch (err) {
          console.error('Failed to execute captcha:', err);
          resolve(null);
        }
      });
    });
  }, [config?.captchaKey]);

  // Submit form mutation
  const submitMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      // Get captcha token if captcha is enabled
      let captchaToken: string | null = null;
      if (config?.captchaKey) {
        captchaToken = await getCaptchaToken();
        if (!captchaToken) {
          throw new Error('Failed to verify captcha. Please try again.');
        }
      }

      const response = await apiClient.post<SubmitResponse>(
        `/LeadCapture/form/${formId}`,
        data,
        {
          headers: captchaToken ? { 'X-Captcha-Token': captchaToken } : {},
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setSubmitted(true);
      // Handle redirect if configured
      const redirectUrl = data?.redirectUrl || config?.formSuccessRedirectUrl;
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 2000);
      }
    },
    onError: (error: unknown) => {
      let message = 'Failed to submit form. Please try again.';
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

    if (!config) return false;

    const fieldList = getFieldListFromLayout(config.detailLayout);

    for (const field of fieldList) {
      const fieldDef = config.fieldDefs[field];
      if (!fieldDef) continue;

      const value = formData[field]?.trim() || '';
      const label = getFieldLabel(field, config.language);

      // Check required fields
      if (fieldDef.required && !value) {
        newErrors[field] = `${label} is required`;
        continue;
      }

      // Validate email format
      if (fieldDef.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field] = 'Please enter a valid email address';
      }

      // Validate URL format
      if (fieldDef.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
        newErrors[field] = 'Please enter a valid URL (starting with http:// or https://)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      submitMutation.mutate(formData);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  // Error state - form not found or inactive
  if (error || !config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Form Not Available</h1>
          <p className="text-gray-600">
            This form is no longer available or the link may be incorrect.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600">
            {config.successText || 'Your submission has been received. We will be in touch soon.'}
          </p>
          {config.optInConfirmation && (
            <p className="text-sm text-gray-500 mt-4">
              Please check your email to confirm your subscription.
            </p>
          )}
          {config.formSuccessRedirectUrl && (
            <p className="text-sm text-gray-400 mt-4">
              Redirecting...
            </p>
          )}
        </div>
      </div>
    );
  }

  const fieldList = getFieldListFromLayout(config.detailLayout);

  // Main form
  return (
    <div className={`min-h-screen py-12 px-4 ${config.isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-lg mx-auto">
        {/* Form header */}
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-bold ${config.isDark ? 'text-white' : 'text-gray-900'}`}>
            {config.title || config.name}
          </h1>
          {config.text && (
            <p className={`mt-2 ${config.isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {config.text}
            </p>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={`rounded-lg shadow-lg p-6 sm:p-8 ${config.isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="space-y-5">
            {fieldList.map((field) => {
              const fieldDef = config.fieldDefs[field];
              if (!fieldDef) return null;

              const label = getFieldLabel(field, config.language);
              const inputType = getInputType(fieldDef);
              const isRequired = fieldDef.required;

              // Handle enum/select fields
              if (fieldDef.type === 'enum' && fieldDef.options) {
                const optionLabels = config.language?.Lead?.options?.[field] || {};
                return (
                  <div key={field}>
                    <label className={`block text-sm font-medium mb-1 ${config.isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {label}
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                      value={formData[field] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[field] ? 'border-red-500' : config.isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Select --</option>
                      {fieldDef.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {optionLabels[opt] || opt}
                        </option>
                      ))}
                    </select>
                    {errors[field] && (
                      <p className="mt-1 text-sm text-red-500">{errors[field]}</p>
                    )}
                  </div>
                );
              }

              // Handle textarea fields
              if (inputType === 'textarea') {
                return (
                  <div key={field}>
                    <label className={`block text-sm font-medium mb-1 ${config.isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {label}
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      value={formData[field] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[field] ? 'border-red-500' : config.isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                    />
                    {errors[field] && (
                      <p className="mt-1 text-sm text-red-500">{errors[field]}</p>
                    )}
                  </div>
                );
              }

              // Handle regular input fields
              return (
                <div key={field}>
                  <label className={`block text-sm font-medium mb-1 ${config.isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {label}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={inputType}
                    value={formData[field] || ''}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[field] ? 'border-red-500' : config.isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                    }`}
                  />
                  {errors[field] && (
                    <p className="mt-1 text-sm text-red-500">{errors[field]}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Opt-in notice */}
          {config.optInConfirmation && (
            <p className={`mt-4 text-xs ${config.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              By submitting this form, you agree to receive email communications from us.
              You will need to confirm your subscription via email.
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Submit
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className={`mt-6 text-center text-xs ${config.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Powered by Krisette & Co.
        </p>
      </div>
    </div>
  );
}

export default LeadCaptureFormPage;
