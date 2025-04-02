import { Chart, ChartType } from 'chart.js';

/**
 * Configuration options for the Animation Delay plugin
 */
interface AnimationDelayPluginOptions {
  /** Delay between each data point animation in milliseconds */
  delayBetweenPoints?: number;
  /** Additional delay between datasets in milliseconds */
  delayBetweenDatasets?: number;
  /** Whether to reset the delay when the chart is updated */
  resetOnUpdate?: boolean;
}

// Context object passed to the delay function
interface DelayFunctionContext {
  type: string;
  mode: string;
  dataIndex: number;
  datasetIndex: number;
}

/**
 * Chart.js plugin for animating chart elements with a sequential delay effect.
 * This creates a "build-up" animation where each data point appears after the previous one.
 */
const AnimationDelayPlugin = {
  id: 'animationDelay',

  defaults: {
    delayBetweenPoints: 150,
    delayBetweenDatasets: 50,
    resetOnUpdate: true
  },

  beforeInit(chart: Chart): void {
    // Add flag to track if animation delay is active
    chart._animationDelayActive = false;
  },

  beforeUpdate(chart: Chart): void {
    const options = chart.options.plugins?.animationDelay || {};
    const pluginOptions = {
      ...this.defaults,
      ...options
    };

    if (pluginOptions.resetOnUpdate) {
      chart._animationDelayActive = false;
    }
  },

  beforeDraw(chart: Chart): void {
    // Skip if animation delay is already applied
    if (chart._animationDelayActive) return;

    const options = chart.options.plugins?.animationDelay || {};
    const pluginOptions = {
      ...this.defaults,
      ...options
    };

    // Ensure animation object exists
    if (!chart.options.animation) {
      chart.options.animation = {};
    }

    // Store original settings
    const originalAnimationObj = { ...chart.options.animation };

    // Apply new animation with delay
    chart.options.animation = {
      ...originalAnimationObj,

      // Define the delay function to create sequential animation effect
      delay(context: DelayFunctionContext): number {
        let delay = 0;

        // Only apply to data points in default mode
        if (context.type === 'data' && context.mode === 'default' && !chart._animationDelayActive) {
          // Calculate delay based on dataIndex and datasetIndex
          delay =
            context.dataIndex * (pluginOptions.delayBetweenPoints || 150) +
            context.datasetIndex * (pluginOptions.delayBetweenDatasets || 50);
        }

        return delay;
      },

      // Override onComplete function
      onComplete(): void {
        // Mark animation as active once complete
        chart._animationDelayActive = true;

        // Call original onComplete if it exists
        if (originalAnimationObj.onComplete) {
          originalAnimationObj.onComplete.call(chart);
        }
      }
    };
  }
};

// Register the plugin globally
Chart.register(AnimationDelayPlugin);

// Add TypeScript type definitions
declare module 'chart.js' {
  interface Chart {
    _animationDelayActive: boolean;
  }

  interface PluginOptionsByType<TType extends ChartType> {
    animationDelay?: AnimationDelayPluginOptions;
  }
}

export default AnimationDelayPlugin;
