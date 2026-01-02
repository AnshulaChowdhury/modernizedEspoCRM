/**
 * EntityDetailPage Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EntityDetailPage from './EntityDetailPage';

// Mock useMetadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: vi.fn(),
}));

import { useMetadata } from '@/lib/metadata/useMetadata';

const mockUseMetadata = vi.mocked(useMetadata);

// Mock RecordDetail component
vi.mock('../components', () => ({
  RecordDetail: ({ entityType, recordId }: { entityType: string; recordId: string }) => (
    <div data-testid="record-detail">
      <span data-testid="entity-type">{entityType}</span>
      <span data-testid="record-id">{recordId}</span>
    </div>
  ),
}));

function renderWithRouter(entityType: string = 'Account', id: string = 'acc-001') {
  return render(
    <MemoryRouter initialEntries={[`/${entityType}/view/${id}`]}>
      <Routes>
        <Route path="/:entityType/view/:id" element={<EntityDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('EntityDetailPage', () => {
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

    it('renders RecordDetail when entity is enabled', () => {
      renderWithRouter('Account', 'acc-001');

      expect(screen.getByTestId('record-detail')).toBeInTheDocument();
      expect(screen.getByTestId('entity-type')).toHaveTextContent('Account');
      expect(screen.getByTestId('record-id')).toHaveTextContent('acc-001');
    });
  });

  describe('URL parameters', () => {
    it('passes entityType from URL to RecordDetail', () => {
      renderWithRouter('Account', 'acc-001');

      expect(screen.getByTestId('entity-type')).toHaveTextContent('Account');
    });

    it('passes id from URL to RecordDetail', () => {
      renderWithRouter('Account', 'acc-999');

      expect(screen.getByTestId('record-id')).toHaveTextContent('acc-999');
    });
  });
});
