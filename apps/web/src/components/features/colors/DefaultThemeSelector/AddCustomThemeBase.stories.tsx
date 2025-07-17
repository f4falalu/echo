import type { Meta, StoryObj } from '@storybook/react';
import { AddCustomThemeBase } from './AddCustomThemeBase';
import type { IColorTheme } from '../ThemeList';

const meta: Meta<typeof AddCustomThemeBase> = {
  title: 'Features/Colors/AddCustomThemeBase',
  component: AddCustomThemeBase,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample custom themes data
const sampleCustomThemes: Omit<IColorTheme, 'selected'>[] = [
  {
    id: 'custom-1',
    name: 'Ocean Blue',
    colors: ['#0077be', '#4a90e2', '#87ceeb', '#e0f6ff']
  },
  {
    id: 'custom-2',
    name: 'Forest Green',
    colors: ['#228b22', '#32cd32', '#90ee90', '#f0fff0']
  },
  {
    id: 'custom-3',
    name: 'Sunset Orange',
    colors: ['#ff4500', '#ff6347', '#ffa07a', '#fff8dc']
  }
];

export const Default: Story = {
  args: {
    customThemes: sampleCustomThemes,
    selectedThemeId: 'custom-1',
    createCustomTheme: (theme: IColorTheme) => {
      console.log('Creating custom theme:', theme);
    },
    deleteCustomTheme: (themeId: string) => {
      console.log('Deleting custom theme:', themeId);
    },
    modifyCustomTheme: (themeId: string, theme: IColorTheme) => {
      console.log('Modifying custom theme:', themeId, theme);
    }
  }
};
