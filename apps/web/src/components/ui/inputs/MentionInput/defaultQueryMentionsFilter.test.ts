import { describe, expect, it } from 'vitest';
import { defaultQueryMentionsFilter } from './defaultQueryMentionsFilter';
import type { MentionInputTriggerItem, MentionTriggerItem } from './MentionInput.types';

describe('defaultQueryMentionsFilter', () => {
  describe('Empty query handling', () => {
    it('should return all items when query is empty', () => {
      const items: MentionInputTriggerItem[] = [
        { value: 'apple', label: 'Apple', type: 'item' },
        { type: 'separator' },
        { value: 'banana', label: 'Banana', type: 'item' },
        {
          type: 'group',
          label: 'Fruits',
          items: [
            { value: 'cherry', label: 'Cherry', type: 'item' },
            { value: 'date', label: 'Date', type: 'item' },
          ],
        },
      ];

      const result = defaultQueryMentionsFilter('', items);
      expect(result).toEqual(items);
    });
  });

  describe('Case-insensitive filtering', () => {
    it('should filter items case-insensitively and match partial strings', () => {
      const items: MentionInputTriggerItem[] = [
        { value: 'apple', label: 'Apple', type: 'item' },
        { value: 'apricot', label: 'Apricot', type: 'item' },
        { value: 'banana', label: 'Banana', type: 'item' },
        { value: 'blueberry', label: 'Blueberry', type: 'item' },
        { value: 'cherry', label: 'Cherry', type: 'item' },
      ];

      // Test uppercase query - "APP" matches "Apple" but not "Apricot"
      let result = defaultQueryMentionsFilter('APP', items);
      expect(result).toEqual([{ value: 'apple', label: 'Apple', type: 'item' }]);

      // Test query that matches multiple items with common substring
      result = defaultQueryMentionsFilter('apr', items);
      expect(result).toEqual([{ value: 'apricot', label: 'Apricot', type: 'item' }]);

      // Test lowercase query - "ber" only matches "Blueberry", not "Cherry"
      result = defaultQueryMentionsFilter('ber', items);
      expect(result).toEqual([{ value: 'blueberry', label: 'Blueberry', type: 'item' }]);

      // Test query matching multiple items
      result = defaultQueryMentionsFilter('rr', items);
      expect(result).toEqual([
        { value: 'blueberry', label: 'Blueberry', type: 'item' },
        { value: 'cherry', label: 'Cherry', type: 'item' },
      ]);

      // Test mixed case query
      result = defaultQueryMentionsFilter('BaN', items);
      expect(result).toEqual([{ value: 'banana', label: 'Banana', type: 'item' }]);
    });
  });

  describe('labelMatches filtering', () => {
    it('should prioritize labelMatches over label when filtering', () => {
      const items: MentionInputTriggerItem[] = [
        {
          value: 'dataset1',
          label: 'Production Dataset',
          labelMatches: ['sales', 'revenue', 'transactions'],
          type: 'item',
        },
        {
          value: 'dataset2',
          label: 'Customer Dataset',
          labelMatches: ['users', 'customers', 'accounts'],
          type: 'item',
        },
        {
          value: 'dataset3',
          label: 'Analytics Dataset',
          // No labelMatches, should fallback to label
          type: 'item',
        },
      ];

      // Search for 'sales' should match first item via labelMatches
      let result = defaultQueryMentionsFilter('sales', items);
      expect(result).toEqual([
        {
          value: 'dataset1',
          label: 'Production Dataset',
          labelMatches: ['sales', 'revenue', 'transactions'],
          type: 'item',
        },
      ]);

      // Search for 'customer' should match second item via labelMatches
      result = defaultQueryMentionsFilter('customer', items);
      expect(result).toEqual([
        {
          value: 'dataset2',
          label: 'Customer Dataset',
          labelMatches: ['users', 'customers', 'accounts'],
          type: 'item',
        },
      ]);

      // Search for 'analytics' should match third item via label fallback
      result = defaultQueryMentionsFilter('analytics', items);
      expect(result).toEqual([
        {
          value: 'dataset3',
          label: 'Analytics Dataset',
          type: 'item',
        },
      ]);

      // Search for 'production' should NOT match first item (not in labelMatches)
      result = defaultQueryMentionsFilter('production', items);
      expect(result).toEqual([]);
    });
  });

  describe('Group filtering', () => {
    it('should only include groups that have matching items and filter items within groups', () => {
      const items: MentionInputTriggerItem[] = [
        {
          type: 'group',
          label: 'Fruits',
          items: [
            { value: 'apple', label: 'Apple', type: 'item' },
            { value: 'apricot', label: 'Apricot', type: 'item' },
            { value: 'banana', label: 'Banana', type: 'item' },
          ],
        },
        {
          type: 'group',
          label: 'Vegetables',
          items: [
            { value: 'carrot', label: 'Carrot', type: 'item' },
            { value: 'celery', label: 'Celery', type: 'item' },
            { value: 'corn', label: 'Corn', type: 'item' },
          ],
        },
        {
          type: 'group',
          label: 'Dairy',
          items: [
            { value: 'milk', label: 'Milk', type: 'item' },
            { value: 'cheese', label: 'Cheese', type: 'item' },
          ],
        },
      ];

      // Query 'app' should only show Fruits group with matching items (only Apple contains 'app')
      const result = defaultQueryMentionsFilter('app', items);
      expect(result).toEqual([
        {
          type: 'group',
          label: 'Fruits',
          items: [{ value: 'apple', label: 'Apple', type: 'item' }],
        },
      ]);

      // Query 'co' should show Fruits (Apricot) and Vegetables (Corn) groups
      const result2 = defaultQueryMentionsFilter('co', items);
      expect(result2).toEqual([
        {
          type: 'group',
          label: 'Fruits',
          items: [{ value: 'apricot', label: 'Apricot', type: 'item' }],
        },
        {
          type: 'group',
          label: 'Vegetables',
          items: [{ value: 'corn', label: 'Corn', type: 'item' }],
        },
      ]);

      // Query 'xyz' should return empty array (no matches)
      const result3 = defaultQueryMentionsFilter('xyz', items);
      expect(result3).toEqual([]);
    });
  });

  describe('Separator cleanup', () => {
    it('should remove leading, trailing, and consecutive separators', () => {
      const items: MentionInputTriggerItem[] = [
        { type: 'separator' }, // Leading separator
        { type: 'separator' }, // Consecutive separator
        { value: 'apple', label: 'Apple', type: 'item' },
        { type: 'separator' },
        { type: 'separator' }, // Consecutive separator
        { value: 'banana', label: 'Banana', type: 'item' },
        { type: 'separator' },
        {
          type: 'group',
          label: 'Citrus',
          items: [
            { value: 'orange', label: 'Orange', type: 'item' },
            { value: 'lemon', label: 'Lemon', type: 'item' },
          ],
        },
        { type: 'separator' },
        { type: 'separator' }, // Consecutive separator
        { value: 'grape', label: 'Grape', type: 'item' },
        { type: 'separator' }, // Trailing separator
        { type: 'separator' }, // Trailing separator
      ];

      // Query 'a' should match apple, banana, orange, and grape
      const result = defaultQueryMentionsFilter('a', items);
      expect(result).toEqual([
        { value: 'apple', label: 'Apple', type: 'item' },
        { type: 'separator' },
        { value: 'banana', label: 'Banana', type: 'item' },
        { type: 'separator' },
        {
          type: 'group',
          label: 'Citrus',
          items: [{ value: 'orange', label: 'Orange', type: 'item' }],
        },
        { type: 'separator' },
        { value: 'grape', label: 'Grape', type: 'item' },
      ]);

      // Test with items that result in only separators initially
      const separatorOnlyItems: MentionInputTriggerItem[] = [
        { type: 'separator' },
        { value: 'apple', label: 'Apple', type: 'item' },
        { type: 'separator' },
        { value: 'banana', label: 'Banana', type: 'item' },
        { type: 'separator' },
      ];

      // Query 'xyz' should filter out all items, leaving no separators
      const result2 = defaultQueryMentionsFilter('xyz', separatorOnlyItems);
      expect(result2).toEqual([]);

      // Test separator between groups
      const groupItems: MentionInputTriggerItem[] = [
        {
          type: 'group',
          label: 'Group 1',
          items: [{ value: 'item1', label: 'Item 1', type: 'item' }],
        },
        { type: 'separator' },
        { type: 'separator' },
        {
          type: 'group',
          label: 'Group 2',
          items: [{ value: 'item2', label: 'Item 2', type: 'item' }],
        },
      ];

      const result3 = defaultQueryMentionsFilter('item', groupItems);
      expect(result3).toEqual([
        {
          type: 'group',
          label: 'Group 1',
          items: [{ value: 'item1', label: 'Item 1', type: 'item' }],
        },
        { type: 'separator' },
        {
          type: 'group',
          label: 'Group 2',
          items: [{ value: 'item2', label: 'Item 2', type: 'item' }],
        },
      ]);
    });
  });

  describe('Fuzzy matching with Fuse.js', () => {
    it('should match items with typos and approximate spelling', () => {
      const items: MentionInputTriggerItem[] = [
        { value: 'apple', label: 'Apple', type: 'item' },
        { value: 'banana', label: 'Banana', type: 'item' },
        { value: 'cherry', label: 'Cherry', type: 'item' },
        { value: 'blueberry', label: 'Blueberry', type: 'item' },
        { value: 'strawberry', label: 'Strawberry', type: 'item' },
      ];

      // Test typos - "Appl" should match "Apple"
      let result = defaultQueryMentionsFilter('Appl', items);
      expect(result).toEqual([{ value: 'apple', label: 'Apple', type: 'item' }]);

      // Test missing letters - "Banan" should match "Banana"
      result = defaultQueryMentionsFilter('Banan', items);
      expect(result).toEqual([{ value: 'banana', label: 'Banana', type: 'item' }]);

      // Test transposed letters - "Chery" should match "Cherry"
      result = defaultQueryMentionsFilter('Chery', items);
      expect(result).toEqual([{ value: 'cherry', label: 'Cherry', type: 'item' }]);

      // Test partial match with typo - "blubery" should match "Blueberry"
      result = defaultQueryMentionsFilter('blubery', items);
      expect(result).toEqual([{ value: 'blueberry', label: 'Blueberry', type: 'item' }]);
    });

    it('should apply fuzzy matching to labelMatches while preserving priority', () => {
      const items: MentionInputTriggerItem[] = [
        {
          value: 'dataset1',
          label: 'Production Dataset',
          labelMatches: ['sales', 'revenue', 'transactions'],
          type: 'item',
        },
        {
          value: 'dataset2',
          label: 'Customer Dataset',
          labelMatches: ['users', 'customers', 'accounts'],
          type: 'item',
        },
        {
          value: 'dataset3',
          label: 'Analytics Dataset',
          // No labelMatches, should use label with fuzzy matching
          type: 'item',
        },
      ];

      // Fuzzy match in labelMatches - "sale" should match "sales"
      let result = defaultQueryMentionsFilter('sale', items);
      expect(result).toEqual([
        {
          value: 'dataset1',
          label: 'Production Dataset',
          labelMatches: ['sales', 'revenue', 'transactions'],
          type: 'item',
        },
      ]);

      // Fuzzy match with typo in labelMatches - "custmer" should match "customers"
      result = defaultQueryMentionsFilter('custmer', items);
      expect(result).toEqual([
        {
          value: 'dataset2',
          label: 'Customer Dataset',
          labelMatches: ['users', 'customers', 'accounts'],
          type: 'item',
        },
      ]);

      // Fuzzy match in label when no labelMatches - "Analytic" should match "Analytics Dataset"
      result = defaultQueryMentionsFilter('Analytic', items);
      expect(result).toEqual([
        {
          value: 'dataset3',
          label: 'Analytics Dataset',
          type: 'item',
        },
      ]);

      // Should NOT match label when labelMatches exists - "Productn" should NOT match first item
      result = defaultQueryMentionsFilter('Productn', items);
      expect(result).toEqual([]);
    });

    it('should apply fuzzy matching within groups', () => {
      const items: MentionInputTriggerItem[] = [
        {
          type: 'group',
          label: 'Fruits',
          items: [
            { value: 'apple', label: 'Apple', type: 'item' },
            { value: 'apricot', label: 'Apricot', type: 'item' },
            { value: 'avocado', label: 'Avocado', type: 'item' },
          ],
        },
        {
          type: 'group',
          label: 'Vegetables',
          items: [
            { value: 'artichoke', label: 'Artichoke', type: 'item' },
            { value: 'asparagus', label: 'Asparagus', type: 'item' },
            { value: 'arugula', label: 'Arugula', type: 'item' },
          ],
        },
        {
          type: 'group',
          label: 'Grains',
          items: [
            { value: 'quinoa', label: 'Quinoa', type: 'item' },
            { value: 'amaranth', label: 'Amaranth', type: 'item' },
          ],
        },
      ];

      // Fuzzy match should work within groups - "Appl" should match "Apple" in Fruits group
      let result = defaultQueryMentionsFilter('Appl', items);
      expect(result).toEqual([
        {
          type: 'group',
          label: 'Fruits',
          items: [{ value: 'apple', label: 'Apple', type: 'item' }],
        },
      ]);

      // Fuzzy match with multiple group matches - "Ar" with typos should match items in both groups
      result = defaultQueryMentionsFilter('Artich', items);
      expect(result).toEqual([
        {
          type: 'group',
          label: 'Vegetables',
          items: [{ value: 'artichoke', label: 'Artichoke', type: 'item' }],
        },
      ]);

      // Fuzzy match should handle typos in group items - "Quinao" should match "Quinoa"
      result = defaultQueryMentionsFilter('Quinao', items);
      expect(result).toEqual([
        {
          type: 'group',
          label: 'Grains',
          items: [{ value: 'quinoa', label: 'Quinoa', type: 'item' }],
        },
      ]);

      // No fuzzy match should return empty (threshold test) - very different string
      result = defaultQueryMentionsFilter('xyz123', items);
      expect(result).toEqual([]);
    });
  });
});
