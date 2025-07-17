import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { DefaultThemeSelectorBase } from './DefaultThemeSelectorBase';

const meta: Meta<typeof DefaultThemeSelectorBase> = {
  title: 'Features/Colors/DefaultThemeSelector',
  component: DefaultThemeSelectorBase,
  parameters: {
    layout: 'centered'
  },
  args: {
    onChangeTheme: fn(),
    selectedThemeId: 'Ocean Breeze',
    useDefaultThemes: true,
    customThemes: [
      {
        name: 'Custom Sunset',
        colors: ['#FF7043', '#FFB74D', '#FFA726', '#FF5722', '#F4511E'],
        id: 'custom-sunset'
      },
      {
        name: 'Custom Ocean',
        colors: ['#1E88E5', '#00ACC1', '#00897B', '#43A047', '#7CB342'],
        id: 'custom-ocean'
      },
      {
        name: 'Custom Purple',
        colors: ['#8E24AA', '#AB47BC', '#BA68C8', '#CE93D8', '#E1BEE7'],
        id: 'custom-purple'
      }
    ]
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-[400px] min-w-[350px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof DefaultThemeSelectorBase>;

export const Default: Story = {};
