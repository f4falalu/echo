import { TanstackDevtools as TanstackDevtoolsBase } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import type React from 'react';
import StoreDevtools from './demo-store-devtools';

export const TanstackDevtools: React.FC = () => {
  return (
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
  );
};
