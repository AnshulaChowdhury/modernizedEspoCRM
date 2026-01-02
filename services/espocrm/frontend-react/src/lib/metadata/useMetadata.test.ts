/**
 * useMetadata Hook Tests
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMetadata } from './useMetadata';
import { MetadataContext } from './MetadataContext';
import type { MetadataContextType } from './types';

describe('useMetadata', () => {
  const mockMetadata: MetadataContextType = {
    metadata: {
      entityDefs: {
        Account: {
          fields: {
            name: { type: 'varchar' },
          },
          links: {},
        },
      },
      clientDefs: {},
      scopeDefs: {},
    },
    isLoading: false,
    error: null,
  };

  const createWrapper = (value: MetadataContextType | null) => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(MetadataContext.Provider, { value }, children);
    };
  };

  it('returns metadata context', () => {
    const { result } = renderHook(() => useMetadata(), {
      wrapper: createWrapper(mockMetadata),
    });

    expect(result.current).toBe(mockMetadata);
    expect(result.current.metadata?.entityDefs?.Account).toBeDefined();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useMetadata());
    }).toThrow('useMetadata must be used within MetadataProvider');

    consoleSpy.mockRestore();
  });

  it('returns loading state', () => {
    const loadingContext: MetadataContextType = {
      metadata: null,
      isLoading: true,
      error: null,
    };

    const { result } = renderHook(() => useMetadata(), {
      wrapper: createWrapper(loadingContext),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.metadata).toBeNull();
  });

  it('returns error state', () => {
    const errorContext: MetadataContextType = {
      metadata: null,
      isLoading: false,
      error: new Error('Failed to load metadata'),
    };

    const { result } = renderHook(() => useMetadata(), {
      wrapper: createWrapper(errorContext),
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to load metadata');
  });

  it('accesses entity definitions', () => {
    const { result } = renderHook(() => useMetadata(), {
      wrapper: createWrapper(mockMetadata),
    });

    const accountDef = result.current.metadata?.entityDefs?.Account;
    expect(accountDef?.fields?.name?.type).toBe('varchar');
  });

  it('handles missing entity gracefully', () => {
    const { result } = renderHook(() => useMetadata(), {
      wrapper: createWrapper(mockMetadata),
    });

    const unknownEntity = result.current.metadata?.entityDefs?.UnknownEntity;
    expect(unknownEntity).toBeUndefined();
  });
});
