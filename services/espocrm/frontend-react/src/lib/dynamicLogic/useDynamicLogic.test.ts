/**
 * useDynamicLogic Hook Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDynamicLogic, useFieldDynamicLogic } from './useDynamicLogic';

// Mock useMetadata
vi.mock('@/lib/metadata/useMetadata', () => ({
  useMetadata: vi.fn(() => ({
    metadata: null,
  })),
}));

import { useMetadata } from '@/lib/metadata/useMetadata';

const mockUseMetadata = vi.mocked(useMetadata);

describe('useDynamicLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('without metadata', () => {
    beforeEach(() => {
      mockUseMetadata.mockReturnValue({
        metadata: null,
        isLoading: false,
        error: null,
        getEntityDef: vi.fn(),
        getFieldDef: vi.fn(),
        getLinkDef: vi.fn(),
        getScopeDef: vi.fn(),
        isEntityEnabled: vi.fn(),
        getEntityList: vi.fn(),
      });
    });

    it('returns default field state', () => {
      const { result } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: {} })
      );

      const fieldState = result.current.getFieldState('name');
      expect(fieldState.visible).toBe(true);
      expect(fieldState.required).toBe(false);
      expect(fieldState.readOnly).toBe(false);
      expect(fieldState.invalid).toBe(false);
    });

    it('returns default panel state', () => {
      const { result } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: {} })
      );

      const panelState = result.current.getPanelState('overview');
      expect(panelState.visible).toBe(true);
    });

    it('isFieldVisible returns true by default', () => {
      const { result } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: {} })
      );

      expect(result.current.isFieldVisible('anyField')).toBe(true);
    });

    it('isFieldRequired returns false by default', () => {
      const { result } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: {} })
      );

      expect(result.current.isFieldRequired('anyField')).toBe(false);
    });

    it('isFieldReadOnly returns false by default', () => {
      const { result } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: {} })
      );

      expect(result.current.isFieldReadOnly('anyField')).toBe(false);
    });

    it('getFilteredOptions returns undefined by default', () => {
      const { result } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: {} })
      );

      expect(result.current.getFilteredOptions('status')).toBeUndefined();
    });

    it('isReady is false without metadata', () => {
      const { result } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: {} })
      );

      expect(result.current.isReady).toBe(false);
    });
  });

  describe('with metadata but no dynamic logic', () => {
    beforeEach(() => {
      mockUseMetadata.mockReturnValue({
        metadata: {
          entityDefs: {
            Account: {
              fields: {
                name: { type: 'varchar' },
                status: { type: 'enum', options: ['Active', 'Inactive'] },
              },
            },
          },
          clientDefs: {
            Account: {}, // No dynamicLogic property
          },
          scopes: {},
        },
        isLoading: false,
        error: null,
        getEntityDef: vi.fn(),
        getFieldDef: vi.fn(),
        getLinkDef: vi.fn(),
        getScopeDef: vi.fn(),
        isEntityEnabled: vi.fn(),
        getEntityList: vi.fn(),
      });
    });

    it('isReady is true with metadata', () => {
      const { result } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: {} })
      );

      expect(result.current.isReady).toBe(true);
    });

    it('returns default states without dynamic logic defined', () => {
      const { result } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: {} })
      );

      expect(result.current.isFieldVisible('name')).toBe(true);
      expect(result.current.isFieldRequired('name')).toBe(false);
    });
  });

  describe('with dynamic logic', () => {
    beforeEach(() => {
      mockUseMetadata.mockReturnValue({
        metadata: {
          entityDefs: {
            Account: {
              fields: {
                name: { type: 'varchar' },
                type: { type: 'enum', options: ['Customer', 'Partner', 'Vendor'] },
                industry: { type: 'enum', options: ['Tech', 'Finance', 'Healthcare'] },
                partnerLevel: { type: 'enum' },
              },
            },
          },
          clientDefs: {
            Account: {
              dynamicLogic: {
                fields: {
                  partnerLevel: {
                    visible: {
                      type: 'and',
                      value: [
                        {
                          type: 'equals',
                          attribute: 'type',
                          value: 'Partner',
                        },
                      ],
                    },
                    required: {
                      type: 'and',
                      value: [
                        {
                          type: 'equals',
                          attribute: 'type',
                          value: 'Partner',
                        },
                      ],
                    },
                  },
                  industry: {
                    readOnly: {
                      type: 'and',
                      value: [
                        {
                          type: 'isNotEmpty',
                          attribute: 'type',
                        },
                      ],
                    },
                  },
                },
                panels: {
                  partnerDetails: {
                    visible: {
                      type: 'and',
                      value: [
                        {
                          type: 'equals',
                          attribute: 'type',
                          value: 'Partner',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          scopes: {},
        },
        isLoading: false,
        error: null,
        getEntityDef: vi.fn(),
        getFieldDef: vi.fn(),
        getLinkDef: vi.fn(),
        getScopeDef: vi.fn(),
        isEntityEnabled: vi.fn(),
        getEntityList: vi.fn(),
      });
    });

    it('evaluates field visibility based on conditions', () => {
      // When type is not Partner, partnerLevel should not be visible
      const { result: result1 } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: { type: 'Customer' } })
      );
      expect(result1.current.isFieldVisible('partnerLevel')).toBe(false);

      // When type is Partner, partnerLevel should be visible
      const { result: result2 } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: { type: 'Partner' } })
      );
      expect(result2.current.isFieldVisible('partnerLevel')).toBe(true);
    });

    it('evaluates field required based on conditions', () => {
      const { result: result1 } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: { type: 'Customer' } })
      );
      expect(result1.current.isFieldRequired('partnerLevel')).toBe(false);

      const { result: result2 } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: { type: 'Partner' } })
      );
      expect(result2.current.isFieldRequired('partnerLevel')).toBe(true);
    });

    it('evaluates field readOnly based on conditions', () => {
      const { result: result1 } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: { type: '' } })
      );
      expect(result1.current.isFieldReadOnly('industry')).toBe(false);

      const { result: result2 } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: { type: 'Customer' } })
      );
      expect(result2.current.isFieldReadOnly('industry')).toBe(true);
    });

    it('evaluates panel visibility based on conditions', () => {
      const { result: result1 } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: { type: 'Customer' } })
      );
      expect(result1.current.getPanelState('partnerDetails').visible).toBe(false);

      const { result: result2 } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: { type: 'Partner' } })
      );
      expect(result2.current.getPanelState('partnerDetails').visible).toBe(true);
    });

    it('returns fieldStates object', () => {
      const { result } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: { type: 'Partner' } })
      );

      expect(result.current.fieldStates).toHaveProperty('partnerLevel');
      expect(result.current.fieldStates.partnerLevel.visible).toBe(true);
    });

    it('returns panelStates object', () => {
      const { result } = renderHook(() =>
        useDynamicLogic({ entityType: 'Account', data: { type: 'Partner' } })
      );

      expect(result.current.panelStates).toHaveProperty('partnerDetails');
      expect(result.current.panelStates.partnerDetails.visible).toBe(true);
    });
  });
});

describe('useFieldDynamicLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('without metadata', () => {
    beforeEach(() => {
      mockUseMetadata.mockReturnValue({
        metadata: null,
        isLoading: false,
        error: null,
        getEntityDef: vi.fn(),
        getFieldDef: vi.fn(),
        getLinkDef: vi.fn(),
        getScopeDef: vi.fn(),
        isEntityEnabled: vi.fn(),
        getEntityList: vi.fn(),
      });
    });

    it('returns default field state', () => {
      const { result } = renderHook(() =>
        useFieldDynamicLogic('Account', 'name', {})
      );

      expect(result.current.visible).toBe(true);
      expect(result.current.required).toBe(false);
      expect(result.current.readOnly).toBe(false);
    });
  });

  describe('with dynamic logic', () => {
    beforeEach(() => {
      mockUseMetadata.mockReturnValue({
        metadata: {
          entityDefs: {
            Account: {
              fields: {
                type: { type: 'enum' },
                partnerLevel: { type: 'enum', options: ['Gold', 'Silver', 'Bronze'] },
              },
            },
          },
          clientDefs: {
            Account: {
              dynamicLogic: {
                fields: {
                  partnerLevel: {
                    visible: {
                      type: 'and',
                      value: [
                        {
                          type: 'equals',
                          attribute: 'type',
                          value: 'Partner',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          scopes: {},
        },
        isLoading: false,
        error: null,
        getEntityDef: vi.fn(),
        getFieldDef: vi.fn(),
        getLinkDef: vi.fn(),
        getScopeDef: vi.fn(),
        isEntityEnabled: vi.fn(),
        getEntityList: vi.fn(),
      });
    });

    it('evaluates field visibility', () => {
      const { result: result1 } = renderHook(() =>
        useFieldDynamicLogic('Account', 'partnerLevel', { type: 'Customer' })
      );
      expect(result1.current.visible).toBe(false);

      const { result: result2 } = renderHook(() =>
        useFieldDynamicLogic('Account', 'partnerLevel', { type: 'Partner' })
      );
      expect(result2.current.visible).toBe(true);
    });

    it('returns default for fields without dynamic logic', () => {
      const { result } = renderHook(() =>
        useFieldDynamicLogic('Account', 'type', { type: 'Customer' })
      );

      expect(result.current.visible).toBe(true);
      expect(result.current.required).toBe(false);
    });
  });
});
