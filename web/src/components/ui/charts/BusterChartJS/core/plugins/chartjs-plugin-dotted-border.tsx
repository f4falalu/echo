import { ChartType, Chart, Plugin } from 'chart.js';

export interface ChartAreaBorderPluginOptions {
  borderColor?: string;
  borderWidth?: number;
  borderDash?: number[];
  borderDashOffset?: number;
}

const chartAreaBorder: Plugin<ChartType, ChartAreaBorderPluginOptions> = {
  id: 'chartAreaBorder',
  beforeDraw(chart, args, options) {
    const {
      ctx,
      chartArea: { left, top, width, height }
    } = chart;
    ctx.save();
    ctx.strokeStyle = options.borderColor!;
    ctx.lineWidth = options.borderWidth!;
    ctx.setLineDash(options.borderDash || []);
    ctx.lineDashOffset = options.borderDashOffset!;
    ctx.strokeRect(left, top, width, height);
    ctx.restore();
  },
  defaults: {
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderDash: [4, 4],
    borderDashOffset: 0
  }
};
