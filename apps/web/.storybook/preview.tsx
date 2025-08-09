import type { Preview } from '@storybook/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initialize, mswLoader } from 'msw-storybook-addon';
import * as React from 'react';
import { BusterAssetsProvider } from '../src/context/Assets/BusterAssetsProvider';
import { BusterStyleProvider } from '../src/context/BusterStyles/BusterStyles';
import '../src/styles/styles.scss';

initialize();

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    backgrounds: {
      options: {
        light: { name: 'Light', value: '#ffffff' },
        dark: { name: 'Dark', value: '#000000' },
        maroon: { name: 'Maroon', value: '#800000' }
      }
    }
  },
  initialGlobals: {
    backgrounds: {
      value: 'light'
    },
    theme: 'light'
  },
  loaders: [mswLoader],
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 0,
            staleTime: 0
          }
        }
      });
      return (
        <BusterStyleProvider>
          <QueryClientProvider client={queryClient}>
            <BusterAssetsProvider>
              <Story />
            </BusterAssetsProvider>
          </QueryClientProvider>
        </BusterStyleProvider>
      );
    }
  ]
};

export default preview;
