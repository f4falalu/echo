// chartjs-plugin-trendline.ts

import { Plugin, ChartType } from 'chart.js';
import { defaultLabelOptionConfig } from '../../../hooks/useChartSpecificOptions/labelOptionConfig';

/** The three trendline modes we support */
export type TrendlineType =
  | 'average'
  | 'linear_regression'
  | 'logarithmic_regression'
  | 'exponential_regression'
  | 'polynomial_regression'
  | 'min'
  | 'max'
  | 'median';

/** Options for the slope label */
export interface TrendlineLabelOptions {
  display?: boolean;
  /** Label text or a callback that receives the slope value and returns a string */
  text?:
    | string
    | ((d: {
        slope: number;
        minY: number;
        maxY: number;
        minX: number;
        maxX: number;
        averageY: number;
        medianY: number;
      }) => string);
  /** Whether to display the numeric value of the slope */
  offset?: number;
  percentage?: boolean;
  font?: {
    family?: string;
    size?: number;
    weight?: string | number;
  };
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number | { top?: number; bottom?: number; left?: number; right?: number };
  positionRatio?: number; // 0 = start, 0.5 = middle, 1 = end
}

/** The full set of options available on each dataset */
export interface TrendlineOptions {
  show?: boolean;
  /** Which regression to use */
  type: TrendlineType;

  /** Only used when type = 'polynomial' */
  polynomialOrder?: number;

  /** Extend the trendline to intercept if slope < 0 */
  projection?: boolean;

  /** Line width and dash style */
  width?: number;
  lineStyle?: 'solid' | 'dotted' | 'dashed' | 'dashdot';

  /** Gradient endpoints */
  colorMin?: string | null;
  colorMax?: string | null;

  /** Fill under the trendline (color or `true` for default) */
  fillColor?: string | boolean;

  /** Label styling */
  label?: TrendlineLabelOptions;
}

export type AggregateMultiple = TrendlineOptions & { yAxisKey: string; yAxisID: string };

/** Plugin-level options */
export interface TrendlinePluginOptions {
  /** Aggregate data points from all datasets into a single trendline */
  aggregateMultiple?: AggregateMultiple[];
}

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    trendline?: TrendlinePluginOptions;
  }

  interface ChartDatasetProperties<TType extends ChartType, TData> {
    trendline?: TrendlineOptions[];
  }
}

/** Minimal interface to fit points and predict y for any x */
abstract class BaseFitter {
  public minx = Infinity;
  public maxx = -Infinity;
  public maxY = -Infinity;
  public minY = Infinity;
  public averageY = 0;
  public medianY = 0;

  add(x: number, y: number) {
    this.addPoint(x, y);

    this.minx = Math.min(this.minx, x);
    this.maxx = Math.max(this.maxx, x);
  }

  protected abstract addPoint(x: number, y: number): void;
  abstract f(x: number): number;
}

/** 1st-order least squares */
class LinearFitter extends BaseFitter {
  private sumx = 0;
  private sumy = 0;
  private sumx2 = 0;
  private sumxy = 0;
  private count = 0;

  protected addPoint(x: number, y: number) {
    this.sumx += x;
    this.sumy += y;
    this.sumx2 += x * x;
    this.sumxy += x * y;
    this.count++;
  }

  private slope(): number {
    const denom = this.count * this.sumx2 - this.sumx * this.sumx;
    return (this.count * this.sumxy - this.sumx * this.sumy) / denom;
  }

  private intercept(): number {
    return (this.sumy - this.slope() * this.sumx) / this.count;
  }

  f(x: number): number {
    return this.slope() * x + this.intercept();
  }
}

/** Fit y = a + b·ln(x) */
class LogarithmicFitter extends BaseFitter {
  private lin = new LinearFitter();

  protected addPoint(x: number, y: number) {
    if (x > 0) {
      const lx = Math.log(x);
      this.lin.add(lx, y);
    }
  }

  f(x: number): number {
    if (x <= 0) return NaN;
    return this.lin.f(Math.log(x));
  }
}

/** n-degree polynomial via normal equations + Gaussian elimination */
class PolynomialFitter extends BaseFitter {
  private xs: number[] = [];
  private ys: number[] = [];
  private coeffs: number[] | null = null;

  constructor(private order: number) {
    super();
  }

  protected addPoint(x: number, y: number) {
    this.xs.push(x);
    this.ys.push(y);
    this.coeffs = null; // invalidate previous fit
  }

