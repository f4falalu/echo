import type { Preview } from '@storybook/react-vite';
import '../src/styles/styles.css';
import { BusterStyleProvider } from '../src/context/BusterStyles';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => {
      return (
        <BusterStyleProvider>
          <Story />
        </BusterStyleProvider>
      );
    },
  ],
};

export default preview;
