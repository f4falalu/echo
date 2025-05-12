// chartjs-plugin-trendline.ts

import { Plugin, ChartType } from 'chart.js';
import { defaultLabelOptionConfig } from '../../hooks/useChartSpecificOptions/labelOptionConfig';

/** The three trendline modes we support */
export type TrendlineType = 'linear' | 'logarithmic' | 'polynomial' | 'exponential';

/** Options for the slope label */
export interface TrendlineLabelOptions {
  display?: boolean;
  text?: string;
  displayValue?: boolean;
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

defaultLabelOptionConfig;

/** The full set of options available on each dataset */
export interface TrendlineOptions {
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
  colorMin?: string;
  colorMax?: string;

  /** Fill under the trendline (color or `true` for default) */
  fillColor?: string | boolean;

  /** Label styling */
  label?: TrendlineLabelOptions;
}

type AggregateMultiple = TrendlineOptions & { yAxisKey: string; yAxisID: string };

/** Plugin-level options */
export interface TrendlinePluginOptions {
  /** Aggregate data points from all datasets into a single trendline */
  aggregateMultiple?: AggregateMultiple[];
}

// still in chartjs-plugin-trendline.ts

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    trendline?: TrendlinePluginOptions;
  }

  interface ChartDatasetProperties<TType extends ChartType, TData> {
    trendline?: TrendlineOptions;
  }
}

// chartjs-plugin-trendline.ts (continued)

/** Minimal interface to fit points and predict y for any x */
interface Fitter {
  /** add a data point */
  add(x: number, y: number): void;

  /** returns the fitted y-value */
  f(x: number): number;

  /** min and max of the x-domain we saw */
  minx: number;
  maxx: number;
}

/** 1st-order least squares */
class LinearFitter implements Fitter {
  private sumx = 0;
  private sumy = 0;
  private sumx2 = 0;
  private sumxy = 0;
  private count = 0;

  public minx = Infinity;
  public maxx = -Infinity;

