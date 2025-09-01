import { Button } from '@/components/ui/buttons';
import { IDropdownItem } from '@/components/ui/dropdown';
import { DotsVertical } from '@/components/ui/icons';
import { useMetricCardThreeDotMenuItems } from './metricCardThreeDotMenuItems';

export const DashboardMetricItemThreeDotMenu = ({
  metricId,
  metricVersionNumber,
  dashboardId,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
  dashboardId: string;
}) => {
  const threeDotMenuItems = useMetricCardThreeDotMenuItems({
    dashboardId,
    metricId,
    metricVersionNumber,
  });

  return <Button variant="ghost" className="hover:bg-item-active" prefix={<DotsVertical />} />;
};
