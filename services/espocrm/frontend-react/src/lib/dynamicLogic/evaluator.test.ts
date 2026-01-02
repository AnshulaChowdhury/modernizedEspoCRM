/**
 * Dynamic Logic Evaluator Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  evaluateConditionGroup,
  evaluateFieldDynamicLogic,
  evaluateEntityDynamicLogic,
} from './evaluator';
import type { ConditionGroup, DynamicLogicDef, EntityDynamicLogic } from './types';

describe('evaluateConditionGroup', () => {
  describe('equals condition', () => {
    it('should return true when values are equal', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'equals', attribute: 'status', value: 'active' }],
      };
      const data = { status: 'active' };
      expect(evaluateConditionGroup(group, data)).toBe(true);
    });

    it('should return false when values are not equal', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'equals', attribute: 'status', value: 'active' }],
      };
      const data = { status: 'inactive' };
      expect(evaluateConditionGroup(group, data)).toBe(false);
    });
  });

  describe('notEquals condition', () => {
    it('should return true when values are not equal', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'notEquals', attribute: 'status', value: 'active' }],
      };
      const data = { status: 'inactive' };
      expect(evaluateConditionGroup(group, data)).toBe(true);
    });

    it('should return false when values are equal', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'notEquals', attribute: 'status', value: 'active' }],
      };
      const data = { status: 'active' };
      expect(evaluateConditionGroup(group, data)).toBe(false);
    });
  });

  describe('isEmpty condition', () => {
    it('should return true for null', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isEmpty', attribute: 'name' }],
      };
      expect(evaluateConditionGroup(group, { name: null })).toBe(true);
    });

    it('should return true for undefined', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isEmpty', attribute: 'name' }],
      };
      expect(evaluateConditionGroup(group, {})).toBe(true);
    });

    it('should return true for empty string', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isEmpty', attribute: 'name' }],
      };
      expect(evaluateConditionGroup(group, { name: '' })).toBe(true);
    });

    it('should return true for empty array', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isEmpty', attribute: 'tags' }],
      };
      expect(evaluateConditionGroup(group, { tags: [] })).toBe(true);
    });

    it('should return true for empty object', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isEmpty', attribute: 'data' }],
      };
      expect(evaluateConditionGroup(group, { data: {} })).toBe(true);
    });

    it('should return false for non-empty value', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isEmpty', attribute: 'name' }],
      };
      expect(evaluateConditionGroup(group, { name: 'John' })).toBe(false);
    });
  });

  describe('isNotEmpty condition', () => {
    it('should return true for non-empty value', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isNotEmpty', attribute: 'name' }],
      };
      expect(evaluateConditionGroup(group, { name: 'John' })).toBe(true);
    });

    it('should return false for empty value', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isNotEmpty', attribute: 'name' }],
      };
      expect(evaluateConditionGroup(group, { name: '' })).toBe(false);
    });
  });

  describe('isTrue/isFalse conditions', () => {
    it('should return true for isTrue when value is true', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isTrue', attribute: 'active' }],
      };
      expect(evaluateConditionGroup(group, { active: true })).toBe(true);
    });

    it('should return false for isTrue when value is false', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isTrue', attribute: 'active' }],
      };
      expect(evaluateConditionGroup(group, { active: false })).toBe(false);
    });

    it('should return true for isFalse when value is false', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isFalse', attribute: 'active' }],
      };
      expect(evaluateConditionGroup(group, { active: false })).toBe(true);
    });
  });

  describe('numeric comparison conditions', () => {
    it('should handle greaterThan', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'greaterThan', attribute: 'amount', value: 100 }],
      };
      expect(evaluateConditionGroup(group, { amount: 150 })).toBe(true);
      expect(evaluateConditionGroup(group, { amount: 50 })).toBe(false);
      expect(evaluateConditionGroup(group, { amount: 100 })).toBe(false);
    });

    it('should handle lessThan', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'lessThan', attribute: 'amount', value: 100 }],
      };
      expect(evaluateConditionGroup(group, { amount: 50 })).toBe(true);
      expect(evaluateConditionGroup(group, { amount: 150 })).toBe(false);
    });

    it('should handle greaterThanOrEquals', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'greaterThanOrEquals', attribute: 'amount', value: 100 }],
      };
      expect(evaluateConditionGroup(group, { amount: 100 })).toBe(true);
      expect(evaluateConditionGroup(group, { amount: 150 })).toBe(true);
      expect(evaluateConditionGroup(group, { amount: 50 })).toBe(false);
    });

    it('should handle lessThanOrEquals', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'lessThanOrEquals', attribute: 'amount', value: 100 }],
      };
      expect(evaluateConditionGroup(group, { amount: 100 })).toBe(true);
      expect(evaluateConditionGroup(group, { amount: 50 })).toBe(true);
      expect(evaluateConditionGroup(group, { amount: 150 })).toBe(false);
    });

    it('should return false for non-numeric values', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'greaterThan', attribute: 'amount', value: 100 }],
      };
      expect(evaluateConditionGroup(group, { amount: 'abc' })).toBe(false);
    });
  });

  describe('string conditions', () => {
    it('should handle contains for strings', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'contains', attribute: 'name', value: 'john' }],
      };
      expect(evaluateConditionGroup(group, { name: 'John Doe' })).toBe(true);
      expect(evaluateConditionGroup(group, { name: 'Jane Doe' })).toBe(false);
    });

    it('should handle contains for arrays', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'contains', attribute: 'tags', value: 'important' }],
      };
      expect(evaluateConditionGroup(group, { tags: ['urgent', 'important'] })).toBe(true);
      expect(evaluateConditionGroup(group, { tags: ['urgent', 'low'] })).toBe(false);
    });

    it('should handle notContains', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'notContains', attribute: 'name', value: 'test' }],
      };
      expect(evaluateConditionGroup(group, { name: 'John Doe' })).toBe(true);
      expect(evaluateConditionGroup(group, { name: 'Test User' })).toBe(false);
    });

    it('should handle startsWith', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'startsWith', attribute: 'name', value: 'john' }],
      };
      expect(evaluateConditionGroup(group, { name: 'John Doe' })).toBe(true);
      expect(evaluateConditionGroup(group, { name: 'Jane Doe' })).toBe(false);
    });

    it('should handle endsWith', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'endsWith', attribute: 'email', value: '@test.com' }],
      };
      expect(evaluateConditionGroup(group, { email: 'user@test.com' })).toBe(true);
      expect(evaluateConditionGroup(group, { email: 'user@other.com' })).toBe(false);
    });
  });

  describe('in/notIn conditions', () => {
    it('should handle in condition', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'in', attribute: 'status', value: ['active', 'pending'] }],
      };
      expect(evaluateConditionGroup(group, { status: 'active' })).toBe(true);
      expect(evaluateConditionGroup(group, { status: 'inactive' })).toBe(false);
    });

    it('should handle notIn condition', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'notIn', attribute: 'status', value: ['deleted', 'archived'] }],
      };
      expect(evaluateConditionGroup(group, { status: 'active' })).toBe(true);
      expect(evaluateConditionGroup(group, { status: 'deleted' })).toBe(false);
    });
  });

  describe('date conditions', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle isToday', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isToday', attribute: 'date' }],
      };
      // Use Date object to avoid timezone issues
      const today = new Date('2024-06-15T12:00:00Z');
      const yesterday = new Date('2024-06-14T12:00:00Z');
      expect(evaluateConditionGroup(group, { date: today })).toBe(true);
      expect(evaluateConditionGroup(group, { date: yesterday })).toBe(false);
    });

    it('should handle inFuture', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'inFuture', attribute: 'date' }],
      };
      expect(evaluateConditionGroup(group, { date: '2024-07-01' })).toBe(true);
      expect(evaluateConditionGroup(group, { date: '2024-01-01' })).toBe(false);
    });

    it('should handle inPast', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'inPast', attribute: 'date' }],
      };
      expect(evaluateConditionGroup(group, { date: '2024-01-01' })).toBe(true);
      expect(evaluateConditionGroup(group, { date: '2024-07-01' })).toBe(false);
    });

    it('should return false for invalid dates', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isToday', attribute: 'date' }],
      };
      expect(evaluateConditionGroup(group, { date: 'invalid' })).toBe(false);
      expect(evaluateConditionGroup(group, { date: null })).toBe(false);
    });
  });

  describe('nested attributes', () => {
    it('should handle dot notation for nested values', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'equals', attribute: 'user.role', value: 'admin' }],
      };
      const data = { user: { role: 'admin' } };
      expect(evaluateConditionGroup(group, data)).toBe(true);
    });

    it('should return undefined for missing nested paths', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'isEmpty', attribute: 'user.name' }],
      };
      expect(evaluateConditionGroup(group, {})).toBe(true);
    });
  });

  describe('logical operators', () => {
    it('should handle AND operator', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [
          { type: 'equals', attribute: 'status', value: 'active' },
          { type: 'equals', attribute: 'type', value: 'premium' },
        ],
      };
      expect(evaluateConditionGroup(group, { status: 'active', type: 'premium' })).toBe(true);
      expect(evaluateConditionGroup(group, { status: 'active', type: 'basic' })).toBe(false);
      expect(evaluateConditionGroup(group, { status: 'inactive', type: 'premium' })).toBe(false);
    });

    it('should handle OR operator', () => {
      const group: ConditionGroup = {
        type: 'or',
        value: [
          { type: 'equals', attribute: 'status', value: 'active' },
          { type: 'equals', attribute: 'status', value: 'pending' },
        ],
      };
      expect(evaluateConditionGroup(group, { status: 'active' })).toBe(true);
      expect(evaluateConditionGroup(group, { status: 'pending' })).toBe(true);
      expect(evaluateConditionGroup(group, { status: 'inactive' })).toBe(false);
    });

    it('should handle NOT operator', () => {
      const group: ConditionGroup = {
        type: 'not',
        value: [{ type: 'equals', attribute: 'status', value: 'deleted' }],
      };
      expect(evaluateConditionGroup(group, { status: 'active' })).toBe(true);
      expect(evaluateConditionGroup(group, { status: 'deleted' })).toBe(false);
    });

    it('should handle nested condition groups', () => {
      const group: ConditionGroup = {
        type: 'and',
        value: [
          { type: 'equals', attribute: 'type', value: 'user' },
          {
            type: 'or',
            value: [
              { type: 'equals', attribute: 'role', value: 'admin' },
              { type: 'equals', attribute: 'role', value: 'manager' },
            ],
          },
        ],
      };
      expect(evaluateConditionGroup(group, { type: 'user', role: 'admin' })).toBe(true);
      expect(evaluateConditionGroup(group, { type: 'user', role: 'manager' })).toBe(true);
      expect(evaluateConditionGroup(group, { type: 'user', role: 'guest' })).toBe(false);
      expect(evaluateConditionGroup(group, { type: 'bot', role: 'admin' })).toBe(false);
    });

    it('should handle empty NOT condition', () => {
      const group: ConditionGroup = {
        type: 'not',
        value: [],
      };
      expect(evaluateConditionGroup(group, {})).toBe(true);
    });
  });

  describe('unknown condition types', () => {
    it('should return false and warn for unknown condition type', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const group: ConditionGroup = {
        type: 'and',
        value: [{ type: 'unknownType' as never, attribute: 'test', value: 'test' }],
      };
      expect(evaluateConditionGroup(group, {})).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should warn for unknown logical operator', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const group: ConditionGroup = {
        type: 'xor' as never,
        value: [],
      };
      expect(evaluateConditionGroup(group, {})).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});

describe('evaluateFieldDynamicLogic', () => {
  it('should return default state when no logic provided', () => {
    const result = evaluateFieldDynamicLogic(undefined, {});
    expect(result).toEqual({
      visible: true,
      required: false,
      readOnly: false,
      invalid: false,
      filteredOptions: undefined,
    });
  });

  it('should evaluate visibility', () => {
    const logic: DynamicLogicDef = {
      visible: {
        type: 'and',
        value: [{ type: 'equals', attribute: 'type', value: 'premium' }],
      },
    };
    expect(evaluateFieldDynamicLogic(logic, { type: 'premium' }).visible).toBe(true);
    expect(evaluateFieldDynamicLogic(logic, { type: 'basic' }).visible).toBe(false);
  });

  it('should evaluate required', () => {
    const logic: DynamicLogicDef = {
      required: {
        type: 'and',
        value: [{ type: 'equals', attribute: 'type', value: 'business' }],
      },
    };
    expect(evaluateFieldDynamicLogic(logic, { type: 'business' }).required).toBe(true);
    expect(evaluateFieldDynamicLogic(logic, { type: 'personal' }).required).toBe(false);
  });

  it('should not evaluate required when not visible', () => {
    const logic: DynamicLogicDef = {
      visible: {
        type: 'and',
        value: [{ type: 'equals', attribute: 'show', value: true }],
      },
      required: {
        type: 'and',
        value: [{ type: 'isTrue', attribute: 'alwaysTrue' }],
      },
    };
    const result = evaluateFieldDynamicLogic(logic, { show: false, alwaysTrue: true });
    expect(result.visible).toBe(false);
    expect(result.required).toBe(false); // Required not evaluated when not visible
  });

  it('should evaluate readOnly', () => {
    const logic: DynamicLogicDef = {
      readOnly: {
        type: 'and',
        value: [{ type: 'equals', attribute: 'status', value: 'locked' }],
      },
    };
    expect(evaluateFieldDynamicLogic(logic, { status: 'locked' }).readOnly).toBe(true);
    expect(evaluateFieldDynamicLogic(logic, { status: 'open' }).readOnly).toBe(false);
  });

  it('should evaluate invalid', () => {
    const logic: DynamicLogicDef = {
      invalid: {
        type: 'and',
        value: [
          { type: 'greaterThan', attribute: 'startDate', value: 0 },
          { type: 'lessThan', attribute: 'endDate', value: 0 },
        ],
      },
    };
    // This would be invalid if startDate > 0 and endDate < 0 (impossible in real use)
    const result = evaluateFieldDynamicLogic(logic, { startDate: 10, endDate: -5 });
    expect(result.invalid).toBe(true);
  });

  it('should filter options', () => {
    const logic: DynamicLogicDef = {
      options: {
        premium: {
          type: 'and',
          value: [{ type: 'equals', attribute: 'tier', value: 'gold' }],
        },
        basic: {
          type: 'and',
          value: [{ type: 'isTrue', attribute: 'alwaysShow' }],
        },
      },
    };
    const allOptions = ['premium', 'basic', 'free'];

    const goldTier = evaluateFieldDynamicLogic(logic, { tier: 'gold', alwaysShow: true }, allOptions);
    expect(goldTier.filteredOptions).toEqual(['premium', 'basic', 'free']);

    const silverTier = evaluateFieldDynamicLogic(logic, { tier: 'silver', alwaysShow: false }, allOptions);
    expect(silverTier.filteredOptions).toEqual(['free']); // Only 'free' has no condition
  });
});

describe('evaluateEntityDynamicLogic', () => {
  it('should return empty state when no logic provided', () => {
    const result = evaluateEntityDynamicLogic(undefined, {});
    expect(result).toEqual({ fields: {}, panels: {} });
  });

  it('should evaluate multiple field logic', () => {
    const logic: EntityDynamicLogic = {
      fields: {
        premiumField: {
          visible: {
            type: 'and',
            value: [{ type: 'equals', attribute: 'tier', value: 'premium' }],
          },
        },
        basicField: {
          visible: {
            type: 'and',
            value: [{ type: 'isNotEmpty', attribute: 'name' }],
          },
        },
      },
    };

    const result = evaluateEntityDynamicLogic(logic, { tier: 'premium', name: 'Test' });
    expect(result.fields.premiumField?.visible).toBe(true);
    expect(result.fields.basicField?.visible).toBe(true);

    const result2 = evaluateEntityDynamicLogic(logic, { tier: 'basic', name: '' });
    expect(result2.fields.premiumField?.visible).toBe(false);
    expect(result2.fields.basicField?.visible).toBe(false);
  });

  it('should evaluate panel visibility', () => {
    const logic: EntityDynamicLogic = {
      panels: {
        advancedPanel: {
          visible: {
            type: 'and',
            value: [{ type: 'equals', attribute: 'showAdvanced', value: true }],
          },
        },
      },
    };

    const result = evaluateEntityDynamicLogic(logic, { showAdvanced: true });
    expect(result.panels.advancedPanel?.visible).toBe(true);

    const result2 = evaluateEntityDynamicLogic(logic, { showAdvanced: false });
    expect(result2.panels.advancedPanel?.visible).toBe(false);
  });

  it('should pass field options for filtering', () => {
    const logic: EntityDynamicLogic = {
      fields: {
        status: {
          options: {
            archived: {
              type: 'and',
              value: [{ type: 'isTrue', attribute: 'canArchive' }],
            },
          },
        },
      },
    };

    const fieldOptions = {
      status: ['active', 'pending', 'archived'],
    };

    const result = evaluateEntityDynamicLogic(logic, { canArchive: true }, fieldOptions);
    expect(result.fields.status?.filteredOptions).toEqual(['active', 'pending', 'archived']);

    const result2 = evaluateEntityDynamicLogic(logic, { canArchive: false }, fieldOptions);
    expect(result2.fields.status?.filteredOptions).toEqual(['active', 'pending']);
  });
});