  /** Build and solve the normal equations A·a = b */
  private fit(): void {
    const m = this.order;
    const n = this.xs.length;
    // build matrix A (size (m+1)x(m+1)) of ∑ x^(i+j)
    const A: number[][] = Array.from({ length: m + 1 }, () => Array(m + 1).fill(0));
    const b: number[] = Array(m + 1).fill(0);

    for (let i = 0; i <= m; i++) {
      for (let j = 0; j <= m; j++) {
        A[i][j] = this.xs.reduce((s, x) => s + Math.pow(x, i + j), 0);
      }
      b[i] = this.ys.reduce((s, y, idx) => s + y * Math.pow(this.xs[idx], i), 0);
    }

    // Gaussian elimination (in-place)
    for (let k = 0; k <= m; k++) {
      // pivot
      let pivot = A[k][k];
      if (Math.abs(pivot) < 1e-12) continue;
      for (let j = k; j <= m; j++) A[k][j] /= pivot;
      b[k] /= pivot;

      // eliminate below
      for (let i = k + 1; i <= m; i++) {
        const factor = A[i][k];
        for (let j = k; j <= m; j++) {
          A[i][j] -= factor * A[k][j];
        }
        b[i] -= factor * b[k];
      }
    }

    // back-substitute
    const a = Array(m + 1).fill(0);
    for (let i = m; i >= 0; i--) {
      let sum = b[i];
      for (let j = i + 1; j <= m; j++) sum -= A[i][j] * a[j];
      a[i] = sum;
    }
    this.coeffs = a;
  }

  f(x: number): number {
    if (!this.coeffs) this.fit();
    return this.coeffs!.reduce((sum, c, idx) => sum + c * Math.pow(x, idx), 0);
  }
}

/** Fit y = a·e^(b·x) */
class ExponentialFitter extends BaseFitter {
  private lin = new LinearFitter();

  protected addPoint(x: number, y: number) {
    if (y > 0) {
      const ly = Math.log(y);
      this.lin.add(x, ly);
    }
  }

  f(x: number): number {
    return Math.exp(this.lin.f(x));
  }
}

/** Statistical fitter that returns a constant y value (average) */
class AverageFitter extends BaseFitter {
  private sum = 0;
  private count = 0;

  protected addPoint(x: number, y: number) {
    this.sum += y;
    this.count++;
  }

  f(x: number): number {
    this.averageY = this.count > 0 ? this.sum / this.count : 0;
    return this.averageY;
  }
}

/** Statistical fitter that returns the maximum y value */
class MaxFitter extends BaseFitter {
  protected addPoint(x: number, y: number) {
    this.maxY = Math.max(this.maxY, y);
  }

  f(x: number): number {
    return this.maxY;
  }
}

/** Statistical fitter that returns the minimum y value */
class MinFitter extends BaseFitter {
  protected addPoint(x: number, y: number) {
    this.minY = Math.min(this.minY, y);
  }

  f(x: number): number {
    return this.minY;
  }
}

/** Statistical fitter that returns the median y value */
class MedianFitter extends BaseFitter {
  private values: number[] = [];

  protected addPoint(x: number, y: number) {
    this.values.push(y);
  }

