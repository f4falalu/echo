import { useMemoizedFn } from '@/hooks';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { Input } from '@/components/ui/inputs';
import React from 'react';
import { type useUpdateDashboard } from '@/api/buster_rest/dashboards';

export const DASHBOARD_TITLE_INPUT_ID = 'dashboard-title-input';

export const DashboardEditTitles: React.FC<{
  title: string;
  onUpdateDashboard: ReturnType<typeof useUpdateDashboard>['mutateAsync'];
  description: string;
  readOnly?: boolean;
  dashboardId: string;
}> = React.memo(({ onUpdateDashboard, readOnly, title, description, dashboardId }) => {
  const onChangeTitle = useMemoizedFn((name: string) => {
    if (!readOnly) onUpdateDashboard({ name, id: dashboardId });
  });

  const onChangeDashboardDescription = useMemoizedFn(
    (value: React.ChangeEvent<HTMLInputElement>) => {
      if (!readOnly) onUpdateDashboard({ description: value.target.value, id: dashboardId });
    }
  );

  return (
    <div className="flex flex-col space-y-0">
      <EditableTitle
        className="w-full truncate"
        readOnly={readOnly}
        onChange={onChangeTitle}
        id={DASHBOARD_TITLE_INPUT_ID}
        placeholder="New dashboard"
        level={3}>
        {title}
      </EditableTitle>

      {(description || !readOnly) && (
        <Input
          variant="ghost"
          className={'pl-0!'}
          readOnly={readOnly}
          onChange={onChangeDashboardDescription}
          defaultValue={description}
          placeholder="Add description..."
        />
      )}
    </div>
  );
});
DashboardEditTitles.displayName = 'DashboardEditTitles';
