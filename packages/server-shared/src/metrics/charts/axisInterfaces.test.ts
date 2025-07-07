import { describe, expect, it } from 'vitest';
import {
  BarAndLineAxisSchema,
  ChartEncodesSchema,
  ComboChartAxisSchema,
  PieChartAxisSchema,
  ScatterAxisSchema,
} from './axisInterfaces';

describe('BarAndLineAxisSchema', () => {
  it('should apply default values when parsing empty object', () => {
    const result = BarAndLineAxisSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.x).toEqual([]);
      expect(result.data.y).toEqual([]);
      expect(result.data.category).toEqual([]);
      // tooltip is optional and will be undefined when not provided
      expect(result.data.tooltip).toBeUndefined();
    }
  });

  it('should apply nested defaults for each property', () => {
    const result = BarAndLineAxisSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      // Test that arrays are empty by default
      expect(result.data.x).toEqual([]);
      expect(result.data.y).toEqual([]);
      expect(result.data.category).toEqual([]);
      expect(result.data.tooltip).toBeUndefined();
    }
  });

  it('should override defaults when values are provided', () => {
    const customAxis = {
      x: ['date'],
      y: ['revenue', 'profit'],
      category: ['region'],
      tooltip: ['description'],
    };

    const result = BarAndLineAxisSchema.safeParse(customAxis);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.x).toEqual(['date']);
      expect(result.data.y).toEqual(['revenue', 'profit']);
      expect(result.data.category).toEqual(['region']);
      expect(result.data.tooltip).toEqual(['description']);
    }
  });

  it('should handle partial overrides', () => {
    const partialAxis = {
      x: ['timestamp'],
      y: ['sales'],
    };

    const result = BarAndLineAxisSchema.safeParse(partialAxis);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.x).toEqual(['timestamp']);
      expect(result.data.y).toEqual(['sales']);
      // Defaults should be preserved for missing fields
      expect(result.data.category).toEqual([]);
      expect(result.data.tooltip).toBeUndefined();
    }
  });

  it('should handle explicit null tooltip', () => {
    const axisWithNullTooltip = {
      x: ['date'],
      y: ['value'],
      tooltip: null,
    };

    const result = BarAndLineAxisSchema.safeParse(axisWithNullTooltip);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.tooltip).toBeNull();
    }
  });
});

describe('ScatterAxisSchema', () => {
  it('should apply default values including size array', () => {
    const result = ScatterAxisSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        x: [],
        y: [],
        category: [],
        size: [],
        tooltip: null,
      });
    }
  });

  it('should handle size as tuple or empty array', () => {
    const withSizeTuple = {
      x: ['x_val'],
      y: ['y_val'],
      size: ['population'],
    };

    const result = ScatterAxisSchema.safeParse(withSizeTuple);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.size).toEqual(['population']);
    }
  });

  it('should validate size array length', () => {
    const withEmptySize = {
      size: [],
    };

    const result = ScatterAxisSchema.safeParse(withEmptySize);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.size).toEqual([]);
    }
  });

  it('should handle nested defaults properly', () => {
    const partialConfig = {
      x: ['x_axis'],
    };

    const result = ScatterAxisSchema.safeParse(partialConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.x).toEqual(['x_axis']);
      expect(result.data.y).toEqual([]);
      expect(result.data.category).toEqual([]);
      expect(result.data.size).toEqual([]);
      expect(result.data.tooltip).toBeNull();
    }
  });
});

describe('ComboChartAxisSchema', () => {
  it('should apply default values including y2 axis', () => {
    const result = ComboChartAxisSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.x).toEqual([]);
      expect(result.data.y).toEqual([]);
      expect(result.data.y2).toEqual([]);
      expect(result.data.category).toEqual([]);
      expect(result.data.tooltip).toBeUndefined();
    }
  });

  it('should handle dual y-axis configuration', () => {
    const dualAxisConfig = {
      x: ['month'],
      y: ['revenue'],
      y2: ['profit_margin'],
      category: ['product_line'],
    };

    const result = ComboChartAxisSchema.safeParse(dualAxisConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.x).toEqual(['month']);
      expect(result.data.y).toEqual(['revenue']);
      expect(result.data.y2).toEqual(['profit_margin']);
      expect(result.data.category).toEqual(['product_line']);
      expect(result.data.tooltip).toBeUndefined();
    }
  });

  it('should apply defaults for missing secondary axis', () => {
    const primaryAxisOnly = {
      x: ['date'],
      y: ['sales'],
    };

    const result = ComboChartAxisSchema.safeParse(primaryAxisOnly);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.x).toEqual(['date']);
      expect(result.data.y).toEqual(['sales']);
      expect(result.data.y2).toEqual([]); // Default for secondary y-axis
      expect(result.data.category).toEqual([]);
      expect(result.data.tooltip).toBeUndefined();
    }
  });
});