  f(x: number): number {
    if (this.values.length === 0) return 0;

    // Sort values for median calculation
    const sorted = [...this.values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    // If even number of elements, average the middle two
    if (sorted.length % 2 === 0) {
      const value = (sorted[mid - 1] + sorted[mid]) / 2;
      this.medianY = value;
      return value;
    }
    // If odd, return the middle element
    const value = sorted[mid];
    this.medianY = value;
    return value;
  }
}

// Create appropriate fitter based on options
const createFitter = (opts: TrendlineOptions): BaseFitter => {
  switch (opts.type) {
    case 'polynomial_regression':
      return new PolynomialFitter(opts.polynomialOrder ?? 2);
    case 'logarithmic_regression':
      return new LogarithmicFitter();
    case 'exponential_regression':
      return new ExponentialFitter();
    case 'average':
      return new AverageFitter();
    case 'max':
      return new MaxFitter();
    case 'min':
      return new MinFitter();
    case 'median':
      return new MedianFitter();
    case 'linear_regression':
    default:
      return new LinearFitter();
  }
};

// Process padding options
const processPadding = (
  labelPadding:
    | number
    | { top?: number; bottom?: number; left?: number; right?: number }
    | undefined
): { top: number; right: number; bottom: number; left: number } => {
  const defaultPadding = defaultLabelOptionConfig.padding;

  if (typeof labelPadding === 'number') {
    return { top: labelPadding, right: labelPadding, bottom: labelPadding, left: labelPadding };
  } else if (labelPadding) {
    return {
      top: labelPadding.top ?? defaultPadding.top,
      right: labelPadding.right ?? defaultPadding.right,
      bottom: labelPadding.bottom ?? defaultPadding.bottom,
      left: labelPadding.left ?? defaultPadding.left
    };
  }

  return {
    top: defaultPadding.top,
    right: defaultPadding.right,
    bottom: defaultPadding.bottom,
    left: defaultPadding.left
  };
};

// Set line style based on options
const setLineStyle = (ctx: CanvasRenderingContext2D, lineStyle?: string, lineWidth: number = 2) => {
  ctx.lineWidth = lineWidth;

  switch (lineStyle) {
    case 'dotted':
      ctx.setLineDash([lineWidth, lineWidth * 2]);
      break;
    case 'dashed':
      ctx.setLineDash([lineWidth * 4, lineWidth * 2]);
      break;
    case 'dashdot':
      ctx.setLineDash([lineWidth * 4, lineWidth * 2, 1, lineWidth * 2]);
      break;
    default:
      ctx.setLineDash([]);
  }
};

// Draw a label with background
const drawLabel = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: TrendlineLabelOptions
) => {
  // Apply defaults from defaultLabelOptionConfig
  const fontSize = options.font?.size ?? defaultLabelOptionConfig.font.size;
  const fontFamily = options.font?.family ?? 'sans-serif';
  const fontWeight = options.font?.weight ?? defaultLabelOptionConfig.font.weight;
  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const color = options.color ?? defaultLabelOptionConfig.color;
  const backgroundColor = options.backgroundColor ?? defaultLabelOptionConfig.backgroundColor;
  const borderColor = options.borderColor ?? defaultLabelOptionConfig.borderColor;
  const borderWidth = options.borderWidth ?? defaultLabelOptionConfig.borderWidth + 0.2;

  // Apply a scaling factor to make the border radius less intense
  const borderRadiusScale = 0.55; // Reduce to 40% of original value
  const baseBorderRadius = options.borderRadius ?? defaultLabelOptionConfig.borderRadius;
  const borderRadius = Math.max(2, Math.floor(baseBorderRadius * borderRadiusScale)); // Ensure minimum of 2px

  const padding = processPadding(options.padding);

  // Text measurement
  ctx.font = font;
  const textMetrics = ctx.measureText(text);
  const textHeight = fontSize;

  // Background calculation
  const rectWidth = textMetrics.width + padding.left + padding.right;
  const rectHeight = textHeight + padding.top + padding.bottom;

  // Center the rectangle around the target point
  const rectX = x - rectWidth / 2;
  const rectY = y - rectHeight / 2;

  // Draw background rect
  ctx.save();
  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;

    ctx.beginPath();
    ctx.moveTo(rectX + borderRadius, rectY);
    ctx.lineTo(rectX + rectWidth - borderRadius, rectY);
    ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + borderRadius);
    ctx.lineTo(rectX + rectWidth, rectY + rectHeight - borderRadius);
    ctx.quadraticCurveTo(
      rectX + rectWidth,
      rectY + rectHeight,
      rectX + rectWidth - borderRadius,
      rectY + rectHeight
    );
    ctx.lineTo(rectX + borderRadius, rectY + rectHeight);
    ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius);
    ctx.lineTo(rectX, rectY + borderRadius);
    ctx.quadraticCurveTo(rectX, rectY, rectX + borderRadius, rectY);
    ctx.closePath();

    ctx.fill();
    if (borderWidth > 0 && borderColor && borderColor !== 'transparent') {
      ctx.setLineDash([]);
      ctx.stroke();
    }
  }

  // Draw text
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const textX = rectX + padding.left;
  const textY = rectY + padding.top;

  ctx.fillText(text, textX, textY);
  ctx.restore();
};

