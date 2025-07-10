import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { getDefaults, getDefaultsPartial } from './defaultHelpers';

describe('getDefaults', () => {
  it('should extract defaults from simple schema', () => {
    const SimpleSchema = z.object({
      name: z.string().default('John'),
      age: z.number().default(25),
      active: z.boolean().default(true),
    });

    const defaults = getDefaults(SimpleSchema);

    expect(defaults).toEqual({
      name: 'John',
      age: 25,
      active: true,
    });
  });

  it('should handle nested object schemas with defaults', () => {
    const NestedSchema = z.object({
      user: z
        .object({
          name: z.string().default('Default User'),
          preferences: z
            .object({
              theme: z.string().default('light'),
              notifications: z.boolean().default(true),
            })
            .default({
              theme: 'light',
              notifications: true,
            }),
        })
        .default({
          name: 'Default User',
          preferences: {
            theme: 'light',
            notifications: true,
          },
        }),
      settings: z
        .object({
          autoSave: z.boolean().default(false),
        })
        .default({
          autoSave: false,
        }),
    });

    const defaults = getDefaults(NestedSchema);

    expect(defaults).toEqual({
      user: {
        name: 'Default User',
        preferences: {
          theme: 'light',
          notifications: true,
        },
      },
      settings: {
        autoSave: false,
      },
    });
  });

  it('should handle array defaults', () => {
    const ArraySchema = z.object({
      tags: z.array(z.string()).default([]),
      numbers: z.array(z.number()).default([1, 2, 3]),
      items: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().default('Item'),
          })
        )
        .default([]),
    });

    const defaults = getDefaults(ArraySchema);

    expect(defaults).toEqual({
      tags: [],
      numbers: [1, 2, 3],
      items: [],
    });
  });

  it('should handle optional fields without defaults', () => {
    const OptionalSchema = z.object({
      required: z.string().default('required'),
      optional: z.string().optional(),
      optionalWithDefault: z.string().optional().default('optional default'),
    });

    const defaults = getDefaults(OptionalSchema);

    expect(defaults).toEqual({
      required: 'required',
      optionalWithDefault: 'optional default',
    });

    // Optional fields without defaults should not be present
    expect('optional' in defaults).toBe(false);
  });

  it('should handle enum defaults', () => {
    const EnumSchema = z.object({
      status: z.enum(['pending', 'completed', 'failed']).default('pending'),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
    });

    const defaults = getDefaults(EnumSchema);

    expect(defaults).toEqual({
      status: 'pending',
      priority: 'medium',
    });
  });

  it('should handle union schemas with defaults', () => {
    const UnionSchema = z.object({
      value: z.union([z.string(), z.number()]).default('default string'),
      nullableUnion: z.union([z.string(), z.null()]).default(null),
    });

    const defaults = getDefaults(UnionSchema);

    expect(defaults).toEqual({
      value: 'default string',
      nullableUnion: null,
    });
  });

  it('should handle record schemas with defaults', () => {
    const RecordSchema = z.object({
      metadata: z.record(z.string(), z.string()).default({}),
      settings: z.record(z.string(), z.boolean()).default({ enabled: true }),
    });

    const defaults = getDefaults(RecordSchema);

    expect(defaults).toEqual({
      metadata: {},
      settings: { enabled: true },
    });
  });

  it('should handle complex nested schema with multiple default levels', () => {
    const ComplexSchema = z.object({
      config: z
        .object({
          display: z
            .object({
              theme: z.string().default('dark'),
              fontSize: z.number().default(14),
            })
            .default({
              theme: 'dark',
              fontSize: 14,
            }),
          features: z
            .object({
              notifications: z.boolean().default(true),
              autoSave: z.boolean().default(false),
              advanced: z
                .object({
                  debugMode: z.boolean().default(false),
                  logging: z.array(z.string()).default(['error', 'warn']),
                })
                .default({
                  debugMode: false,
                  logging: ['error', 'warn'],
                }),
            })
            .default({
              notifications: true,
              autoSave: false,
              advanced: {
                debugMode: false,
                logging: ['error', 'warn'],
              },
            }),
        })
        .default({
          display: {
            theme: 'dark',
            fontSize: 14,
          },
          features: {
            notifications: true,
            autoSave: false,
            advanced: {
              debugMode: false,
              logging: ['error', 'warn'],
            },
          },
        }),
    });

    const defaults = getDefaults(ComplexSchema);

    expect(defaults).toEqual({
      config: {
        display: {
          theme: 'dark',
          fontSize: 14,
        },
        features: {
          notifications: true,
          autoSave: false,
          advanced: {
            debugMode: false,
            logging: ['error', 'warn'],
          },
        },
      },
    });
  });

  it('should validate the returned defaults against the original schema when possible', () => {
    const ValidatableSchema = z.object({
      name: z.string().default('Valid Name'),
      count: z.number().min(0).default(5),
      enabled: z.boolean().default(true),
    });

    const defaults = getDefaults(ValidatableSchema);

    // The defaults should be valid according to the original schema
    const validationResult = ValidatableSchema.safeParse(defaults);
    expect(validationResult.success).toBe(true);

    if (validationResult.success) {
      expect(validationResult.data).toEqual(defaults);
    }
  });
});

