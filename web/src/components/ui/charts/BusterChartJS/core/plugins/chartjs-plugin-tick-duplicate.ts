import { ChartType, Chart, Plugin } from 'chart.js';

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {}
}

export const ChartJSTickDuplicatePlugin: Plugin<ChartType> = {
  id: 'chartjs-plugin-tick-duplicate',
  afterBuildTicks(chart) {
    const scale = chart.scales['x'];
    if (!scale || scale.type !== 'time') return;

    const adapter = scale._adapter;
    const format = (v) => adapter.format(v, scale.options.time.displayFormats?.month || 'MMM');

    const allTicks = scale._generate(); // Chart.js's default generated ticks (raw values)
    const seenLabels = new Set();
    const unique = [];

    for (const tick of allTicks) {
      const label = format(tick.value ?? tick);
      if (!seenLabels.has(label)) {
        seenLabels.add(label);
        unique.push({ value: tick.value ?? tick, label });
      }
    }

    if (unique.length < 2) return;

    const min = scale.min ?? Math.min(...allTicks.map((t) => t.value ?? t));
    const max = scale.max ?? Math.max(...allTicks.map((t) => t.value ?? t));
    const spacing = (max - min) / (unique.length - 1);

    const evenlySpaced = unique.map((tick, i) => ({
      value: min + i * spacing,
      label: tick.label
    }));

    scale.ticks = evenlySpaced;
  },
  beforeDraw(chart) {
    // Prevent Chart.js from auto-reformatting tick labels
    const scale = chart.scales['x'];
    if (!scale || !scale.ticks) return;
    scale.ticks.forEach((tick) => {
      tick.label = tick.label;
    });
  }
};

export default ChartJSTickDuplicatePlugin;
