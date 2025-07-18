import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { NewThemePopup } from './NewThemePopup';
import type { IColorTheme } from '../ThemeList';

const mockTheme: IColorTheme = {
  id: '1',
  name: 'Ocean Breeze',
  colors: ['#1E88E5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#673AB7', '#3F51B5']
};

const longNameTheme: IColorTheme = {
  id: '2',
  name: 'Super Long Theme Name That Might Wrap Around',
  colors: ['#FF7043', '#FFB74D', '#FFA726', '#FF5722', '#F4511E']
};

const manyColorsTheme: IColorTheme = {
  id: '3',
  name: 'Rainbow',
  colors: [
    '#EC407A',
    '#AB47BC',
    '#7E57C2',
    '#5C6BC0',
    '#42A5F5',
    '#29B6F6',
    '#00BCD4',
    '#0097A7',
    '#00897B',
    '#43A047',
    '#7CB342',
    '#C0CA33',
    '#FFEE58',
    '#FFA726',
    '#FF7043'
  ]
};

const meta: Meta<typeof NewThemePopup> = {
  title: 'Features/Colors/NewThemePopup',
  component: NewThemePopup,
  parameters: {
    layout: 'centered'
  },
  args: {
    onSave: fn(),
    onDelete: fn()
  },
  decorators: [
    (Story) => (
      <div className="">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof NewThemePopup>;

export const NewTheme: Story = {
  args: {
    selectedTheme: undefined
  }
};

export const EditingExistingTheme: Story = {
  args: {
    selectedTheme: mockTheme
  }
};

export const EditingThemeWithLongName: Story = {
  args: {
    selectedTheme: longNameTheme
  }
};

export const EditingThemeWithManyColors: Story = {
  args: {
    selectedTheme: manyColorsTheme
  }
};
