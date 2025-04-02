import { AnimationOptions, AnimationSpec } from 'chart.js';

export const barDelayAnimation = (props?: { dataDelay?: number; datasetDelay?: number }) => {
  const { dataDelay = 200, datasetDelay = 100 } = props || {};
  let delayed = false;
  return {
    onComplete: () => {
      delayed = true;
    },
    delay: (context) => {
      let delay = 0;
      const numberOfDatasets = context.chart.data.datasets.length;
      const numberOfDataPoints = context.chart.data.datasets[context.datasetIndex].data.length;

      if (context.type === 'data' && context.mode === 'default' && !delayed) {
        delay = context.dataIndex * dataDelay + context.datasetIndex * datasetDelay;
        // Ensure the maximum delay is 1000ms
        delay = Math.min(delay, 1000);
      }
      return delay;
    }
  } satisfies AnimationOptions<'bar'>['animation'];
};
