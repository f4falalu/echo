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
    },
    backgrounds: {
      values: [
        // 👇 Default values
        { name: 'Dark', value: '#333' },
        { name: 'Light', value: '#FFFFFF' }
      ],
      // 👇 Specify which background is shown by default
      default: 'Light'
    }
  },
  decorators: [
    (Story) => {
      return (
        <BusterStyleProvider>
          <Story />
        </BusterStyleProvider>
      );
    }
  ]
};

export default preview;
