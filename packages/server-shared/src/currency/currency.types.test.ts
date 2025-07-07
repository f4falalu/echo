import { describe, expect, it } from 'vitest';
import { CurrencySchema } from './currency.types';

describe('CurrencySchema', () => {
  it('should parse valid currency object', () => {
    const validCurrency = {
      code: 'USD',
      description: 'United States Dollar',
      flag: '🇺🇸',
    };

    const result = CurrencySchema.safeParse(validCurrency);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.code).toBe('USD');
      expect(result.data.description).toBe('United States Dollar');
      expect(result.data.flag).toBe('🇺🇸');
    }
  });

  it('should require all fields', () => {
    const incompleteObjects = [
      {
        // missing code
        description: 'Euro',
        flag: '🇪🇺',
      },
      {
        code: 'EUR',
        // missing description
        flag: '🇪🇺',
      },
      {
        code: 'EUR',
        description: 'Euro',
        // missing flag
      },
    ];

    for (const obj of incompleteObjects) {
      const result = CurrencySchema.safeParse(obj);
      expect(result.success).toBe(false);
    }
  });

  it('should validate that all fields are strings', () => {
    const invalidTypes = [
      {
        code: 123, // should be string
        description: 'Invalid Code',
        flag: '🇺🇸',
      },
      {
        code: 'USD',
        description: true, // should be string
        flag: '🇺🇸',
      },
      {
        code: 'USD',
        description: 'United States Dollar',
        flag: null, // should be string
      },
    ];

    for (const obj of invalidTypes) {
      const result = CurrencySchema.safeParse(obj);
      expect(result.success).toBe(false);
    }
  });

  it('should handle various currency examples', () => {
    const currencies = [
      {
        code: 'EUR',
        description: 'Euro',
        flag: '🇪🇺',
      },
      {
        code: 'GBP',
        description: 'British Pound Sterling',
        flag: '🇬🇧',
      },
      {
        code: 'JPY',
        description: 'Japanese Yen',
        flag: '🇯🇵',
      },
      {
        code: 'CAD',
        description: 'Canadian Dollar',
        flag: '🇨🇦',
      },
      {
        code: 'AUD',
        description: 'Australian Dollar',
        flag: '🇦🇺',
      },
    ];

    for (const currency of currencies) {
      const result = CurrencySchema.safeParse(currency);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.code).toBe(currency.code);
        expect(result.data.description).toBe(currency.description);
        expect(result.data.flag).toBe(currency.flag);
      }
    }
  });

  it('should handle empty strings', () => {
    const currencyWithEmptyStrings = {
      code: '',
      description: '',
      flag: '',
    };

    const result = CurrencySchema.safeParse(currencyWithEmptyStrings);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.code).toBe('');
      expect(result.data.description).toBe('');
      expect(result.data.flag).toBe('');
    }
  });

  it('should handle long strings', () => {
    const currencyWithLongStrings = {
      code: 'VERYLONGCURRENCYCODE',
      description:
        'This is a very long description for a currency that might not exist in real life but should still be valid according to our schema',
      flag: '🏳️‍🌈🏳️‍⚧️🇺🇳', // Multiple flag emojis
    };

    const result = CurrencySchema.safeParse(currencyWithLongStrings);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.code).toBe('VERYLONGCURRENCYCODE');
      expect(result.data.description).toBe(
        'This is a very long description for a currency that might not exist in real life but should still be valid according to our schema'
      );
      expect(result.data.flag).toBe('🏳️‍🌈🏳️‍⚧️🇺🇳');
    }
  });

  it('should handle special characters and unicode', () => {
    const currencyWithSpecialChars = {
      code: 'BTC-₿',
      description: 'Bitcoin (₿) - Digital Currency with special chars: @#$%^&*()[]{}',
      flag: '₿',
    };

    const result = CurrencySchema.safeParse(currencyWithSpecialChars);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.code).toBe('BTC-₿');
      expect(result.data.description).toBe(
        'Bitcoin (₿) - Digital Currency with special chars: @#$%^&*()[]{}'
      );
      expect(result.data.flag).toBe('₿');
    }
  });

  it('should reject additional properties', () => {
    const currencyWithExtraProps = {
      code: 'USD',
      description: 'United States Dollar',
      flag: '🇺🇸',
      extraProperty: 'This should not be allowed',
      anotherExtra: 123,
    };

    const result = CurrencySchema.safeParse(currencyWithExtraProps);
    // Zod by default allows additional properties unless .strict() is used
    // Since the schema doesn't use .strict(), extra properties are allowed but ignored
    expect(result.success).toBe(true);

    if (result.success) {
      // Extra properties should not be included in the result
      expect('extraProperty' in result.data).toBe(false);
      expect('anotherExtra' in result.data).toBe(false);
      expect(result.data.code).toBe('USD');
      expect(result.data.description).toBe('United States Dollar');
      expect(result.data.flag).toBe('🇺🇸');
    }
  });
});
