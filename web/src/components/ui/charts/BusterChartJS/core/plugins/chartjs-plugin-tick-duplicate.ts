import { ChartType, Chart, Plugin } from 'chart.js';

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {}
}

export const ChartJSTickDuplicatePlugin: Plugin<ChartType> = {
  id: 'chartjs-plugin-tick-duplicate',
  afterBuildTicks(chart) {
    console.log('afterBuildTicks');
    const scale = chart.scales['x'];
    if (!scale || scale.type !== 'time') return;

    const adapter = scale._adapter;
    const displayFormat = scale.options.time.displayFormats?.month || 'MMM';
    const tickCallback = scale.options.ticks?.callback;

    const allTicks = scale._generate(); // raw generated ticks
    const values = allTicks.map((t) => t.value ?? t);

    const seenLabels = new Set();
    const unique = [];

    for (let i = 0; i < values.length; i++) {
      const value = values[i];

      let label;
      try {
        if (typeof tickCallback === 'function') {
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

    scale.ticks = unique.map((u, i) => ({
      value: min + i * spacing,
      label: u.label
    }));
  }
};

export default ChartJSTickDuplicatePlugin;

import { TimeScale } from 'chart.js';

export class DeduplicatedTimeScale extends TimeScale {
  static id = 'time';
  static defaults = {
    ...TimeScale.defaults
  };
  generateTicks() {
    const baseTicks = super.generateTicks(); // Chart.js handles spacing, maxTicksLimit, etc.
    const tickCallback = this.options.ticks?.callback;
    const format = this._adapter.format;
    const displayFormat = this.options.time?.displayFormats?.month || 'MMM';

    const seenLabels = new Set();
    const dedupedTicks = [];

    const values = baseTicks.map((t) => t.value);

    for (let i = 0; i < baseTicks.length; i++) {
      const tick = baseTicks[i];

      let label;
      try {
        if (typeof tickCallback === 'function') {
          // Call with same context Chart.js uses
          label = tickCallback.call(this, tick.value, i, values);
        } else {
          label = format(tick.value, displayFormat);
        }
      } catch (err) {
        label = '???';
        console.warn('Tick callback error at index', i, err);
      }

      const stringLabel = String(label);

      if (!seenLabels.has(stringLabel)) {
        seenLabels.add(stringLabel);
        dedupedTicks.push(tick); // original tick object (value + major flag)
      }
    }

    return dedupedTicks;
  }
}