  add(x: number, y: number) {
    this.sumx += x;
    this.sumy += y;
    this.sumx2 += x * x;
    this.sumxy += x * y;
    this.count++;

    this.minx = Math.min(this.minx, x);
    this.maxx = Math.max(this.maxx, x);
    console.log(x, y, this.minx, this.maxx);
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
class LogarithmicFitter implements Fitter {
  private lin = new LinearFitter();

  public minx = Infinity;
  public maxx = -Infinity;

  add(x: number, y: number) {
    if (x > 0) {
      const lx = Math.log(x);
      this.lin.add(lx, y);
      this.minx = Math.min(this.minx, x);
      this.maxx = Math.max(this.maxx, x);
    }
  }

  f(x: number): number {
    if (x <= 0) return NaN;
    return this.lin.f(Math.log(x));
  }
}

/** n-degree polynomial via normal equations + Gaussian elimination */
class PolynomialFitter implements Fitter {
  private xs: number[] = [];
  private ys: number[] = [];
  private coeffs: number[] | null = null;

  public minx = Infinity;
  public maxx = -Infinity;

  constructor(private order: number) {}

  add(x: number, y: number) {
    this.xs.push(x);
    this.ys.push(y);
    this.minx = Math.min(this.minx, x);
    this.maxx = Math.max(this.maxx, x);
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
class ExponentialFitter implements Fitter {
  private lin = new LinearFitter();

  public minx = Infinity;
  public maxx = -Infinity;

  add(x: number, y: number) {
    if (y > 0) {
      const ly = Math.log(y);
      this.lin.add(x, ly);
      this.minx = Math.min(this.minx, x);
      this.maxx = Math.max(this.maxx, x);
    }
  }

  f(x: number): number {
    return Math.exp(this.lin.f(x));
  }
}

// Helper function to draw a trendline
function drawTrendline(
  ctx: CanvasRenderingContext2D,
  chartArea: { bottom: number },
  xScale: any,
  yScale: any,
  fitter: Fitter,
  opts: TrendlineOptions,
  defaultColor: string
) {
  // project if requested
  let minX = opts.projection ? (xScale.min as number) : fitter.minx;
  const maxX = opts.projection ? (xScale.max as number) : fitter.maxx;
  const yBottom = chartArea.bottom;

  // For logarithmic trendlines, ensure minX is positive
  if (opts.type === 'logarithmic' && minX <= 0) {
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
  ctx.lineWidth = opts.width ?? 2;
  switch (opts.lineStyle) {
    case 'dotted':
      ctx.setLineDash([ctx.lineWidth, ctx.lineWidth * 2]);
      break;
    case 'dashed':
      ctx.setLineDash([ctx.lineWidth * 4, ctx.lineWidth * 2]);
      break;
    case 'dashdot':
      ctx.setLineDash([ctx.lineWidth * 4, ctx.lineWidth * 2, 1, ctx.lineWidth * 2]);
      break;
    default:
      ctx.setLineDash([]);
  }

  // 3) stroke the trendline
  ctx.beginPath();

  // Draw curves properly for non-linear trendlines
  if (opts.type === 'linear') {
    // Simple straight line for linear trendlines
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  } else {
    // For logarithmic and polynomial, use multiple points to create a smooth curve
    const segments = 100; // Number of line segments to create a smooth curve
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

  ctx.stroke();

  // 4) optional fill under the line
  if (opts.fillColor) {
    ctx.fillStyle = opts.fillColor === true ? cMin : opts.fillColor;
    ctx.beginPath();

    if (opts.type === 'linear') {
      // Simple polygon for linear trendlines
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2, yBottom);
      ctx.lineTo(x1, yBottom);
    } else {
      // For logarithmic and polynomial, create a curved filled area
      const segments = 100;
      const xStep = (maxX - minX) / segments;

      ctx.moveTo(x1, y1);

      // Draw the curve
      for (let i = 1; i <= segments; i++) {
        const currX = minX + i * xStep;
        const xPos = xScale.getPixelForValue(currX);
        const yPos = yScale.getPixelForValue(fitter.f(currX));

        if (!isNaN(yPos) && isFinite(yPos)) {
          ctx.lineTo(xPos, yPos);
        }
      }

      // Complete the polygon for filling
      ctx.lineTo(x2, yBottom);
      ctx.lineTo(x1, yBottom);
    }

    ctx.closePath();
    ctx.fill();
  }

  // 5) optional slope label
  if (opts.label?.display) {
    const lbl = opts.label;
    // compute slope (delta y / delta x)
    const slope = (fitter.f(maxX) - fitter.f(minX)) / (maxX - minX);
    const val = lbl.displayValue
      ? lbl.percentage
        ? `${(slope * 100).toFixed(2)}%`
        : slope.toFixed(2)
      : '';
    const text = [lbl.text, val].filter(Boolean).join(' ');

    // --- Apply Defaults from defaultLabelOptionConfig ---
    const fontSize = lbl.font?.size ?? defaultLabelOptionConfig.font.size;
    const fontFamily = lbl.font?.family ?? 'sans-serif'; // Consider using a theme variable if available
    const fontWeight = lbl.font?.weight ?? defaultLabelOptionConfig.font.weight;
    const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const color = lbl.color ?? defaultLabelOptionConfig.color;
    const backgroundColor = lbl.backgroundColor ?? defaultLabelOptionConfig.backgroundColor;
    const borderColor = lbl.borderColor ?? defaultLabelOptionConfig.borderColor;
    const borderWidth = lbl.borderWidth ?? defaultLabelOptionConfig.borderWidth;
    const borderRadius = lbl.borderRadius ?? defaultLabelOptionConfig.borderRadius;
    let padding: { top: number; right: number; bottom: number; left: number };
    const lblPadding = lbl.padding ?? defaultLabelOptionConfig.padding;
    if (typeof lblPadding === 'number') {
      padding = { top: lblPadding, right: lblPadding, bottom: lblPadding, left: lblPadding };
    } else {
      padding = {
        top: lblPadding?.top ?? defaultLabelOptionConfig.padding.top,
        right: lblPadding?.right ?? defaultLabelOptionConfig.padding.right,
        bottom: lblPadding?.bottom ?? defaultLabelOptionConfig.padding.bottom,
        left: lblPadding?.left ?? defaultLabelOptionConfig.padding.left
      };
    }

    // --- Text Measurement ---
    ctx.font = font;
    const textMetrics = ctx.measureText(text);
    // Using fontSize as an approximation for height, adjust if needed
    const textHeight = fontSize; // or textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;

    // --- Background Calculation ---
    const rectWidth = textMetrics.width + padding.left + padding.right;
    const rectHeight = textHeight + padding.top + padding.bottom;
    // Position along the trendline segment based on positionRatio
    const t = lbl.positionRatio ?? 0.85; // Default to midpoint (0.85)
    const targetX = x1 + t * (x2 - x1);
    const targetY = y1 + t * (y2 - y1);
    // Apply offset
    const offsetX = lbl.offset ?? 0;
    const offsetY = lbl.offset ?? 0; // Assuming same offset for both axes, adjust if needed
    const finalTargetX = targetX + offsetX;
    const finalTargetY = targetY - offsetY; // Y increases downwards, so subtract for upward offset

    // Center the rectangle around the final target point
    const rectX = finalTargetX - rectWidth / 2;
    const rectY = finalTargetY - rectHeight / 2;

    // --- Draw Background Rect ---
    // (Using manual path for rounded corners for broader compatibility)
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

    // --- Draw Text ---
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const textX = rectX + padding.left;
    const textY = rectY + padding.top;

    ctx.fillText(text, textX, textY);

    ctx.restore(); // Restore original context state
  }

  // cleanup
  ctx.restore();
}

const trendlinePlugin: Plugin<'line'> = {
  id: 'chartjs-plugin-trendline-ts',

  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    const pluginOptions = chart.options.plugins?.trendline as TrendlinePluginOptions | undefined;
    const { chartArea } = chart;

    // get horizontal (x) and vertical (y) scales
    const xScale = Object.values(chart.scales).find((s) => s.isHorizontal())!;
    const yScale = Object.values(chart.scales).find((s) => !s.isHorizontal())!;

    // Check if we should create an aggregated trendline
    if (pluginOptions?.aggregateMultiple && pluginOptions.aggregateMultiple.length > 0) {
      // Process each aggregate trendline configuration
      for (const aggregateConfig of pluginOptions.aggregateMultiple) {
        const yAxisAggregateKey = aggregateConfig.yAxisKey;
        const yAxisID = aggregateConfig.yAxisID;

        // Find datasets that match the yAxisKey for this aggregation
        const datasetsWithTrendline = chart.data.datasets.filter(
          (ds) => ds.data.length >= 2 && ds.yAxisKey === yAxisAggregateKey && !ds.isTrendline
        );
        console.log(datasetsWithTrendline);

        if (datasetsWithTrendline.length > 0) {
          // Get the first trendline options to use as default for aggregated trendline
          const firstDatasetWithTrendline = datasetsWithTrendline[0];

          // Use the provided aggregate config
          const aggregateOpts = aggregateConfig;

          // Choose fitter based on type
          let fitter: Fitter;
          switch (aggregateOpts.type) {
            case 'polynomial':
              fitter = new PolynomialFitter(aggregateOpts.polynomialOrder ?? 2);
              break;
            case 'logarithmic':
              fitter = new LogarithmicFitter();
              break;
            case 'exponential':
              fitter = new ExponentialFitter();
              break;
            case 'linear':
            default:
              fitter = new LinearFitter();
          }

          // Collect all data points from all datasets that match this yAxisKey
          for (const dataset of datasetsWithTrendline) {
            dataset.data.forEach((point: any, i) => {
              const x = point['x'] ?? i;
              const y = point[yAxisID ?? 'y'] ?? point;
              if (typeof x === 'number' && typeof y === 'number') {
                fitter.add(x, y);
              }
            });
          }

          console.log(fitter);

          // Draw the aggregated trendline if we have valid data points
          if (fitter.minx !== Infinity && fitter.maxx !== -Infinity) {
            const defaultColor =
              (firstDatasetWithTrendline.borderColor as string) ?? 'rgba(0,0,0,0.3)';
            drawTrendline(ctx, chartArea, xScale, yScale, fitter, aggregateOpts, defaultColor);
          }
        }
      }
    } else {
      // Original behavior - draw individual trendlines for each dataset
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const opts = dataset.trendline;
        if (!opts || dataset.data.length < 2) {
          return;
        }

        // --- choose your fitter based on opts.type (as before) ---
        let fitter: Fitter;
        switch (opts.type) {
          case 'polynomial':
            fitter = new PolynomialFitter(opts.polynomialOrder ?? 2);
            break;
          case 'logarithmic':
            fitter = new LogarithmicFitter();
            break;
          case 'exponential':
            fitter = new ExponentialFitter();
            break;
          case 'linear':
          default:
            fitter = new LinearFitter();
        }

        // feed in the points
        dataset.data.forEach((point: any, i) => {
          const x = point['x'] ?? i;
          const y = point[dataset.yAxisID ?? 'y'] ?? point;
          if (typeof x === 'number' && typeof y === 'number') {
            fitter.add(x, y);
          }
        });

        // Skip if no valid points were added
        if (fitter.minx === Infinity || fitter.maxx === -Infinity) {
          return;
        }

        // For exponential trendlines, ensure we have valid y values
        if (opts.type === 'exponential') {
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
        drawTrendline(ctx, chartArea, xScale, yScale, fitter, opts, defaultColor);
      });
    }
  }
};

export default trendlinePlugin;
