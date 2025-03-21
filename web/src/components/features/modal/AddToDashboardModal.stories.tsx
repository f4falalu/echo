import type { Meta, StoryObj } from '@storybook/react';
import { AddToDashboardModal } from './AddToDashboardModal';
import { http, HttpResponse } from 'msw';
import { fn } from '@storybook/test';
import { BASE_URL } from '@/api/buster_rest/config';
import { BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import { createMockListMetric } from '@/mocks/metric';

const mockMetrics: BusterMetricListItem[] = Array.from({ length: 100 }, (_, index) =>
  createMockListMetric(`${index + 1}`)
);

const meta = {
  title: 'Features/Modal/AddToDashboardModal',
  component: AddToDashboardModal,
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.get(`${BASE_URL}/metrics`, () => {
          return HttpResponse.json(mockMetrics);
        })
      ]
    }
  }
} satisfies Meta<typeof AddToDashboardModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onClose: fn(),
    dashboardId: 'dashboard-1'
  }
};

export const EmptyState: Story = {
  args: {
    open: true,
    onClose: fn(),
    dashboardId: 'dashboard-1'
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${BASE_URL}/metrics`, () => {
          return HttpResponse.json([]);
        })
      ]
    }
  }
};
