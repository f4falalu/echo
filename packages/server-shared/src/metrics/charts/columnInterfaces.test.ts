import { describe, expect, it } from 'vitest';
import {
  BarColumnSettingsSchema,
  ColumnSettingsSchema,
  DEFAULT_COLUMN_SETTINGS,
  DotColumnSettingsSchema,
  LineColumnSettingsSchema,
} from './columnInterfaces';

describe('ColumnSettingsSchema', () => {
  it('should apply all default values when parsing empty object', () => {
    const result = ColumnSettingsSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        showDataLabels: false,
        showDataLabelsAsPercentage: false,
        columnVisualization: 'bar',
        lineWidth: 2,
        lineStyle: 'line',
        lineType: 'normal',
        lineSymbolSize: 0,
        barRoundness: 8,
      });
    }
  });

  it('should match DEFAULT_COLUMN_SETTINGS', () => {
    const result = ColumnSettingsSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual(DEFAULT_COLUMN_SETTINGS);
    }
  });

  it('should apply nested defaults for boolean flags', () => {
    const result = ColumnSettingsSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.showDataLabels).toBe(false);
      expect(result.data.showDataLabelsAsPercentage).toBe(false);
    }
  });

  it('should apply nested defaults for visualization settings', () => {
    const result = ColumnSettingsSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.columnVisualization).toBe('bar');
      expect(result.data.lineWidth).toBe(2);
      expect(result.data.lineStyle).toBe('line');
      expect(result.data.lineType).toBe('normal');
      expect(result.data.lineSymbolSize).toBe(0);
      expect(result.data.barRoundness).toBe(8);
    }
  });

  it('should override defaults when values are provided', () => {
    const customSettings = {
      showDataLabels: true,
      columnVisualization: 'line',
      lineWidth: 5,
      barRoundness: 15,
    };

    const result = ColumnSettingsSchema.safeParse(customSettings);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.showDataLabels).toBe(true);
      expect(result.data.columnVisualization).toBe('line');
      expect(result.data.lineWidth).toBe(5);
      expect(result.data.barRoundness).toBe(15);
      // Defaults should be preserved for non-overridden fields
      expect(result.data.showDataLabelsAsPercentage).toBe(false);
      expect(result.data.lineStyle).toBe('line');
      expect(result.data.lineType).toBe('normal');
      expect(result.data.lineSymbolSize).toBe(0);
    }
  });

  it('should handle partial overrides for line settings', () => {
    const lineSettings = {
      columnVisualization: 'line',
      lineWidth: 3,
      lineType: 'smooth',
    };

    const result = ColumnSettingsSchema.safeParse(lineSettings);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.columnVisualization).toBe('line');
      expect(result.data.lineWidth).toBe(3);
      expect(result.data.lineType).toBe('smooth');
      // Other line defaults should be preserved
      expect(result.data.lineStyle).toBe('line');
      expect(result.data.lineSymbolSize).toBe(0);
      // Non-line defaults should also be preserved
      expect(result.data.barRoundness).toBe(8);
    }
  });

  it('should handle partial overrides for bar settings', () => {
    const barSettings = {
      columnVisualization: 'bar',
      barRoundness: 20,
      showDataLabels: true,
    };

    const result = ColumnSettingsSchema.safeParse(barSettings);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.columnVisualization).toBe('bar');
      expect(result.data.barRoundness).toBe(20);
      expect(result.data.showDataLabels).toBe(true);
      // Other defaults should be preserved
      expect(result.data.showDataLabelsAsPercentage).toBe(false);
      expect(result.data.lineWidth).toBe(2);
    }
  });

  it('should handle dot visualization settings', () => {
    const dotSettings = {
      columnVisualization: 'dot',
      lineSymbolSize: 25,
    };

    const result = ColumnSettingsSchema.safeParse(dotSettings);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.columnVisualization).toBe('dot');
      expect(result.data.lineSymbolSize).toBe(25);
      // All other defaults should be preserved
      expect(result.data.showDataLabels).toBe(false);
      expect(result.data.lineWidth).toBe(2);
      expect(result.data.barRoundness).toBe(8);
    }
  });

  it('should validate line width constraints', () => {
    const invalidLineWidth = {
      lineWidth: 25, // exceeds max of 20
    };

    const result = ColumnSettingsSchema.safeParse(invalidLineWidth);
    expect(result.success).toBe(false);
  });

  it('should validate bar roundness constraints', () => {
    const invalidBarRoundness = {
      barRoundness: 60, // exceeds max of 50
    };

    const result = ColumnSettingsSchema.safeParse(invalidBarRoundness);
    expect(result.success).toBe(false);
  });

  it('should validate symbol size constraints', () => {
    const invalidSymbolSize = {
      lineSymbolSize: 60, // exceeds max of 50
    };

    const result = ColumnSettingsSchema.safeParse(invalidSymbolSize);
    expect(result.success).toBe(false);
  });
});

