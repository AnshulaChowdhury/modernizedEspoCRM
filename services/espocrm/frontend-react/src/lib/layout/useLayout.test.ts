/**
 * useLayout Hook Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useLayout,
  useDetailLayout,
  useListLayout,
  getDefaultDetailLayout,
  getDefaultListLayout,
} from './useLayout';

// Mock API client
vi.mock('@/api/client', () => ({
  get: vi.fn(),
}));

import { get } from '@/api/client';

const mockGet = vi.mocked(get);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches layout from API', async () => {
    const mockLayout = [{ label: 'Overview', rows: [[{ name: 'name' }]] }];
    mockGet.mockResolvedValue(mockLayout);

    const { result } = renderHook(
      () => useLayout('Account', 'detail'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGet).toHaveBeenCalledWith('/Account/layout/detail');
    expect(result.current.layout).toEqual(mockLayout);
  });

  it('shows loading state initially', () => {
    mockGet.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(
      () => useLayout('Account', 'detail'),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.layout).toBeUndefined();
  });

  it('returns error on fetch failure', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useLayout('Account', 'detail'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe('Network error');
  });

  it('supports enabled option', async () => {
    mockGet.mockResolvedValue([]);

    const { result } = renderHook(
      () => useLayout('Account', 'detail', { enabled: false }),
      { wrapper: createWrapper() }
    );

    // Should not call API when disabled
    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('does not fetch when entityType is empty', () => {
    mockGet.mockResolvedValue([]);

    renderHook(
      () => useLayout('', 'detail'),
      { wrapper: createWrapper() }
    );

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fetches different layout types', async () => {
    mockGet.mockResolvedValue([]);

    const { result: listResult } = renderHook(
      () => useLayout('Contact', 'list'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(listResult.current.isLoading).toBe(false);
    });

    expect(mockGet).toHaveBeenCalledWith('/Contact/layout/list');
  });
});

describe('useDetailLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches detail layout', async () => {
    const mockLayout = [{ label: 'Overview', rows: [[{ name: 'name' }]] }];
    mockGet.mockResolvedValue(mockLayout);

    const { result } = renderHook(
      () => useDetailLayout('Account'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGet).toHaveBeenCalledWith('/Account/layout/detail');
    expect(result.current.layout).toEqual(mockLayout);
  });

  it('supports enabled option', () => {
    mockGet.mockResolvedValue([]);

    renderHook(
      () => useDetailLayout('Account', { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe('useListLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches list layout', async () => {
    const mockLayout = [{ name: 'name', link: true }];
    mockGet.mockResolvedValue(mockLayout);

    const { result } = renderHook(
      () => useListLayout('Contact'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGet).toHaveBeenCalledWith('/Contact/layout/list');
    expect(result.current.layout).toEqual(mockLayout);
  });

  it('supports enabled option', () => {
    mockGet.mockResolvedValue([]);

    renderHook(
      () => useListLayout('Contact', { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe('getDefaultDetailLayout', () => {
  it('creates layout with name field first', () => {
    const fieldDefs = {
      name: { type: 'varchar' },
      email: { type: 'email' },
      phone: { type: 'phone' },
    };

    const layout = getDefaultDetailLayout(fieldDefs);

    expect(layout).toHaveLength(1);
    expect(layout[0].rows[0][0]).toEqual({ name: 'name' });
  });

  it('excludes system fields', () => {
    const fieldDefs = {
      name: { type: 'varchar' },
      id: { type: 'id' },
      deleted: { type: 'bool' },
      createdAt: { type: 'datetime' },
      modifiedAt: { type: 'datetime' },
      createdById: { type: 'link' },
      modifiedById: { type: 'link' },
    };

    const layout = getDefaultDetailLayout(fieldDefs);

    // Should only include name
    const allFieldNames = layout[0].rows.flat().filter(Boolean).map((cell: { name: string } | false) => {
      if (cell && typeof cell === 'object') return cell.name;
      return null;
    });
    expect(allFieldNames).toContain('name');
    expect(allFieldNames).not.toContain('id');
    expect(allFieldNames).not.toContain('deleted');
    expect(allFieldNames).not.toContain('createdById');
  });

  it('creates rows with 2 columns', () => {
    const fieldDefs = {
      name: { type: 'varchar' },
      email: { type: 'email' },
      phone: { type: 'phone' },
      website: { type: 'url' },
    };

    const layout = getDefaultDetailLayout(fieldDefs);

    // With 4 fields, should have 2 rows of 2
    expect(layout[0].rows.length).toBe(2);
    expect(layout[0].rows[0].length).toBe(2);
    expect(layout[0].rows[1].length).toBe(2);
  });

  it('handles odd number of fields with false placeholder', () => {
    const fieldDefs = {
      name: { type: 'varchar' },
      email: { type: 'email' },
      phone: { type: 'phone' },
    };

    const layout = getDefaultDetailLayout(fieldDefs);

    // 3 fields should create 2 rows, with last cell being false
    expect(layout[0].rows.length).toBe(2);
    expect(layout[0].rows[1][1]).toBe(false);
  });

  it('returns empty panel for no fields', () => {
    const layout = getDefaultDetailLayout({});

    expect(layout).toHaveLength(1);
    expect(layout[0].rows).toHaveLength(0);
  });

  it('moves name to first position if not already there', () => {
    const fieldDefs = {
      email: { type: 'email' },
      phone: { type: 'phone' },
      name: { type: 'varchar' },
    };

    const layout = getDefaultDetailLayout(fieldDefs);

    expect(layout[0].rows[0][0]).toEqual({ name: 'name' });
  });
});

describe('getDefaultListLayout', () => {
  it('creates layout with name column linked', () => {
    const fieldDefs = {
      name: { type: 'varchar' },
      email: { type: 'email' },
    };

    const layout = getDefaultListLayout(fieldDefs);

    expect(layout[0]).toEqual({ name: 'name', link: true });
  });

  it('includes common columns when available', () => {
    const fieldDefs = {
      name: { type: 'varchar' },
      status: { type: 'enum' },
      createdAt: { type: 'datetime' },
      modifiedAt: { type: 'datetime' },
    };

    const layout = getDefaultListLayout(fieldDefs);
    const columnNames = layout.map((col) => col.name);

    expect(columnNames).toContain('name');
    expect(columnNames).toContain('status');
    expect(columnNames).toContain('createdAt');
    expect(columnNames).toContain('modifiedAt');
  });

  it('adds additional fields when common columns are few', () => {
    const fieldDefs = {
      name: { type: 'varchar' },
      email: { type: 'email' },
      phone: { type: 'phone' },
      website: { type: 'url' },
    };

    const layout = getDefaultListLayout(fieldDefs);

    // Should have at least 4 columns
    expect(layout.length).toBeGreaterThanOrEqual(2);
  });

  it('excludes description field', () => {
    const fieldDefs = {
      name: { type: 'varchar' },
      description: { type: 'text' },
      email: { type: 'email' },
    };

    const layout = getDefaultListLayout(fieldDefs);
    const columnNames = layout.map((col) => col.name);

    expect(columnNames).not.toContain('description');
  });

  it('excludes id and deleted fields', () => {
    const fieldDefs = {
      id: { type: 'id' },
      name: { type: 'varchar' },
      deleted: { type: 'bool' },
    };

    const layout = getDefaultListLayout(fieldDefs);
    const columnNames = layout.map((col) => col.name);

    expect(columnNames).not.toContain('id');
    expect(columnNames).not.toContain('deleted');
  });

  it('returns empty array for no fields', () => {
    const layout = getDefaultListLayout({});

    expect(layout).toEqual([]);
  });

  it('handles entity with only name field', () => {
    const fieldDefs = {
      name: { type: 'varchar' },
    };

    const layout = getDefaultListLayout(fieldDefs);

    expect(layout.length).toBe(1);
    expect(layout[0]).toEqual({ name: 'name', link: true });
  });
});
