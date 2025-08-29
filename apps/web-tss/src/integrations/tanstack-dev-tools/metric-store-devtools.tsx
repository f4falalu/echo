import { EventClient } from '@tanstack/devtools-event-client';
import { useEffect, useState } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { originalMetricStore } from '@/context/Metrics/useOriginalMetricStore';

type EventMap = {
  'store-devtools:state': {
    metrics: Map<string, BusterMetric>;
  };
};

class StoreDevtoolsEventClient extends EventClient<EventMap> {
  constructor() {
    super({
      pluginId: 'store-devtools',
    });
  }
}

const sdec = new StoreDevtoolsEventClient();

originalMetricStore.subscribe(() => {
  sdec.emit('state', {
    metrics: originalMetricStore.state,
  });
});

function DevtoolPanel() {
  const [state, setState] = useState<EventMap['store-devtools:state']>(() => ({
    metrics: originalMetricStore.state,
  }));
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    return sdec.on('state', (e) => setState(e.payload));
  }, []);

  const toggleRow = (metricId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(metricId)) {
        newSet.delete(metricId);
      } else {
        newSet.add(metricId);
      }
      return newSet;
    });
  };

  const metricsArray = Array.from(state.metrics.values());

  return (
    <div>
      <h3>Original Metrics Store ({metricsArray.length})</h3>
      {metricsArray.length === 0 ? (
        <p>No metrics in store</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  border: '1px solid #ccc',
                  padding: '8px',
                  textAlign: 'left',
                  width: '60px',
                }}
              >
                Toggle
              </th>
              <th
                style={{
                  border: '1px solid #ccc',
                  padding: '8px',
                  textAlign: 'left',
                  width: '200px',
                }}
              >
                ID
              </th>
              <th
                style={{
                  border: '1px solid #ccc',
                  padding: '8px',
                  textAlign: 'left',
                  width: '200px',
                }}
              >
                Name
              </th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>
                JSON Data
              </th>
            </tr>
          </thead>
          <tbody>
            {metricsArray.map((metric) => {
              const isExpanded = expandedRows.has(metric.id);
              return (
                <tr key={metric.id}>
                  <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>
                    <button
                      type="button"
                      onClick={() => toggleRow(metric.id)}
                      style={{
                        background: 'none',
                        border: '1px solid #ccc',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>
                    {metric.id}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>
                    {metric.name}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>
                    {isExpanded ? (
                      <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(metric, null, 2)}
                      </pre>
                    ) : (
                      <span style={{ color: '#666', fontStyle: 'italic' }}>
                        Click + to expand JSON data
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default {
  name: 'Metric Original Store',
  render: <DevtoolPanel />,
};