// Draw curved or straight line path
const drawLinePath = (
  ctx: CanvasRenderingContext2D,
  xScale: any,
  yScale: any,
  fitter: BaseFitter,
  minX: number,
  maxX: number,
  lineType: TrendlineType
) => {
  const x1 = xScale.getPixelForValue(minX);
  const y1 = yScale.getPixelForValue(fitter.f(minX));

  if (
    lineType === 'linear_regression' ||
    lineType === 'average' ||
    lineType === 'max' ||
    lineType === 'min' ||
    lineType === 'median'
  ) {
    // Simple straight line for linear and statistical trendlines
    const x2 = xScale.getPixelForValue(maxX);
    const y2 = yScale.getPixelForValue(fitter.f(maxX));

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  } else {
    // For non-linear trendlines, use multiple points for a smooth curve
    const segments = 80;
    const xStep = (maxX - minX) / segments;

    ctx.moveTo(x1, y1);

    for (let i = 1; i <= segments; i++) {
      const currX = minX + i * xStep;
      const xPos = xScale.getPixelForValue(currX);
      const yPos = yScale.getPixelForValue(fitter.f(currX));

      // Skip any NaN or infinite values that might occur
      if (!isNaN(yPos) && isFinite(yPos)) {
        ctx.lineTo(xPos, yPos);
      }
    }
  }
};

// Fill area under the trendline
const fillUnderLine = (
  ctx: CanvasRenderingContext2D,
  xScale: any,
  yScale: any,
  fitter: BaseFitter,
  minX: number,
  maxX: number,
  lineType: TrendlineType,
  fillStyle: string,
  chartBottom: number
) => {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();

  drawLinePath(ctx, xScale, yScale, fitter, minX, maxX, lineType);

  // Complete the polygon for filling
  const x2 = xScale.getPixelForValue(maxX);
  const x1 = xScale.getPixelForValue(minX);

  ctx.lineTo(x2, chartBottom);
  ctx.lineTo(x1, chartBottom);
  ctx.closePath();
  ctx.fill();
};

// Process data points from a dataset
const addDataPointsToFitter = (dataset: any, fitter: BaseFitter, yAxisID?: string) => {
  dataset.data.forEach((point: any, i: number) => {
    const x = point['x'] ?? i;
    const y = point[yAxisID ?? dataset.yAxisID ?? 'y'] ?? point;
    if (typeof x === 'number' && typeof y === 'number') {
      fitter.add(x, y);
    }
  });
};

const trendlinePlugin: Plugin<'line'> = {
  id: 'chartjs-plugin-trendline-ts',

  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    const pluginOptions = chart.options.plugins?.trendline as TrendlinePluginOptions | undefined;
    const { chartArea } = chart;

    // get horizontal (x) and vertical (y) scales
    const xScale = Object.values(chart.scales).find((s) => s.isHorizontal())!;
    const yScale = Object.values(chart.scales).find((s) => !s.isHorizontal())!;

    // Track label positions to prevent overlap
    const labelPositions: Array<{ x: number; y: number; width: number; height: number }> = [];

    // Store all label drawing operations for later execution (to ensure higher z-index)
    const labelDrawingQueue: Array<{
      ctx: CanvasRenderingContext2D;
      text: string;
      x: number;
      y: number;
      opts: TrendlineLabelOptions;
    }> = [];

    // Check if we should create an aggregated trendline
    if (pluginOptions?.aggregateMultiple && pluginOptions.aggregateMultiple.length > 0) {
      // Process each aggregate trendline configuration
      for (const aggregateConfig of pluginOptions.aggregateMultiple) {
        const yAxisAggregateKey = aggregateConfig.yAxisKey;
        const yAxisID = aggregateConfig.yAxisID;

        // Find datasets that match the yAxisKey for this aggregation
        const datasetsWithTrendline = chart.data.datasets.filter(
          (ds) => ds.data.length >= 2 && ds.yAxisKey === yAxisAggregateKey
        );

        if (datasetsWithTrendline.length > 0) {
          // Get the first trendline options to use as default for aggregated trendline
          const firstDatasetWithTrendline = datasetsWithTrendline[0];

          // Create fitter based on the aggregate config
          const fitter = createFitter(aggregateConfig);

          // Collect all data points from all datasets that match this yAxisKey
          for (const dataset of datasetsWithTrendline) {
            addDataPointsToFitter(dataset, fitter, yAxisID);
          }

          // Draw the aggregated trendline if we have valid data points
          if (fitter.minx !== Infinity && fitter.maxx !== -Infinity) {
            const defaultColor =
              (firstDatasetWithTrendline.borderColor as string) ?? 'rgba(0,0,0,0.3)';
            drawTrendlinePath(
              ctx,
              chartArea,
              xScale,
              yScale,
              fitter,
              aggregateConfig,
              defaultColor
            );

            // Queue label for later drawing if needed
            if (aggregateConfig.label?.display) {
              queueTrendlineLabel(
                ctx,
                xScale,
                yScale,
                fitter,
                aggregateConfig,
                labelPositions,
                labelDrawingQueue
              );
            }
          }
        }
      }
    }

    // Original behavior - draw individual trendlines for each dataset
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const trendlineOptions = dataset.trendline;
      if (!trendlineOptions || dataset.data.length < 2) {
        return;
      }

      // Convert to array if it's a single object for backward compatibility
      const trendlineArray = Array.isArray(trendlineOptions)
        ? trendlineOptions
        : [trendlineOptions];

      // Process each trendline option
      trendlineArray.forEach((opts, trendlineIndex) => {
        if (!opts || !opts.type || !opts.show) return;

        // Create the appropriate fitter
        const fitter = createFitter(opts);

        // Add all data points to the fitter
        addDataPointsToFitter(dataset, fitter);

        console.log(fitter, dataset, chart);

        // Skip if no valid points were added
        if (fitter.minx === Infinity || fitter.maxx === -Infinity) {
          return;
        }

        // For exponential trendlines, ensure we have valid y values
        if (opts.type === 'exponential_regression') {
          // Check if we have valid data (positive y values)
          const hasValidPoints = dataset.data.some((point: any) => {
            const y = point[dataset.yAxisID ?? 'y'] ?? point;
            return typeof y === 'number' && y > 0;
          });

          if (!hasValidPoints) {
            console.warn('Exponential trendline requires positive y values');
            return;
          }
        }

        const defaultColor = (dataset.borderColor as string) ?? 'rgba(0,0,0,0.3)';

        // Draw only the trendline first (not labels)
        drawTrendlinePath(ctx, chartArea, xScale, yScale, fitter, opts, defaultColor);

        // Queue label for later drawing if needed
        if (opts.label?.display) {
          const labelIndices = { datasetIndex, trendlineIndex };
          queueTrendlineLabel(
            ctx,
            xScale,
            yScale,
            fitter,
            opts,
            labelPositions,
            labelDrawingQueue,
            labelIndices
          );
        }
      });
    });

    // After all trendlines are drawn, draw all labels on top
    labelDrawingQueue.forEach((item) => {
      drawLabel(item.ctx, item.text, item.x, item.y, item.opts);
    });
  }
};

