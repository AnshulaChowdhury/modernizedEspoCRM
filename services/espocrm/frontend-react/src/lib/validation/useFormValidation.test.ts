/**
 * useFormValidation Hook Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useFormValidation,
  isFieldRequired,
  getFieldConstraints,
  type UseFormValidationOptions,
} from './useFormValidation';

// Mock useMetadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: vi.fn(),
}));

import { useMetadata } from '@/lib/metadata/useMetadata';

const mockUseMetadata = vi.mocked(useMetadata);

const mockFieldDefs = {
  name: { type: 'varchar', required: true, maxLength: 100 },
  email: { type: 'email', required: true },
  phone: { type: 'phone', required: false },
  status: { type: 'enum', options: ['Active', 'Inactive', 'Pending'] },
  age: { type: 'int', min: 0, max: 150 },
  amount: { type: 'float', required: false },
  isActive: { type: 'bool' },
  website: { type: 'url' },
  createdAt: { type: 'datetime', readOnly: true },
};

describe('useFormValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMetadata.mockReturnValue({
      metadata: {
        entityDefs: {
          Contact: { fields: mockFieldDefs },
        },
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMetadata>);
  });

  describe('initialization', () => {
    it('generates schema from metadata', () => {
      const { result } = renderHook(() => useFormValidation('Contact'));

      expect(result.current.schema).not.toBeNull();
      expect(result.current.isReady).toBe(true);
    });

    it('returns null schema when no metadata', () => {
      mockUseMetadata.mockReturnValue({
        metadata: null,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useMetadata>);

      const { result } = renderHook(() => useFormValidation('Contact'));

      expect(result.current.schema).toBeNull();
      expect(result.current.isReady).toBe(false);
    });

    it('returns null schema for unknown entity', () => {
      const { result } = renderHook(() => useFormValidation('UnknownEntity'));

      expect(result.current.schema).toBeNull();
      expect(result.current.isReady).toBe(false);
    });

    it('provides field definitions', () => {
      const { result } = renderHook(() => useFormValidation('Contact'));

      expect(result.current.fieldDefs).toEqual(mockFieldDefs);
    });
  });

  describe('validate', () => {
    it('returns valid for correct data', () => {
      const { result } = renderHook(() => useFormValidation('Contact'));

      const validation = result.current.validate({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        status: 'Active',
        age: 25,
      });

      expect(validation.isValid).toBe(true);
      expect(Object.keys(validation.errors)).toHaveLength(0);
    });

    it('returns errors for missing required fields', () => {
      const { result } = renderHook(() => useFormValidation('Contact'));

      const validation = result.current.validate({
        phone: '123-456-7890',
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.name).toBeDefined();
      expect(validation.errors.email).toBeDefined();
    });

    it('validates enum fields', () => {
      const { result } = renderHook(() => useFormValidation('Contact'));

      const validation = result.current.validate({
        name: 'John',
        email: 'john@example.com',
        status: 'InvalidStatus',
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.status).toBeDefined();
    });

    it('validates number constraints', () => {
      const { result } = renderHook(() => useFormValidation('Contact'));

      const validation = result.current.validate({
        name: 'John',
        email: 'john@example.com',
        age: -5,
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.age).toBeDefined();
    });

    it('validates string length', () => {
      const { result } = renderHook(() => useFormValidation('Contact'));

      const validation = result.current.validate({
        name: 'a'.repeat(150), // Exceeds maxLength of 100
        email: 'john@example.com',
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.name).toBeDefined();
    });
  });

  describe('validateField', () => {
    it('validates a single field', () => {
      const { result } = renderHook(() => useFormValidation('Contact'));

      const error = result.current.validateField('email', '', {});
      expect(error).not.toBeNull();
    });

    it('returns null for valid field', () => {
      const { result } = renderHook(() => useFormValidation('Contact'));

      const error = result.current.validateField('email', 'john@example.com', {});
      expect(error).toBeNull();
    });

    it('returns null for unknown field', () => {
      const { result } = renderHook(() => useFormValidation('Contact'));

      const error = result.current.validateField('unknownField', 'value', {});
      expect(error).toBeNull();
    });
  });

  describe('options', () => {
    it('respects includeFields option', () => {
      const options: UseFormValidationOptions = {
        includeFields: ['name'],
      };

      const { result } = renderHook(() => useFormValidation('Contact', options));

      // Should only validate name, not email
      const validation = result.current.validate({
        name: 'John',
        // email is missing but should not cause error because it's not included
      });

      expect(validation.errors.email).toBeUndefined();
    });

    it('respects excludeFields option', () => {
      const options: UseFormValidationOptions = {
        excludeFields: ['email'],
      };

      const { result } = renderHook(() => useFormValidation('Contact', options));

      // Should not validate email
      const validation = result.current.validate({
        name: 'John',
        // email is missing but should not cause error because it's excluded
      });

      expect(validation.errors.email).toBeUndefined();
    });

    it('skips read-only fields by default', () => {
      const { result } = renderHook(() => useFormValidation('Contact'));

      // createdAt is read-only, should not be validated
      const validation = result.current.validate({
        name: 'John',
        email: 'john@example.com',
        createdAt: null, // Invalid but should be skipped
      });

      expect(validation.errors.createdAt).toBeUndefined();
    });

    it('can include read-only fields when skipReadOnly is false', () => {
      const options: UseFormValidationOptions = {
        skipReadOnly: false,
        includeFields: ['name', 'createdAt'],
      };

      const { result } = renderHook(() => useFormValidation('Contact', options));

      // The schema should be generated even with skipReadOnly: false
      expect(result.current.schema).not.toBeNull();
    });
  });

  describe('custom validations', () => {
    it('runs custom validation function', () => {
      const options: UseFormValidationOptions = {
        customValidations: {
          name: (value) => {
            if (typeof value === 'string' && value.startsWith('X')) {
              return 'Name cannot start with X';
            }
            return null;
          },
        },
      };

      const { result } = renderHook(() => useFormValidation('Contact', options));

      const validation = result.current.validate({
        name: 'Xavier',
        email: 'xavier@example.com',
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.name).toBe('Name cannot start with X');
    });

    it('custom validation receives full form data', () => {
      const customValidator = vi.fn().mockReturnValue(null);

      const options: UseFormValidationOptions = {
        customValidations: {
          name: customValidator,
        },
      };

      const { result } = renderHook(() => useFormValidation('Contact', options));

      const formData = { name: 'John', email: 'john@example.com' };
      result.current.validate(formData);

      expect(customValidator).toHaveBeenCalledWith('John', formData);
    });

    it('custom validation in validateField', () => {
      const options: UseFormValidationOptions = {
        customValidations: {
          name: () => 'Custom error',
        },
      };

      const { result } = renderHook(() => useFormValidation('Contact', options));

      const error = result.current.validateField('name', 'Valid Name', {});
      expect(error).toBe('Custom error');
    });
  });
});

describe('isFieldRequired', () => {
  it('returns true for required field', () => {
    expect(isFieldRequired({ type: 'varchar', required: true })).toBe(true);
  });

  it('returns false for optional field', () => {
    expect(isFieldRequired({ type: 'varchar', required: false })).toBe(false);
  });

  it('returns false when required is undefined', () => {
    expect(isFieldRequired({ type: 'varchar' })).toBe(false);
  });

  it('returns false for undefined fieldDef', () => {
    expect(isFieldRequired(undefined)).toBe(false);
  });
});

describe('getFieldConstraints', () => {
  it('returns all constraints', () => {
    const constraints = getFieldConstraints({
      type: 'varchar',
      required: true,
      maxLength: 100,
      minLength: 1,
    });

    expect(constraints).toEqual({
      required: true,
      maxLength: 100,
      minLength: 1,
    });
  });

  it('returns number constraints', () => {
    const constraints = getFieldConstraints({
      type: 'int',
      min: 0,
      max: 100,
    });

    expect(constraints).toEqual({
      required: false,
      min: 0,
      max: 100,
    });
  });

  it('returns enum options', () => {
    const constraints = getFieldConstraints({
      type: 'enum',
      options: ['A', 'B', 'C'],
    });

    expect(constraints.options).toEqual(['A', 'B', 'C']);
  });

  it('returns pattern', () => {
    const constraints = getFieldConstraints({
      type: 'varchar',
      pattern: '^[A-Z]+$',
    });

    expect(constraints.pattern).toBe('^[A-Z]+$');
  });

  it('returns defaults for undefined fieldDef', () => {
    const constraints = getFieldConstraints(undefined);

    expect(constraints).toEqual({ required: false });
  });
});
