/**
 * EntityEditPage Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EntityEditPage from './EntityEditPage';

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

// Mock RecordEdit component
vi.mock('../components', () => ({
  RecordEdit: ({ entityType, recordId }: { entityType: string; recordId: string }) => (
    <div data-testid="record-edit">
      <span data-testid="entity-type">{entityType}</span>
      <span data-testid="record-id">{recordId}</span>
    </div>
  ),
}));

function renderWithRouter(entityType: string = 'Account', id: string = 'acc-001') {
  return render(
    <MemoryRouter initialEntries={[`/${entityType}/edit/${id}`]}>
      <Routes>
        <Route path="/:entityType/edit/:id" element={<EntityEditPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('EntityEditPage', () => {
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
      renderWithRouter('UnknownEntity', 'unk-001');

      expect(screen.getByText('Entity Not Available')).toBeInTheDocument();
      expect(screen.getByText(/UnknownEntity.*not enabled/)).toBeInTheDocument();
    });

    it('renders RecordEdit when entity is enabled and user has permission', () => {
      renderWithRouter('Account', 'acc-001');

      expect(screen.getByTestId('record-edit')).toBeInTheDocument();
      expect(screen.getByTestId('entity-type')).toHaveTextContent('Account');
      expect(screen.getByTestId('record-id')).toHaveTextContent('acc-001');
    });
  });

  describe('permission checks', () => {
    it('shows access denied when user lacks edit permission', () => {
      mockUseAcl.mockReturnValue({
        checkScope: () => false,
        checkRecord: () => false,
        checkField: () => true,
        isAdmin: false,
      });

      renderWithRouter('Account', 'acc-001');

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/do not have permission to edit Account/)).toBeInTheDocument();
    });

    it('renders RecordEdit when user has edit permission', () => {
      mockUseAcl.mockReturnValue({
        checkScope: (scope: string, action: string) => action === 'edit',
        checkRecord: () => true,
        checkField: () => true,
        isAdmin: false,
      });

      renderWithRouter('Account', 'acc-001');

      expect(screen.getByTestId('record-edit')).toBeInTheDocument();
    });
  });

  describe('URL parameters', () => {
    it('passes entityType from URL to RecordEdit', () => {
      renderWithRouter('Account', 'acc-001');

      expect(screen.getByTestId('entity-type')).toHaveTextContent('Account');
    });

    it('passes id from URL to RecordEdit', () => {
      renderWithRouter('Account', 'acc-999');

      expect(screen.getByTestId('record-id')).toHaveTextContent('acc-999');
    });
  });
});