// Helper function to check if two rectangles overlap
const doRectsOverlap = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

// Helper function to queue a label for later drawing
const queueTrendlineLabel = (
  ctx: CanvasRenderingContext2D,
  xScale: any,
  yScale: any,
  fitter: BaseFitter,
  opts: TrendlineOptions,
  labelPositions: Array<{ x: number; y: number; width: number; height: number }> = [],
  labelDrawingQueue: Array<{
    ctx: CanvasRenderingContext2D;
    text: string;
    x: number;
    y: number;
    opts: TrendlineLabelOptions;
  }>,
  labelIndices?: { datasetIndex: number; trendlineIndex: number }
) => {
  if (!opts.label?.display) return;

  let minX = opts.projection ? (xScale.min as number) : fitter.minx;
  const maxX = opts.projection ? (xScale.max as number) : fitter.maxx;

  // For logarithmic trendlines, ensure minX is positive
  if (opts.type === 'logarithmic_regression' && minX <= 0) {
    // Use the smallest positive x value or 0.1 as a fallback
    minX = Math.max(0.1, fitter.minx);
  }

  const x1 = xScale.getPixelForValue(minX);
  const y1 = yScale.getPixelForValue(fitter.f(minX));
  const x2 = xScale.getPixelForValue(maxX);
  const y2 = yScale.getPixelForValue(fitter.f(maxX));

  const lbl = opts.label;
  // compute slope (delta y / delta x)
  const slope = (fitter.f(maxX) - fitter.f(minX)) / (maxX - minX);
  const val = lbl.percentage ? `${(slope * 100).toFixed(2)}%` : slope.toFixed(2);

  // Handle text as either string or callback function
  let textContent: string;
  if (typeof lbl.text === 'function') {
    // Call the function with the slope value
    textContent = lbl.text({
      slope,
      minX,
      maxX,
      averageY: fitter.averageY,
      medianY: fitter.medianY,
      minY: fitter.minY,
      maxY: fitter.maxY
    });
  } else {
    // Use the string value or empty string if undefined
    textContent = lbl.text || '';
  }

  // Only add the value if displayValue is true and text doesn't already include it
  const labelText = `${textContent}`.trim();

  // Position along the trendline segment based on positionRatio
  const t = lbl.positionRatio ?? 0.85; // Default to 85% along the line
  const targetX = x1 + t * (x2 - x1);
  const targetY = y1 + t * (y2 - y1);

  // Apply base offset
  let offsetX = lbl.offset ?? 0;
  let offsetY = lbl.offset ?? 0;

  // Apply additional offsets based on dataset and trendline indices if provided
  if (labelIndices) {
    // Use dataset index and trendline index to create a staggered effect
    // The formula below creates an increasing offset for each label
    const baseOffset = 0; // Base offset in pixels
    const additionalOffset = baseOffset * (labelIndices.datasetIndex + labelIndices.trendlineIndex);
    offsetY -= additionalOffset;
  }

  const finalX = targetX + offsetX;
  const finalY = targetY - offsetY; // Y increases downwards, so subtract for upward offset

  // Measure text to calculate label size
  ctx.font = `${lbl.font?.weight ?? defaultLabelOptionConfig.font.weight} ${lbl.font?.size ?? defaultLabelOptionConfig.font.size}px ${lbl.font?.family ?? 'sans-serif'}`;
  const textMetrics = ctx.measureText(labelText);
  const padding = processPadding(lbl.padding);
  const labelWidth = textMetrics.width + padding.left + padding.right;
  const labelHeight =
    (lbl.font?.size ?? defaultLabelOptionConfig.font.size) + padding.top + padding.bottom;

  // Check for collisions with existing labels
  const labelRect = {
    x: finalX - labelWidth / 2,
    y: finalY - labelHeight / 2,
    width: labelWidth,
    height: labelHeight
  };

  // Check if this label overlaps with any existing labels
  for (const existingLabel of labelPositions) {
    if (doRectsOverlap(labelRect, existingLabel)) {
      // Label would overlap, so skip adding it
      return;
    }
  }

  // Store this label's position for future collision detection
  labelPositions.push(labelRect);

  // Queue the label for drawing later (to ensure it's on top of all lines)
  labelDrawingQueue.push({
    ctx,
    text: labelText,
    x: finalX,
    y: finalY,
    opts: lbl
  });
};

