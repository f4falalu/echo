import { ChartType, Chart, Plugin } from 'chart.js';

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {}
}

import { TimeScale } from 'chart.js';

//GROK
export class DeduplicatedTimeScale extends TimeScale {
  static id = 'deduplicated-time';
  static defaults = TimeScale.defaults;

  /**
   * Override buildTicks to eliminate duplicate ticks based on formatted values.
   * @returns {Array} Array of unique tick objects
   */
  buildTicks() {
    console.log('buildTicks');
    // Step 1: Get default ticks from parent TimeScale
    const defaultTicks = super.buildTicks();

    // Step 2: Access tick callback and display format
    const tickCallback = this.options.ticks?.callback;
    const displayFormat =
      this.options.time?.displayFormats?.[this._unit] ||
      this.options.time?.displayFormats?.month ||
      'MMM';
    const format = this._adapter.format.bind(this._adapter);

    // Step 3: Track seen labels and collect unique ticks
    const seen = new Set();
    const uniqueTicks = [];

    for (let i = 0; i < defaultTicks.length; i++) {
      const tick = defaultTicks[i];

      // Step 4: Generate tick label
      let label;
      try {
        if (typeof tickCallback === 'function') {
          // Pass tick value, index, and ticks array to callback
          label = tickCallback.call(this, tick.value, i, defaultTicks);
        } else {
          // Format using the adapter with the appropriate display format
          label = format(tick.value, displayFormat);
        }
      } catch (e) {
        console.error('Tick callback error at index', i, e);
        label = '???';
      }

      // Ensure label is a string for consistent comparison
      const stringLabel = String(label ?? '');

      // Step 5: Only include tick if label is unique
      if (!seen.has(stringLabel)) {
        seen.add(stringLabel);
        uniqueTicks.push({
          ...tick,
          label: stringLabel // Ensure the tick object has the correct label
        });
      }
    }

    // Step 6: Return the filtered ticks
    return uniqueTicks;
  }
}
