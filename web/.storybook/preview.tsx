import React from 'react';
import type { Preview } from '@storybook/react';
import { BusterStyleProvider } from '../src/context/BusterStyles/BusterStyles';
import '../src/styles/styles.scss';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },
  decorators: [
    (Story) => {
      return (
        <div>
          <BusterStyleProvider>
            <Story />
          </BusterStyleProvider>
        </div>
      );
    }
  ]
};

export default preview;
