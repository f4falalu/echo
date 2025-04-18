import { ChartType, Chart, Plugin } from 'chart.js';

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {}
}

const safeFormat = (adapter, value, formatStr) => {
  try {
    return adapter.format(value, formatStr);
  } catch {
    console.log('safeFormat', value, formatStr);
    // fallback to toISOString + slicing or your own logic
    const date = new Date(value);
    return date.toLocaleString('default', { month: 'short' }); // e.g., 'Jan'
  }
};

export const ChartJSTickDuplicatePlugin: Plugin<ChartType> = {
  id: 'chartjs-plugin-tick-duplicate',
  afterBuildTicks(chart) {
    const scale = chart.scales['x'];
    if (!scale || scale.type !== 'time') return;

    const adapter = scale._adapter;
    const displayFormat = scale.options.time.displayFormats?.month || 'MMM';
    const tickCallback = scale.options.ticks?.callback;

    const allTicks = scale._generate(); // raw ticks
    const values = allTicks.map((t) => t.value ?? t);

    const seenLabels = new Set();
    const unique = [];

    for (let i = 0; i < values.length; i++) {
      const value = values[i];

      let label;
      try {
        if (typeof tickCallback === 'function') {
          // ✅ this is the KEY FIX: preserve `this` as the scale
          label = tickCallback.call(scale, value, i, values);
        } else {
          label = adapter.format(value, displayFormat);
        }
      } catch (err) {
        console.warn('Tick callback error at index', i, err);
        label = '???';
      }

      const stringLabel = String(label);
      if (!seenLabels.has(stringLabel)) {
        seenLabels.add(stringLabel);
        unique.push({ value, label: stringLabel });
      }
    }

    if (unique.length < 2) return;

    const min = scale.min ?? Math.min(...values);
    const max = scale.max ?? Math.max(...values);
    const spacing = (max - min) / (unique.length - 1);

    scale._customTicks = unique.map((u, i) => ({
      value: min + spacing * i,
      label: u.label
    }));

    scale.ticks = scale._customTicks;
  },

  beforeDraw(chart) {
    const scale = chart.scales['x'];
    if (!scale?._customTicks) return;

    scale.ticks = scale._customTicks.map((t) => ({
      ...t,
      label: t.label
    }));
  }
};

export default ChartJSTickDuplicatePlugin;