describe('getDefaultsPartial', () => {
  it('should return empty object when no defaults exist', () => {
    const NoDefaultsSchema = z.object({
      id: z.string(),
      name: z.string(),
      optional: z.string().optional(),
      nullable: z.string().nullable(),
    });

    const partialDefaults = getDefaultsPartial(NoDefaultsSchema);

    expect(partialDefaults).toEqual({});
    expect(Object.keys(partialDefaults)).toHaveLength(0);
  });

  it('should handle complex defaults in partial mode', () => {
    const ComplexSchema = z.object({
      required: z.string(),
      settings: z
        .object({
          display: z
            .object({
              theme: z.string().default('auto'),
            })
            .default({
              theme: 'auto',
            }),
        })
        .default({
          display: {
            theme: 'auto',
          },
        }),
      metadata: z.record(z.string(), z.string()).default({}),
      optional: z.string().optional(),
    });

    const partialDefaults = getDefaultsPartial(ComplexSchema);

    // Since there's a required field without default, returns empty object
    expect(partialDefaults).toEqual({});
  });
});

describe('Helper function edge cases', () => {
  it('should handle empty schemas', () => {
    const EmptySchema = z.object({});

    const defaults = getDefaults(EmptySchema);
    const partialDefaults = getDefaultsPartial(EmptySchema);

    expect(defaults).toEqual({});
    expect(partialDefaults).toEqual({});
  });

  it('should handle schemas with only required fields', () => {
    const RequiredOnlySchema = z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
    });

    const defaults = getDefaults(RequiredOnlySchema);
    const partialDefaults = getDefaultsPartial(RequiredOnlySchema);

    expect(defaults).toEqual({});
    expect(partialDefaults).toEqual({});
  });

  it('should handle null and undefined defaults correctly', () => {
    const NullDefaultsSchema = z.object({
      nullable: z.string().nullable().default(null),
      optional: z.string().optional().default(undefined),
      emptyString: z.string().default(''),
      zero: z.number().default(0),
      false: z.boolean().default(false),
    });

    const defaults = getDefaults(NullDefaultsSchema);

    expect(defaults).toEqual({
      nullable: null,
      optional: undefined,
      emptyString: '',
      zero: 0,
      false: false,
    });
  });

  it('should handle transformed schemas', () => {
    const TransformedSchema = z.object({
      value: z
        .string()
        .default('raw')
        .transform((val) => val.toUpperCase()),
      count: z
        .number()
        .default(5)
        .transform((val) => val * 2),
    });

    const defaults = getDefaults(TransformedSchema);

    // Defaults should be applied before transformation in this test
    // Note: The actual behavior might depend on how Zod handles defaults with transforms
    expect(typeof defaults.value).toBe('string');
    expect(typeof defaults.count).toBe('number');
  });
});