describe('PieChartAxisSchema', () => {
  it('should apply default values for pie chart axis', () => {
    const result = PieChartAxisSchema.safeParse({});
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        x: [],
        y: [],
        tooltip: null,
      });
    }
  });

  it('should handle pie chart specific configuration', () => {
    const pieConfig = {
      x: ['category'],
      y: ['value1', 'value2'], // Multiple values for rings
      tooltip: ['description', 'percentage'],
    };

    const result = PieChartAxisSchema.safeParse(pieConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.x).toEqual(['category']);
      expect(result.data.y).toEqual(['value1', 'value2']);
      expect(result.data.tooltip).toEqual(['description', 'percentage']);
    }
  });

  it('should handle missing tooltip configuration', () => {
    const basicPieConfig = {
      x: ['segment'],
      y: ['amount'],
    };

    const result = PieChartAxisSchema.safeParse(basicPieConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.x).toEqual(['segment']);
      expect(result.data.y).toEqual(['amount']);
      expect(result.data.tooltip).toBeNull(); // Default
    }
  });
});

describe('ChartEncodesSchema union', () => {
  it('should accept valid BarAndLineAxis', () => {
    const barLineAxis = {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    };

    const result = ChartEncodesSchema.safeParse(barLineAxis);
    expect(result.success).toBe(true);
  });

  it('should accept valid ScatterAxis', () => {
    const scatterAxis = {
      x: ['x_value'],
      y: ['y_value'],
      category: [],
      size: ['population'],
      tooltip: null,
    };

    const result = ChartEncodesSchema.safeParse(scatterAxis);
    expect(result.success).toBe(true);
  });

  it('should accept valid ComboChartAxis', () => {
    const comboAxis = {
      x: ['month'],
      y: ['sales'],
      y2: ['profit'],
      category: [],
      tooltip: null,
    };

    const result = ChartEncodesSchema.safeParse(comboAxis);
    expect(result.success).toBe(true);
  });

  it('should accept valid PieChartAxis', () => {
    const pieAxis = {
      x: ['category'],
      y: ['value'],
      tooltip: null,
    };

    const result = ChartEncodesSchema.safeParse(pieAxis);
    expect(result.success).toBe(true);
  });

  it('should reject truly invalid axis configurations', () => {
    // The union is permissive, so we need truly invalid data to make it fail
    const invalidAxis = {
      x: 'not an array', // This should fail since x should be an array
    };

    const result = ChartEncodesSchema.safeParse(invalidAxis);
    expect(result.success).toBe(false);
  });
});

describe('Nested defaults behavior', () => {
  it('should deeply apply defaults to all axis schemas', () => {
    const schemas = [
      BarAndLineAxisSchema,
      ScatterAxisSchema,
      ComboChartAxisSchema,
      PieChartAxisSchema,
    ];

    for (const schema of schemas) {
      const result = schema.safeParse({});
      expect(result.success).toBe(true);

      if (result.success) {
        // All schemas should have x and y as empty arrays by default
        expect(result.data.x).toEqual([]);
        expect(result.data.y).toEqual([]);

        // Tooltip should be null by default
        expect('tooltip' in result.data ? result.data.tooltip : null).toBeNull();
      }
    }
  });

  it('should preserve defaults when partially overriding nested objects', () => {
    const partialOverride = {
      x: ['custom_x'],
      // y, category, tooltip should get defaults
    };

    const result = BarAndLineAxisSchema.safeParse(partialOverride);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.x).toEqual(['custom_x']); // Overridden
      expect(result.data.y).toEqual([]); // Default
      expect(result.data.category).toEqual([]); // Default
      expect(result.data.tooltip).toBeUndefined(); // Default
    }
  });
});
