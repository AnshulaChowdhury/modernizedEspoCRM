import { describe, it, expect } from 'vitest';
import {
  generateFieldSchema,
  generateEntitySchema,
  validateEntityData,
  type FieldValidationDef,
} from './schemaGenerator';

describe('generateFieldSchema', () => {
  describe('varchar type', () => {
    it('validates required string', () => {
      const schema = generateFieldSchema('name', { type: 'varchar', required: true });
      expect(schema.safeParse('John').success).toBe(true);
      expect(schema.safeParse('').success).toBe(false);
    });

    it('validates optional string', () => {
      const schema = generateFieldSchema('name', { type: 'varchar' });
      expect(schema.safeParse('John').success).toBe(true);
      expect(schema.safeParse('').success).toBe(true);
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    it('enforces maxLength', () => {
      const schema = generateFieldSchema('name', { type: 'varchar', maxLength: 5 });
      expect(schema.safeParse('John').success).toBe(true);
      expect(schema.safeParse('Jonathan').success).toBe(false);
    });

    it('enforces minLength', () => {
      const schema = generateFieldSchema('name', { type: 'varchar', minLength: 3 });
      expect(schema.safeParse('John').success).toBe(true);
      expect(schema.safeParse('Jo').success).toBe(false);
    });

    it('validates with pattern', () => {
      const schema = generateFieldSchema('code', {
        type: 'varchar',
        pattern: '^[A-Z]{3}$',
      });
      expect(schema.safeParse('ABC').success).toBe(true);
      expect(schema.safeParse('abc').success).toBe(false);
      expect(schema.safeParse('ABCD').success).toBe(false);
    });
  });

  describe('email type', () => {
    it('validates email format', () => {
      const schema = generateFieldSchema('emailAddress', { type: 'email', required: true });
      expect(schema.safeParse('test@example.com').success).toBe(true);
      expect(schema.safeParse('invalid-email').success).toBe(false);
    });

    it('allows empty for optional', () => {
      const schema = generateFieldSchema('emailAddress', { type: 'email' });
      expect(schema.safeParse('').success).toBe(true);
      expect(schema.safeParse(undefined).success).toBe(true);
    });
  });

  describe('int type', () => {
    it('validates integer', () => {
      const schema = generateFieldSchema('age', { type: 'int', required: true });
      expect(schema.safeParse(25).success).toBe(true);
      expect(schema.safeParse(25.5).success).toBe(false);
    });

    it('enforces min/max', () => {
      const schema = generateFieldSchema('age', { type: 'int', min: 0, max: 120 });
      expect(schema.safeParse(25).success).toBe(true);
      expect(schema.safeParse(-1).success).toBe(false);
      expect(schema.safeParse(150).success).toBe(false);
    });

    it('allows null for optional', () => {
      const schema = generateFieldSchema('count', { type: 'int' });
      expect(schema.safeParse(null).success).toBe(true);
      expect(schema.safeParse(undefined).success).toBe(true);
    });
  });

  describe('float type', () => {
    it('validates decimal numbers', () => {
      const schema = generateFieldSchema('price', { type: 'float', required: true });
      expect(schema.safeParse(99.99).success).toBe(true);
      expect(schema.safeParse(100).success).toBe(true);
    });

    it('enforces min/max', () => {
      const schema = generateFieldSchema('probability', { type: 'float', min: 0, max: 100 });
      expect(schema.safeParse(50.5).success).toBe(true);
      expect(schema.safeParse(-10).success).toBe(false);
      expect(schema.safeParse(110).success).toBe(false);
    });
  });

  describe('bool type', () => {
    it('validates boolean', () => {
      const schema = generateFieldSchema('isActive', { type: 'bool' });
      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse(false).success).toBe(true);
    });

    it('defaults to false', () => {
      const schema = generateFieldSchema('isActive', { type: 'bool' });
      const result = schema.parse(undefined);
      expect(result).toBe(false);
    });
  });

  describe('enum type', () => {
    const options = ['New', 'In Progress', 'Completed'];

    it('validates against options', () => {
      const schema = generateFieldSchema('status', { type: 'enum', options, required: true });
      expect(schema.safeParse('New').success).toBe(true);
      expect(schema.safeParse('Invalid').success).toBe(false);
    });

    it('allows empty for optional', () => {
      const schema = generateFieldSchema('status', { type: 'enum', options });
      expect(schema.safeParse('').success).toBe(true);
    });
  });

  describe('multiEnum type', () => {
    const options = ['Option1', 'Option2', 'Option3'];

    it('validates array of options', () => {
      const schema = generateFieldSchema('tags', { type: 'multiEnum', options });
      expect(schema.safeParse(['Option1', 'Option2']).success).toBe(true);
      expect(schema.safeParse(['Invalid']).success).toBe(false);
    });

    it('requires at least one when required', () => {
      const schema = generateFieldSchema('tags', { type: 'multiEnum', options, required: true });
      expect(schema.safeParse(['Option1']).success).toBe(true);
      expect(schema.safeParse([]).success).toBe(false);
    });
  });

  describe('date type', () => {
    it('validates date format YYYY-MM-DD', () => {
      const schema = generateFieldSchema('closeDate', { type: 'date', required: true });
      expect(schema.safeParse('2024-12-31').success).toBe(true);
      expect(schema.safeParse('12/31/2024').success).toBe(false);
      expect(schema.safeParse('invalid').success).toBe(false);
    });

    it('allows empty for optional', () => {
      const schema = generateFieldSchema('closeDate', { type: 'date' });
      expect(schema.safeParse('').success).toBe(true);
    });
  });

  describe('datetime type', () => {
    it('validates datetime format', () => {
      const schema = generateFieldSchema('startDateTime', { type: 'datetime', required: true });
      expect(schema.safeParse('2024-12-31 10:30').success).toBe(true);
      expect(schema.safeParse('2024-12-31T10:30:00').success).toBe(true);
      expect(schema.safeParse('invalid').success).toBe(false);
    });
  });

  describe('link type', () => {
    it('validates string ID', () => {
      const schema = generateFieldSchema('accountId', { type: 'link', required: true });
      expect(schema.safeParse('acc-001').success).toBe(true);
      expect(schema.safeParse('').success).toBe(false);
    });

    it('validates object with id', () => {
      const schema = generateFieldSchema('account', { type: 'link', required: true });
      expect(schema.safeParse({ id: 'acc-001', name: 'Acme' }).success).toBe(true);
      expect(schema.safeParse({ id: '', name: 'Acme' }).success).toBe(false);
    });

    it('allows null for optional', () => {
      const schema = generateFieldSchema('account', { type: 'link' });
      expect(schema.safeParse(null).success).toBe(true);
    });
  });

  describe('linkMultiple type', () => {
    it('validates array of links', () => {
      const schema = generateFieldSchema('contacts', { type: 'linkMultiple' });
      expect(schema.safeParse(['con-001', 'con-002']).success).toBe(true);
      expect(schema.safeParse([{ id: 'con-001', name: 'John' }]).success).toBe(true);
    });

    it('requires at least one when required', () => {
      const schema = generateFieldSchema('contacts', { type: 'linkMultiple', required: true });
      expect(schema.safeParse(['con-001']).success).toBe(true);
      expect(schema.safeParse([]).success).toBe(false);
    });
  });

  describe('url type', () => {
    it('validates URL format', () => {
      const schema = generateFieldSchema('website', { type: 'url', required: true });
      expect(schema.safeParse('https://example.com').success).toBe(true);
      expect(schema.safeParse('example.com').success).toBe(true);
      expect(schema.safeParse('not a url').success).toBe(false);
    });

    it('allows empty for optional', () => {
      const schema = generateFieldSchema('website', { type: 'url' });
      expect(schema.safeParse('').success).toBe(true);
    });
  });

  describe('colorpicker type', () => {
    it('validates hex color format', () => {
      const schema = generateFieldSchema('color', { type: 'colorpicker', required: true });
      expect(schema.safeParse('#FF0000').success).toBe(true);
      expect(schema.safeParse('#F00').success).toBe(true);
      expect(schema.safeParse('red').success).toBe(false);
      expect(schema.safeParse('#GGGGGG').success).toBe(false);
    });
  });
});

describe('generateEntitySchema', () => {
  const fieldDefs: Record<string, FieldValidationDef> = {
    name: { type: 'varchar', required: true, maxLength: 150 },
    website: { type: 'url' },
    type: { type: 'enum', options: ['Customer', 'Partner'] },
    employeeCount: { type: 'int', min: 0 },
    isActive: { type: 'bool', default: true },
    calculatedField: { type: 'varchar', readOnly: true },
  };

  it('generates schema for all fields', () => {
    const schema = generateEntitySchema(fieldDefs);
    const keys = Object.keys(schema.shape);

    expect(keys).toContain('name');
    expect(keys).toContain('website');
    expect(keys).toContain('type');
    expect(keys).not.toContain('calculatedField'); // readOnly
  });

  it('excludes specified fields', () => {
    const schema = generateEntitySchema(fieldDefs, {
      excludeFields: ['website', 'type'],
    });
    const keys = Object.keys(schema.shape);

    expect(keys).toContain('name');
    expect(keys).not.toContain('website');
    expect(keys).not.toContain('type');
  });

  it('includes only specified fields', () => {
    const schema = generateEntitySchema(fieldDefs, {
      includeFields: ['name', 'website'],
    });
    const keys = Object.keys(schema.shape);

    expect(keys).toContain('name');
    expect(keys).toContain('website');
    expect(keys).not.toContain('type');
    expect(keys).not.toContain('employeeCount');
  });

  it('can include readOnly fields when skipReadOnly is false', () => {
    const schema = generateEntitySchema(fieldDefs, { skipReadOnly: false });
    const keys = Object.keys(schema.shape);

    expect(keys).toContain('calculatedField');
  });
});

describe('validateEntityData', () => {
  const fieldDefs: Record<string, FieldValidationDef> = {
    name: { type: 'varchar', required: true, maxLength: 150 },
    website: { type: 'url' },
    type: { type: 'enum', options: ['Customer', 'Partner', 'Reseller'] },
    employeeCount: { type: 'int', min: 0 },
  };

  it('returns success for valid data', () => {
    const result = validateEntityData(fieldDefs, {
      name: 'Acme Corp',
      website: 'https://acme.com',
      type: 'Customer',
      employeeCount: 100,
    });

    expect(result.success).toBe(true);
  });

  it('returns errors for invalid data', () => {
    const result = validateEntityData(fieldDefs, {
      name: '', // Required
      website: 'not-a-url',
      type: 'InvalidType',
      employeeCount: -5, // Min 0
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveProperty('name');
      expect(result.errors).toHaveProperty('website');
      expect(result.errors).toHaveProperty('type');
      expect(result.errors).toHaveProperty('employeeCount');
    }
  });

  it('validates partial data for optional fields', () => {
    const result = validateEntityData(fieldDefs, {
      name: 'Acme Corp',
      // website, type, employeeCount are optional
    });

    expect(result.success).toBe(true);
  });

  it('provides meaningful error messages', () => {
    const result = validateEntityData(fieldDefs, {
      name: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toContain('Name');
      expect(result.errors.name).toContain('required');
    }
  });
});
