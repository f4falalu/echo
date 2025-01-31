import type { BusterResizeableGridRow } from '@/components/grid/interfaces';

export interface DashboardConfig {
  rows?: (Omit<BusterResizeableGridRow, 'items'> & {
    items: { id: string }[];
  })[];
}
