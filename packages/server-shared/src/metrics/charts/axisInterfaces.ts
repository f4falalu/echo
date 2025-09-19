import { z } from 'zod';

export const ColorBySchema = z
  .object({
    //will use the values from the column to assign colors to the bars or lines
    columnId: z.string().nullable().optional(),
    overrideColorByValue: z
      .object({
        //the value and the color to assign to the value
        value: z.string(),
      })
      .nullable()
      .optional(),
  })
  .nullable()
  .default(null);

export const BarAndLineAxisSchema = z
  .object({
    // the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
    x: z.array(z.string()).default([]),
    // the column ids to use for the y axis.
    y: z.array(z.string()).default([]),
    // the column ids to use for the category axis. If multiple column ids are provided, they will be grouped together. THE LLM SHOULD NEVER SET MULTIPLE CATEGORY COLUMNS. ONLY THE USER CAN SET THIS.
    category: z.array(z.string()).default([]),
    // if null the y axis will automatically be used, the y axis will be used for the tooltip.
    tooltip: z.nullable(z.array(z.string())).default(null),
    //if the user wants to override the color by value
    colorBy: ColorBySchema,
  })
  .default({
    x: [],
    y: [],
    category: [],
    tooltip: null,
    colorBy: null,
  });

export const ScatterAxisSchema = z
  .object({
    // the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
    x: z.array(z.string()).default([]),
    // the column ids to use for the y axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
    y: z.array(z.string()).default([]),
    // the column ids to use for the category axis. If multiple column ids are provided, they will be grouped together. THE LLM SHOULD NEVER SET MULTIPLE CATEGORY COLUMNS. ONLY THE USER CAN SET THIS.
    category: z.array(z.string()).default([]),
    // the column id to use for the size range of the dots. ONLY one column id should be provided.
    size: z.tuple([z.string()]).or(z.array(z.string()).length(0)).default([]),
    // if null the y axis will automatically be used, the y axis will be used for the tooltip.
    tooltip: z.nullable(z.array(z.string())).default(null),
    //if the user wants to override the color by value
    colorBy: ColorBySchema,
  })
  .default({
    x: [],
    y: [],
    size: [],
    category: [],
    tooltip: null,
    colorBy: null,
  });

export const ComboChartAxisSchema = z
  .object({
    // the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
    x: z.array(z.string()).default([]),
    // the column ids to use for the y axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple y axis columns. Only the user can set this.
    y: z.array(z.string()).default([]),
    // the column ids to use for the right y axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple y axis columns. Only the user can set this.
    y2: z.array(z.string()).default([]),
    // the column ids to use for the category axis. If multiple column ids are provided, they will be grouped together. THE LLM SHOULD NEVER SET MULTIPLE CATEGORY COLUMNS. ONLY THE USER CAN SET THIS.
    category: z.array(z.string()).default([]),
    // if null the y axis will automatically be used, the y axis will be used for the tooltip.
    tooltip: z.nullable(z.array(z.string())).default(null),
    //if the user wants to override the color by value
    colorBy: ColorBySchema,
  })
  .default({
    x: [],
    y: [],
    y2: [],
    category: [],
    tooltip: null,
    colorBy: null,
  });

export const PieChartAxisSchema = z
  .object({
    // the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
    x: z.array(z.string()).default([]),
    // the column ids to use for the y axis. If multiple column ids are provided, they will appear as rings. The LLM should NEVER set multiple y axis columns. Only the user can set this.
    y: z.array(z.string()).default([]),
    // if null the y axis will automatically be used, the y axis will be used for the tooltip.
    tooltip: z.nullable(z.array(z.string())).default(null),
    //if the user wants to override the color by value
    colorBy: ColorBySchema,
  })
  .default({
    x: [],
    y: [],
    tooltip: null,
    colorBy: null,
  });

export const ChartEncodesSchema = z.union([
  BarAndLineAxisSchema,
  ScatterAxisSchema,
  PieChartAxisSchema,
  ComboChartAxisSchema,
]);

// Export inferred types
export type BarAndLineAxis = z.infer<typeof BarAndLineAxisSchema>;
export type ScatterAxis = z.infer<typeof ScatterAxisSchema>;
export type ComboChartAxis = z.infer<typeof ComboChartAxisSchema>;
export type PieChartAxis = z.infer<typeof PieChartAxisSchema>;
export type ChartEncodes = z.infer<typeof ChartEncodesSchema>;
export type ColorBy = z.infer<typeof ColorBySchema>;