describe('LineColumnSettingsSchema', () => {
  it('should apply default values for line-specific settings', () => {
    const result = LineColumnSettingsSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        lineWidth: 2,
        lineStyle: 'line',
        lineType: 'normal',
        lineSymbolSize: 0,
      });
    }
  });

  it('should handle line style variations', () => {
    const areaLine = {
      lineStyle: 'area',
      lineType: 'step',
      lineSymbolSize: 5,
    };

    const result = LineColumnSettingsSchema.safeParse(areaLine);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.lineStyle).toBe('area');
      expect(result.data.lineType).toBe('step');
      expect(result.data.lineSymbolSize).toBe(5);
      expect(result.data.lineWidth).toBe(2); // Default preserved
    }
  });

  it('should validate line width range', () => {
    const validLineWidths = [1, 10, 20];
    const invalidLineWidths = [0, 21];

    for (const width of validLineWidths) {
      const result = LineColumnSettingsSchema.safeParse({ lineWidth: width });
      expect(result.success).toBe(true);
    }

    for (const width of invalidLineWidths) {
      const result = LineColumnSettingsSchema.safeParse({ lineWidth: width });
      expect(result.success).toBe(false);
    }
  });
});

describe('BarColumnSettingsSchema', () => {
  it('should apply default values for bar-specific settings', () => {
    const result = BarColumnSettingsSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        barRoundness: 8,
      });
    }
  });

  it('should handle different roundness values', () => {
    const roundedBar = {
      barRoundness: 25,
    };

    const result = BarColumnSettingsSchema.safeParse(roundedBar);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.barRoundness).toBe(25);
    }
  });

  it('should validate bar roundness range', () => {
    const validRoundness = [0, 25, 50];
    const invalidRoundness = [-1, 51];

    for (const roundness of validRoundness) {
      const result = BarColumnSettingsSchema.safeParse({ barRoundness: roundness });
      expect(result.success).toBe(true);
    }

    for (const roundness of invalidRoundness) {
      const result = BarColumnSettingsSchema.safeParse({ barRoundness: roundness });
      expect(result.success).toBe(false);
    }
  });
});

describe('DotColumnSettingsSchema', () => {
  it('should apply default values for dot-specific settings', () => {
    const result = DotColumnSettingsSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        lineSymbolSize: 10,
      });
    }
  });

  it('should handle different dot sizes', () => {
    const largeDot = {
      lineSymbolSize: 30,
    };

    const result = DotColumnSettingsSchema.safeParse(largeDot);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.lineSymbolSize).toBe(30);
    }
  });

  it('should validate dot symbol size range', () => {
    const validSizes = [1, 25, 50];
    const invalidSizes = [0, 51];

    for (const size of validSizes) {
      const result = DotColumnSettingsSchema.safeParse({ lineSymbolSize: size });
      expect(result.success).toBe(true);
    }

    for (const size of invalidSizes) {
      const result = DotColumnSettingsSchema.safeParse({ lineSymbolSize: size });
      expect(result.success).toBe(false);
    }
  });
});

describe('DEFAULT_COLUMN_SETTINGS', () => {
  it('should be a valid ColumnSettings object', () => {
    const result = ColumnSettingsSchema.safeParse(DEFAULT_COLUMN_SETTINGS);
    expect(result.success).toBe(true);
  });

  it('should contain all expected default values', () => {
    expect(DEFAULT_COLUMN_SETTINGS).toEqual({
      showDataLabels: false,
      showDataLabelsAsPercentage: false,
      columnVisualization: 'bar',
      lineWidth: 2,
      lineStyle: 'line',
      lineType: 'normal',
      lineSymbolSize: 0,
      barRoundness: 8,
    });
  });

  it('should have correct types for all properties', () => {
    expect(typeof DEFAULT_COLUMN_SETTINGS.showDataLabels).toBe('boolean');
    expect(typeof DEFAULT_COLUMN_SETTINGS.showDataLabelsAsPercentage).toBe('boolean');
    expect(typeof DEFAULT_COLUMN_SETTINGS.columnVisualization).toBe('string');
    expect(typeof DEFAULT_COLUMN_SETTINGS.lineWidth).toBe('number');
    expect(typeof DEFAULT_COLUMN_SETTINGS.lineStyle).toBe('string');
    expect(typeof DEFAULT_COLUMN_SETTINGS.lineType).toBe('string');
    expect(typeof DEFAULT_COLUMN_SETTINGS.lineSymbolSize).toBe('number');
    expect(typeof DEFAULT_COLUMN_SETTINGS.barRoundness).toBe('number');
  });
});

describe('Nested defaults interaction', () => {
  it('should properly combine defaults from all visualization types', () => {
    const result = ColumnSettingsSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      // Should have defaults from line, bar, and dot settings
      expect(result.data.lineWidth).toBe(2); // From LineColumnSettings
      expect(result.data.barRoundness).toBe(8); // From BarColumnSettings
      expect(result.data.lineSymbolSize).toBe(0); // From main schema (different from DotColumnSettings default of 10)
    }
  });

  it('should allow overriding specific visualization settings while preserving others', () => {
    const mixedSettings = {
      columnVisualization: 'line',
      lineWidth: 4,
      barRoundness: 12, // This should still be applied even though columnVisualization is 'line'
    };

    const result = ColumnSettingsSchema.safeParse(mixedSettings);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.columnVisualization).toBe('line');
      expect(result.data.lineWidth).toBe(4);
      expect(result.data.barRoundness).toBe(12);
      // Other defaults should be preserved
      expect(result.data.lineStyle).toBe('line');
      expect(result.data.showDataLabels).toBe(false);
    }
  });
});
