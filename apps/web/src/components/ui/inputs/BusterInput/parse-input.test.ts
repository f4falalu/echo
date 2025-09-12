import { describe, expect, it } from 'vitest';
import type { BusterMentionItem } from './BusterInput.types';
import { parseMarkupInput } from './parse-input';

describe('parseMarkupInput', () => {
  const mockItems: BusterMentionItem<string>[] = [
    {
      value: '1',
      parsedValue: 'BigNate User',
      label: 'BigNate',
    },
    {
      value: '2',
      label: 'ReactFan42',
      // No parsedValue - should use value instead
    },
    {
      value: '3',
      parsedValue: 'Next.js Developer',
      label: 'NextJSDev',
    },
  ];

  const mockItemsRecord = {
    '@': {
      items: mockItems,
      trigger: '@' as const,
    },
  };

  it('should replace mention markup with parsedValue when available', () => {
    const input = 'Hello @[BigNate](1) how are you?';
    const result = parseMarkupInput({
      input,
      items: mockItemsRecord,
    });

    expect(result).toBe('Hello BigNate User how are you?');
  });

  it('should replace mention markup with value when parsedValue is undefined', () => {
    const input = 'Hey @[ReactFan42](2) welcome!';
    const result = parseMarkupInput({
      input,
      items: mockItemsRecord,
    });

    expect(result).toBe('Hey 2 welcome!');
  });

  it('should handle multiple mentions in the same string', () => {
    const input = 'Meeting with @[BigNate](1) and @[NextJSDev](3) at 3pm';
    const result = parseMarkupInput({
      input,
      items: mockItemsRecord,
    });

    expect(result).toBe('Meeting with BigNate User and Next.js Developer at 3pm');
  });

  it('should return original text when no mentions are found', () => {
    const input = 'This is just regular text without any mentions';
    const result = parseMarkupInput({
      input,
      items: mockItemsRecord,
    });

    expect(result).toBe('This is just regular text without any mentions');
  });

  it('should handle mentions with unknown IDs by leaving them unchanged', () => {
    const input = 'Hello @[UnknownUser](999) how are you?';
    const result = parseMarkupInput({
      input,
      items: mockItemsRecord,
    });

    expect(result).toBe('Hello @[UnknownUser](999) how are you?');
  });
});
