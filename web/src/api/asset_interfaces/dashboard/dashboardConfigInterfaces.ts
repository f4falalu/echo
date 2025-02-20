import type { BusterResizeableGridRow } from '@/components/ui/grid/interfaces';

export interface DashboardConfig {
  rows?: (Omit<BusterResizeableGridRow, 'items'> & {
    items: { id: string }[];
  })[];
}