// Helper function to draw just the trendline path (without labels)
const drawTrendlinePath = (
  ctx: CanvasRenderingContext2D,
  chartArea: { bottom: number },
  xScale: any,
  yScale: any,
  fitter: BaseFitter,
  opts: TrendlineOptions,
  defaultColor: string
) => {
  // project if requested
  let minX = opts.projection ? (xScale.min as number) : fitter.minx;
  const maxX = opts.projection ? (xScale.max as number) : fitter.maxx;
  const yBottom = chartArea.bottom;

  // For logarithmic trendlines, ensure minX is positive
  if (opts.type === 'logarithmic_regression' && minX <= 0) {
    // Use the smallest positive x value or 0.1 as a fallback
    minX = Math.max(0.1, fitter.minx);
  }

  const x1 = xScale.getPixelForValue(minX);
  const y1 = yScale.getPixelForValue(fitter.f(minX));
  const x2 = xScale.getPixelForValue(maxX);
  const y2 = yScale.getPixelForValue(fitter.f(maxX));

  // Skip drawing if we have invalid coordinates
  if (isNaN(y1) || isNaN(y2)) {
    console.warn('Skipping trendline drawing due to invalid values');
    return;
  }

  // === DRAWING LOGIC ===
  ctx.save();

  // 1) stroke style: gradient or solid
  const cMin = opts.colorMin ?? defaultColor;
  const cMax = opts.colorMax ?? cMin;

  const stroke = ctx.createLinearGradient(x1, y1, x2, y2);
  stroke.addColorStop(0, cMin);
  stroke.addColorStop(1, cMax);
  ctx.strokeStyle = stroke;

  // 2) line width + dash
  setLineStyle(ctx, opts.lineStyle, opts.width);

  // 3) stroke the trendline
  ctx.beginPath();
  drawLinePath(ctx, xScale, yScale, fitter, minX, maxX, opts.type);
  ctx.stroke();

  // 4) optional fill under the line
  if (opts.fillColor) {
    const fillColor = opts.fillColor === true ? cMin : opts.fillColor;
    fillUnderLine(ctx, xScale, yScale, fitter, minX, maxX, opts.type, fillColor, yBottom);
  }

  // cleanup
  ctx.restore();
};

export default trendlinePlugin;
