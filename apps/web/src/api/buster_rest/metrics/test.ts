export const testMetricResponse = {
  id: '23b15b8e-4e22-4980-83b5-0009e173f0e0',
  type: 'metric',
  name: 'Monthly Order Volume Decline',
  version_number: 1,
  description: 'Shows the declining trend in monthly order volume over the last 12 months',
  file_name: 'Monthly Order Volume Decline',
  time_frame: 'Last 12 months',
  datasets: [],
  data_source_id: '14d50bf5-6dee-42a7-bdff-a4a398156edf',
  error: null,
  chart_config: {
    selectedChartType: 'line',
    columnLabelFormats: {
      order_count: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        replaceMissingDataWith: 0
      },
      order_month: {
        columnType: 'date',
        style: 'date',
        numberSeparatorStyle: null,
        replaceMissingDataWith: null,
        dateFormat: 'MMM YYYY'
      }
    },
    barAndLineAxis: {
      x: ['order_month'],
      y: ['order_count']
    }
  },
  data_metadata: {
    column_count: 2,
    row_count: 13,
    column_metadata: [
      {
        name: 'order_month',
        min_value: '2024-03-01T00:00:00.000Z',
        max_value: '2025-03-01T00:00:00.000Z',
        unique_values: 13,
        simple_type: 'date',
        type: 'timestamp'
      },
      {
        name: 'order_count',
        min_value: 375,
        max_value: 2326,
        unique_values: 13,
        simple_type: 'number',
        type: 'int4'
      }
    ]
  },
  status: 'notRequested',
  evaluation_score: null,
  evaluation_summary: '',
  file: "name: Monthly Order Volume Decline\ndescription: Shows the declining trend in monthly order volume over the last 12 months\ntimeFrame: Last 12 months\nsql: \"SELECT \\n  DATE_TRUNC('month', soh.orderdate) as order_month,\\n  COUNT(*) as order_count\\nFROM postgres.ont_ont.sales_order_header soh\\nWHERE soh.orderdate >= (SELECT MAX(orderdate) FROM postgres.ont_ont.sales_order_header) - INTERVAL '12 months'\\nGROUP BY DATE_TRUNC('month', soh.orderdate)\\nORDER BY order_month\\n\"\nchartConfig:\n  selectedChartType: line\n  columnLabelFormats:\n    order_count:\n      columnType: number\n      style: number\n      numberSeparatorStyle: ','\n      replaceMissingDataWith: 0\n    order_month:\n      columnType: date\n      style: date\n      numberSeparatorStyle: null\n      replaceMissingDataWith: null\n      dateFormat: MMM YYYY\n  barAndLineAxis:\n    x:\n    - order_month\n    y:\n    - order_count\n",
  created_at: '2025-07-09T22:01:16.273Z',
  updated_at: '2025-07-09T22:01:16.273Z',
  sent_by_id: '1fe85021-e799-471b-8837-953e9ae06e4c',
  sent_by_name: '',
  sent_by_avatar_url: null,
  code: null,
  dashboards: [],
  collections: [],
  versions: [
    {
      version_number: 1,
      updated_at: '2025-07-09T22:01:16.273Z'
    }
  ],
  permission: 'owner',
  sql: "SELECT \n  DATE_TRUNC('month', soh.orderdate) as order_month,\n  COUNT(*) as order_count\nFROM postgres.ont_ont.sales_order_header soh\nWHERE soh.orderdate >= (SELECT MAX(orderdate) FROM postgres.ont_ont.sales_order_header) - INTERVAL '12 months'\nGROUP BY DATE_TRUNC('month', soh.orderdate)\nORDER BY order_month\n",
  individual_permissions: [
    {
      email: 'blake@buster.so',
      role: 'owner',
      name: 'Blake Rouse'
    }
  ],
  public_expiry_date: null,
  public_enabled_by: null,
  publicly_accessible: false,
  public_password: null
};

export const testMetricDataResponse = {
  metric_id: '23b15b8e-4e22-4980-83b5-0009e173f0e0',
  data: [
    {
      order_month: '2024-03-01T00:00:00',
      order_count: 375
    },
    {
      order_month: '2024-04-01T00:00:00',
      order_count: 1707
    },
    {
      order_month: '2024-05-01T00:00:00',
      order_count: 1783
    },
    {
      order_month: '2024-06-01T00:00:00',
      order_count: 1815
    },
    {
      order_month: '2024-07-01T00:00:00',
      order_count: 1973
    },
    {
      order_month: '2024-08-01T00:00:00',
      order_count: 2139
    },
    {
      order_month: '2024-09-01T00:00:00',
      order_count: 2015
    },
    {
      order_month: '2024-10-01T00:00:00',
      order_count: 2130
    },
    {
      order_month: '2024-11-01T00:00:00',
      order_count: 2018
    },
    {
      order_month: '2024-12-01T00:00:00',
      order_count: 2300
    },
    {
      order_month: '2025-01-01T00:00:00',
      order_count: 2326
    },
    {
      order_month: '2025-02-01T00:00:00',
      order_count: 1982
    },
    {
      order_month: '2025-03-01T00:00:00',
      order_count: 871
    }
  ],
  data_metadata: {
    column_count: 2,
    row_count: 13,
    column_metadata: [
      {
        name: 'order_month',
        min_value: '2024-03-01T00:00:00.000Z',
        max_value: '2025-03-01T00:00:00.000Z',
        unique_values: 13,
        simple_type: 'date',
        type: 'timestamp'
      },
      {
        name: 'order_count',
        min_value: 375,
        max_value: 2326,
        unique_values: 13,
        simple_type: 'number',
        type: 'int4'
      }
    ]
  }
};
