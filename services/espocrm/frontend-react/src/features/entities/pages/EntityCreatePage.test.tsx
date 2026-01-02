/**
 * EntityCreatePage Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EntityCreatePage from './EntityCreatePage';

// Mock useMetadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: vi.fn(),
}));

// Mock useAcl
vi.mock('@/lib/acl', () => ({
  useAcl: vi.fn(),
}));

import { useMetadata } from '@/lib/metadata/useMetadata';
import { useAcl } from '@/lib/acl';

const mockUseMetadata = vi.mocked(useMetadata);
const mockUseAcl = vi.mocked(useAcl);

// Mock RecordCreate component
vi.mock('../components', () => ({
  RecordCreate: ({ entityType }: { entityType: string }) => (
    <div data-testid="record-create">
      <span data-testid="entity-type">{entityType}</span>
    </div>
  ),
}));

function renderWithRouter(entityType: string = 'Account') {
  return render(
    <MemoryRouter initialEntries={[`/${entityType}/create`]}>
      <Routes>
        <Route path="/:entityType/create" element={<EntityCreatePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('EntityCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMetadata.mockReturnValue({
      metadata: {
        entityDefs: {
          Account: { fields: { name: { type: 'varchar' } } },
        },
      },
      isLoading: false,
      error: null,
      isEntityEnabled: (entityType: string) => entityType === 'Account',
    } as ReturnType<typeof useMetadata>);

    mockUseAcl.mockReturnValue({
      checkScope: () => true,
      checkRecord: () => true,
      checkField: () => true,
      isAdmin: false,
    });
  });

  describe('loading state', () => {
    it('shows loading spinner while metadata is loading', () => {
      mockUseMetadata.mockReturnValue({
        metadata: null,
        isLoading: true,
        error: null,
        isEntityEnabled: () => false,
      } as ReturnType<typeof useMetadata>);

      renderWithRouter();

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('entity availability', () => {
    it('shows error when entity is not enabled', () => {
      renderWithRouter('UnknownEntity');

      expect(screen.getByText('Entity Not Available')).toBeInTheDocument();
      expect(screen.getByText(/UnknownEntity.*not enabled/)).toBeInTheDocument();
    });

    it('renders RecordCreate when entity is enabled and user has permission', () => {
      renderWithRouter('Account');

      expect(screen.getByTestId('record-create')).toBeInTheDocument();
      expect(screen.getByTestId('entity-type')).toHaveTextContent('Account');
    });
  });

  describe('permission checks', () => {
    it('shows access denied when user lacks create permission', () => {
      mockUseAcl.mockReturnValue({
        checkScope: () => false,
        checkRecord: () => false,
        checkField: () => true,
        isAdmin: false,
      });

      renderWithRouter('Account');

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/do not have permission to create Account/)).toBeInTheDocument();
    });

    it('renders RecordCreate when user has create permission', () => {
      mockUseAcl.mockReturnValue({
        checkScope: (scope: string, action: string) => action === 'create',
        checkRecord: () => true,
        checkField: () => true,
        isAdmin: false,
      });

      renderWithRouter('Account');

      expect(screen.getByTestId('record-create')).toBeInTheDocument();
    });
  });

  describe('URL parameters', () => {
    it('passes entityType from URL to RecordCreate', () => {
      renderWithRouter('Account');

      expect(screen.getByTestId('entity-type')).toHaveTextContent('Account');
    });
  });
});
