import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { describe, expect, it } from 'vitest';
import { InnerLabelTitleRecord, getPieInnerLabelTitle } from './pieLabelHelpers';

describe('pieLabelHelpers', () => {
  describe('InnerLabelTitleRecord', () => {
    it('should have the correct titles for each aggregate type', () => {
      expect(InnerLabelTitleRecord.sum).toBe('Total');
      expect(InnerLabelTitleRecord.average).toBe('Average');
      expect(InnerLabelTitleRecord.median).toBe('Median');
      expect(InnerLabelTitleRecord.max).toBe('Max');
      expect(InnerLabelTitleRecord.min).toBe('Min');
      expect(InnerLabelTitleRecord.count).toBe('Count');
    });
  });

  describe('getPieInnerLabelTitle', () => {
    it('should return the provided title when pieInnerLabelTitle is provided', () => {
      const pieInnerLabelTitle = 'Custom Title';
      const pieInnerLabelAggregate: ChartConfigProps['pieInnerLabelAggregate'] = 'sum';

      const result = getPieInnerLabelTitle(pieInnerLabelTitle, pieInnerLabelAggregate);

      expect(result).toBe('Custom Title');
    });

    it('should return the aggregate title when pieInnerLabelTitle is not provided', () => {
      const pieInnerLabelTitle = undefined as any;
      const pieInnerLabelAggregate: ChartConfigProps['pieInnerLabelAggregate'] = 'average';

      const result = getPieInnerLabelTitle(pieInnerLabelTitle, pieInnerLabelAggregate);

      expect(result).toBe('Average');
    });

    it('should default to "sum" aggregate when pieInnerLabelAggregate is not provided', () => {
      const pieInnerLabelTitle = undefined as any;
      const pieInnerLabelAggregate = undefined as any;

      const result = getPieInnerLabelTitle(pieInnerLabelTitle, pieInnerLabelAggregate);

      expect(result).toBe('Total');
    });

    it('should fall back to aggregate title when pieInnerLabelTitle is null', () => {
      const pieInnerLabelTitle = null as unknown as ChartConfigProps['pieInnerLabelTitle'];
      const pieInnerLabelAggregate: ChartConfigProps['pieInnerLabelAggregate'] = 'median';

      const result = getPieInnerLabelTitle(pieInnerLabelTitle, pieInnerLabelAggregate);

      expect(result).toBe('Median');
    });

    it('should work with each type of aggregate', () => {
      const testCases: NonNullable<ChartConfigProps['pieInnerLabelAggregate']>[] = [
        'sum',
        'average',
        'median',
        'max',
        'min',
        'count',
      ];

      testCases.forEach((aggregate) => {
        const result = getPieInnerLabelTitle(undefined as any, aggregate);
        expect(result).toBe(InnerLabelTitleRecord[aggregate]);
      });
    });
  });
});
