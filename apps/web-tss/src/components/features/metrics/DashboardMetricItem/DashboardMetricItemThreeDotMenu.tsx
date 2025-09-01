import React, { useState } from 'react';
import { Button } from '@/components/ui/buttons';
import { Dropdown } from '@/components/ui/dropdown';
import { DotsVertical } from '@/components/ui/icons';
import { cn } from '@/lib/classMerge';
import { useDashboardMetricCardThreeDotMenuItems } from './useDashboardMetricCardThreeDotMenuItems';

export const DashboardMetricItemThreeDotMenu = React.memo(
  ({
    metricId,
    metricVersionNumber,
    dashboardId,
  }: {
    metricId: string;
    metricVersionNumber: number | undefined;
    dashboardId: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const threeDotMenuItems = useDashboardMetricCardThreeDotMenuItems({
      dashboardId,
      metricId,
      metricVersionNumber,
    });

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className={cn(
          'mt-1.5 mr-1.5 opacity-0 group-hover:opacity-100',
          'group-hover:pointer-events-auto',
          isOpen && 'pointer-events-auto block opacity-100'
        )}
      >
        <Dropdown
          items={threeDotMenuItems}
          side="left"
          align="start"
          contentClassName="max-h-fit"
          modal
          onOpenChange={setIsOpen}
        >
          <Button variant="ghost" className="hover:bg-item-active" prefix={<DotsVertical />} />
        </Dropdown>
      </div>
    );
  }
);
