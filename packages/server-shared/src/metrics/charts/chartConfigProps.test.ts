import { describe, expect, it } from 'vitest';
import {
  type ChartConfigProps,
  ChartConfigPropsSchema,
  DEFAULT_CHART_CONFIG,
  DEFAULT_CHART_CONFIG_ENTRIES,
} from './chartConfigProps';
import { DEFAULT_CHART_THEME } from './configColors';

describe('chartConfigProps', () => {
  describe('DEFAULT_CHART_CONFIG', () => {
    it('should have the correct default values', () => {
      expect(DEFAULT_CHART_CONFIG).toBeDefined();
      expect(DEFAULT_CHART_CONFIG).toMatchObject({
        selectedChartType: 'table',
        columnSettings: {},
        columnLabelFormats: {},
        colors: DEFAULT_CHART_THEME,
        showLegend: null,
        gridLines: true,
        goalLines: [],
        trendlines: [],
        disableTooltip: false,
      });
    });

    it('should be a valid ChartConfigProps object', () => {
      // This should not throw
      expect(() => ChartConfigPropsSchema.parse(DEFAULT_CHART_CONFIG)).not.toThrow();
    });

    it('should have the expected color palette', () => {
      expect(DEFAULT_CHART_CONFIG.colors).toHaveLength(10);
      expect(DEFAULT_CHART_CONFIG.colors).toEqual([
        '#B399FD',
        '#FC8497',
        '#FBBC30',
        '#279EFF',
        '#E83562',
        '#41F8FF',
        '#F3864F',
        '#C82184',
        '#31FCB4',
        '#E83562',
      ]);
    });

    it('should have empty objects for column configurations', () => {
      expect(DEFAULT_CHART_CONFIG.columnSettings).toEqual({});
      expect(DEFAULT_CHART_CONFIG.columnLabelFormats).toEqual({});
    });

    it('should have empty arrays for annotations', () => {
      expect(DEFAULT_CHART_CONFIG.goalLines).toEqual([]);
      expect(DEFAULT_CHART_CONFIG.trendlines).toEqual([]);
    });

    it('should have correct boolean defaults', () => {
      expect(DEFAULT_CHART_CONFIG.gridLines).toBe(true);
      expect(DEFAULT_CHART_CONFIG.disableTooltip).toBe(false);
    });

    it('should have null as default for showLegend', () => {
      expect(DEFAULT_CHART_CONFIG.showLegend).toBeNull();
    });
  });

  describe('DEFAULT_CHART_CONFIG_ENTRIES', () => {
    it('should be an array of key-value pairs', () => {
      expect(DEFAULT_CHART_CONFIG_ENTRIES).toBeDefined();
      expect(Array.isArray(DEFAULT_CHART_CONFIG_ENTRIES)).toBe(true);
    });

    it('should contain all keys from DEFAULT_CHART_CONFIG', () => {
      const configKeys = Object.keys(DEFAULT_CHART_CONFIG);
      const entriesKeys = DEFAULT_CHART_CONFIG_ENTRIES.map(([key]) => key);

      expect(entriesKeys).toHaveLength(configKeys.length);
      expect(entriesKeys.sort()).toEqual(configKeys.sort());
    });

    it('should have matching values with DEFAULT_CHART_CONFIG', () => {
      for (const [key, value] of DEFAULT_CHART_CONFIG_ENTRIES) {
        expect(DEFAULT_CHART_CONFIG[key as keyof typeof DEFAULT_CHART_CONFIG]).toEqual(value);
      }
    });

    it('should be reconstructable to DEFAULT_CHART_CONFIG', () => {
      const reconstructed = Object.fromEntries(DEFAULT_CHART_CONFIG_ENTRIES);
      expect(reconstructed).toEqual(DEFAULT_CHART_CONFIG);
    });

    it('should contain specific expected entries', () => {
      const entriesMap = new Map(DEFAULT_CHART_CONFIG_ENTRIES);

      expect(entriesMap.get('selectedChartType')).toBe('table');
      expect(entriesMap.get('colors')).toEqual(DEFAULT_CHART_THEME);
      expect(entriesMap.get('gridLines')).toBe(true);
      expect(entriesMap.get('showLegend')).toBeNull();
      expect(entriesMap.get('disableTooltip')).toBe(false);
    });

    it('should have the correct number of entries', () => {
      // Count the number of properties we expect
      const expectedKeys = [
        'selectedChartType',
        'columnSettings',
        'columnLabelFormats',
        'colors',
        'showLegend',
        'gridLines',
        'goalLines',
        'trendlines',
        'disableTooltip',
        // Plus any additional properties from the spread schemas
      ];

      // The actual count will depend on what's in the spread schemas
      expect(DEFAULT_CHART_CONFIG_ENTRIES.length).toBeGreaterThanOrEqual(expectedKeys.length);
    });
  });

  describe('ChartConfigPropsSchema defaults', () => {
    it('should create valid defaults when parsing empty object', () => {
      const result = ChartConfigPropsSchema.parse({});

      expect(result).toMatchObject({
        selectedChartType: 'table',
        columnSettings: {},
        columnLabelFormats: {},
        colors: DEFAULT_CHART_THEME,
        showLegend: null,
        gridLines: true,
        goalLines: [],
        trendlines: [],
        disableTooltip: false,
      });
    });

    it('should override defaults when values are provided', () => {
      const customConfig = {
        selectedChartType: 'bar' as const,
        gridLines: false,
        colors: ['#FF0000', '#00FF00'],
      };

      const result = ChartConfigPropsSchema.parse(customConfig);

      expect(result.selectedChartType).toBe('bar');
      expect(result.gridLines).toBe(false);
      expect(result.colors).toEqual(['#FF0000', '#00FF00']);
      // Other defaults should remain
      expect(result.showLegend).toBeNull();
      expect(result.disableTooltip).toBe(false);
    });

    it('should handle partial configurations correctly', () => {
      const partialConfig = {
        showLegend: true,
        disableTooltip: true,
      };

      const result = ChartConfigPropsSchema.parse(partialConfig);

      expect(result.showLegend).toBe(true);
      expect(result.disableTooltip).toBe(true);
      // Defaults should be applied for missing fields
      expect(result.selectedChartType).toBe('table');
      expect(result.colors).toEqual(DEFAULT_CHART_THEME);
    });

    it('should handle complex column configurations', () => {
      const configWithColumns = {
        columnSettings: {
          revenue: { showDataLabels: true, columnVisualization: 'line' as const },
          profit: { showDataLabels: false, barRoundness: 12 },
        },
        columnLabelFormats: {
          revenue: { prefix: '$', suffix: 'M' },
        },
      };

      const result = ChartConfigPropsSchema.parse(configWithColumns);

      // Check that our custom settings are preserved
      expect(result.columnSettings.revenue).toMatchObject({
        showDataLabels: true,
        columnVisualization: 'line',
      });
      expect(result.columnSettings.profit).toMatchObject({
        showDataLabels: false,
        barRoundness: 12,
      });

      // Check that defaults are applied to column settings
      expect(result.columnSettings.revenue.lineWidth).toBe(2);
      expect(result.columnSettings.profit.columnVisualization).toBe('bar');

      expect(result.columnLabelFormats.revenue).toMatchObject({
        prefix: '$',
        suffix: 'M',
      });
    });
  });

  describe('Type safety', () => {
    it('should maintain type safety for DEFAULT_CHART_CONFIG', () => {
      // This is a compile-time test - if it compiles, it passes
      const config: ChartConfigProps = DEFAULT_CHART_CONFIG;

      // Test that we can access typed properties
      const chartType: ChartConfigProps['selectedChartType'] = config.selectedChartType;
      const colors: string[] = config.colors;
      const showLegend: boolean | null = config.showLegend;

      expect(chartType).toBeDefined();
      expect(colors).toBeDefined();
      expect(showLegend).toBeDefined();
    });

    it('should ensure DEFAULT_CHART_CONFIG_ENTRIES maintains proper typing', () => {
      // Verify entries can be used in typed contexts
      for (const [key, value] of DEFAULT_CHART_CONFIG_ENTRIES) {
        expect(typeof key).toBe('string');
        expect(value).toBeDefined();
      }

      // Verify reconstruction maintains type
      const reconstructed: Record<string, unknown> = Object.fromEntries(
        DEFAULT_CHART_CONFIG_ENTRIES
      );
      expect(reconstructed).toBeDefined();
    });
  });
});
