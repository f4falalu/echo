import { TanStackDevtools as TanstackDevtoolsBase } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { ClientOnly } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import type React from 'react';
import StoreDevtools from './metric-store-devtools';

// The actual devtools component implementation
const TanstackDevtoolsImpl: React.FC = () => {
  return (
    <ClientOnly>
      <TanstackDevtoolsBase
        config={{
          position: 'bottom-left',
          hideUntilHover: true,
          defaultOpen: false,
        }}
        plugins={[
          {
            name: 'Tanstack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          StoreDevtools,
        ]}
      />
    </ClientOnly>
  );
};

export default TanstackDevtoolsImpl;
