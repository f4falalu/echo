import { describe, expect, it } from 'vitest';
import { InvalidShortcutNameError } from './shortcut-errors';
import { validateInstructions, validateShortcutName } from './shortcut-validators';

describe('shortcut-validators', () => {
  describe('validateShortcutName', () => {
    describe('valid names', () => {
      const validNames = [
        'a',
        'test',
        'my-shortcut',
        'weekly-report',
        'test123',
        'a1b2c3',
        'lowercase-with-numbers-123',
        'x'.repeat(255), // Max length
      ];

      validNames.forEach((name) => {
        it(`should accept valid name: "${name}"`, () => {
          expect(() => validateShortcutName(name)).not.toThrow();
        });
      });
    });

    describe('invalid names', () => {
      const invalidCases = [
        { name: '', reason: 'empty string' },
        { name: 'Test', reason: 'starts with uppercase' },
        { name: '1test', reason: 'starts with number' },
        { name: '-test', reason: 'starts with hyphen' },
        { name: 'test_name', reason: 'contains underscore' },
        { name: 'test name', reason: 'contains space' },
        { name: 'test--name', reason: 'contains consecutive hyphens' },
        { name: 'test!', reason: 'contains special character' },
        { name: 'TEST', reason: 'all uppercase' },
        { name: 'x'.repeat(256), reason: 'exceeds max length' },
      ];

      invalidCases.forEach(({ name, reason }) => {
        it(`should reject invalid name (${reason}): "${name}"`, () => {
          expect(() => validateShortcutName(name)).toThrow(InvalidShortcutNameError);
        });
      });
    });

    describe('edge cases', () => {
      it('should reject names with only hyphens after first letter', () => {
        expect(() => validateShortcutName('a--')).toThrow(InvalidShortcutNameError);
      });

      it('should accept single letter names', () => {
        expect(() => validateShortcutName('a')).not.toThrow();
      });

      it('should reject names ending with multiple hyphens', () => {
        expect(() => validateShortcutName('test--')).toThrow(InvalidShortcutNameError);
      });
    });
  });

  describe('validateInstructions', () => {
    describe('valid instructions', () => {
      it('should accept normal instructions', () => {
        const instructions = 'Generate a weekly report';
        expect(validateInstructions(instructions)).toBe(instructions);
      });

      it('should trim whitespace', () => {
        const instructions = '  Generate a report  ';
        expect(validateInstructions(instructions)).toBe('Generate a report');
      });

      it('should accept long instructions within limit', () => {
        const instructions = 'x'.repeat(10000);
        expect(validateInstructions(instructions)).toBe(instructions);
      });

      it('should preserve internal whitespace', () => {
        const instructions = 'Line 1\n\nLine 2\n  Indented';
        expect(validateInstructions(instructions)).toBe(instructions);
      });
    });

    describe('invalid instructions', () => {
      it('should reject empty instructions', () => {
        expect(() => validateInstructions('')).toThrow('Instructions cannot be empty');
      });

      it('should reject whitespace-only instructions', () => {
        expect(() => validateInstructions('   ')).toThrow('Instructions cannot be empty');
      });

      it('should reject instructions exceeding max length', () => {
        const instructions = 'x'.repeat(10001);
        expect(() => validateInstructions(instructions)).toThrow(
          'Instructions must be 10,000 characters or less'
        );
      });
    });
  });
});
