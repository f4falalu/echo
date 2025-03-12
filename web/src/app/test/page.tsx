'use client';

import { ChartType, IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { BusterChart } from '@/components/ui/charts';
import { Chart } from '@/components/ui/charts/BusterChartJS/core';
import ChartDeferred from 'chartjs-plugin-deferred';
import ChartJsAnnotationPlugin from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Title } from '@/components/ui/typography';

export default function TestPage() {
  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Amount',
        data: [65, 59, 80, 81, 56, 55, 40]
      }
    ]
  };

  BusterChart;

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <BusterChart
        data={[
          { segment: 'A', value1: 30, value2: 45 },
          { segment: 'B', value1: 20, value2: 25 },
          { segment: 'C', value1: 50, value2: 30 }
        ]}
        selectedChartType={ChartType.Pie}
        pieChartAxis={{
          x: ['segment'],
          y: ['value1', 'value2']
        }}
        barAndLineAxis={{
          x: ['segment'],
          y: ['value1', 'value2'],
          category: []
        }}
        scatterAxis={{
          x: ['segment'],
          y: ['value1', 'value2'],
          size: [],
          category: []
        }}
        comboChartAxis={{
          x: ['segment'],
          y: ['value1', 'value2'],
          category: []
        }}
        metricColumnId="test"
        columnLabelFormats={{
          segment: {
            columnType: 'string',
            style: 'string'
          } satisfies IColumnLabelFormat,
          value1: {
            columnType: 'number',
            style: 'number',
            numberSeparatorStyle: ','
          } satisfies IColumnLabelFormat,
          value2: {
            columnType: 'number',
            style: 'number',
            numberSeparatorStyle: ','
          } satisfies IColumnLabelFormat
        }}
      />
    </div>
  );
}
