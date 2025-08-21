import { describe, expect, it } from 'vitest';
import { extractMetricIdsFromReport, reportContainsMetrics } from './report-metric-helper';

describe('report-metric-helper', () => {
  describe('reportContainsMetrics', () => {
    it('should return true when report contains a metric tag', () => {
      const content = `
        # Sales Report
        
        Here is the monthly sales data:
        <metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
        
        The sales have increased by 15%.
      `;

      expect(reportContainsMetrics(content)).toBe(true);
    });

    it('should return true for multiple metric tags', () => {
      const content = `
        <metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
        <metric metricId="55ab3dd9-89c1-499f-cd56-9c6523e2cf19" />
        <metric metricId="77ef4ee0-90d2-500g-de67-0d7634f3dg20" />
      `;

      expect(reportContainsMetrics(content)).toBe(true);
    });

    it('should return true with different spacing and quotes', () => {
      const contentSingleQuotes = `<metric metricId='24db2cc8-79b0-488f-bd45-8b5412d1bf08' />`;
      const contentExtraSpaces = `<metric  metricId = "24db2cc8-79b0-488f-bd45-8b5412d1bf08"  />`;
      const contentNoSpaceBeforeSlash = `<metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08"/>`;

      expect(reportContainsMetrics(contentSingleQuotes)).toBe(true);
      expect(reportContainsMetrics(contentExtraSpaces)).toBe(true);
      expect(reportContainsMetrics(contentNoSpaceBeforeSlash)).toBe(true);
    });

    it('should return false when report contains no metric tags', () => {
      const content = `
        # Sales Report
        
        This is a simple report without any metrics.
        Just plain text and analysis.
      `;

      expect(reportContainsMetrics(content)).toBe(false);
    });

    it('should return false for malformed metric tags', () => {
      const noId = `<metric />`;
      const wrongAttribute = `<metric id="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />`;
      const notSelfClosing = `<metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08"></metric>`;
      const invalidUuid = `<metric metricId="not-a-uuid" />`;

      expect(reportContainsMetrics(noId)).toBe(false);
      expect(reportContainsMetrics(wrongAttribute)).toBe(false);
      expect(reportContainsMetrics(notSelfClosing)).toBe(false);
      expect(reportContainsMetrics(invalidUuid)).toBe(false);
    });

    it('should return false for undefined or empty content', () => {
      expect(reportContainsMetrics(undefined)).toBe(false);
      expect(reportContainsMetrics('')).toBe(false);
    });

    it('should be case insensitive for metricId attribute', () => {
      const content = `<metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />`;
      const contentUpper = `<METRIC METRICID="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />`;

      expect(reportContainsMetrics(content)).toBe(true);
      // The regex has 'i' flag, so this should also match
      expect(reportContainsMetrics(contentUpper)).toBe(true);
    });
  });

  describe('extractMetricIdsFromReport', () => {
    it('should extract single metric ID', () => {
      const content = `
        # Report
        <metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
      `;

      const ids = extractMetricIdsFromReport(content);
      expect(ids).toEqual(['24db2cc8-79b0-488f-bd45-8b5412d1bf08']);
    });

    it('should extract multiple metric IDs', () => {
      const content = `
        <metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
        Some text here
        <metric metricId="55ab3dd9-89c1-499f-cd56-9c6523e2cf19" />
        More analysis
        <metric metricId="77ef4ee0-90d2-500a-de67-0d7634f3da20" />
      `;

      const ids = extractMetricIdsFromReport(content);
      expect(ids).toHaveLength(3);
      expect(ids).toContain('24db2cc8-79b0-488f-bd45-8b5412d1bf08');
      expect(ids).toContain('55ab3dd9-89c1-499f-cd56-9c6523e2cf19');
      expect(ids).toContain('77ef4ee0-90d2-500a-de67-0d7634f3da20');
    });

    it('should handle different quote styles', () => {
      const content = `
        <metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
        <metric metricId='55ab3dd9-89c1-499f-cd56-9c6523e2cf19' />
      `;

      const ids = extractMetricIdsFromReport(content);
      expect(ids).toHaveLength(2);
      expect(ids).toContain('24db2cc8-79b0-488f-bd45-8b5412d1bf08');
      expect(ids).toContain('55ab3dd9-89c1-499f-cd56-9c6523e2cf19');
    });

    it('should return empty array for no metrics', () => {
      const content = `
        # Report
        This report has no metrics.
      `;

      const ids = extractMetricIdsFromReport(content);
      expect(ids).toEqual([]);
    });

    it('should return empty array for undefined or empty content', () => {
      expect(extractMetricIdsFromReport(undefined)).toEqual([]);
      expect(extractMetricIdsFromReport('')).toEqual([]);
    });

    it('should not extract from malformed tags', () => {
      const content = `
        <metric id="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
        <metric metricId="not-a-uuid" />
        <metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08"></metric>
      `;

      const ids = extractMetricIdsFromReport(content);
      expect(ids).toEqual([]);
    });

    it('should handle duplicate metric IDs', () => {
      const content = `
        <metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
        <metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
        <metric metricId="55ab3dd9-89c1-499f-cd56-9c6523e2cf19" />
      `;

      const ids = extractMetricIdsFromReport(content);
      // Should return duplicates as-is (no deduplication in the function)
      expect(ids).toHaveLength(3);
      expect(ids[0]).toBe('24db2cc8-79b0-488f-bd45-8b5412d1bf08');
      expect(ids[1]).toBe('24db2cc8-79b0-488f-bd45-8b5412d1bf08');
      expect(ids[2]).toBe('55ab3dd9-89c1-499f-cd56-9c6523e2cf19');
    });
  });
});
