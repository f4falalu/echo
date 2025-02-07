import { useMemoizedFn } from 'ahooks';
import { EditableTitle } from '@/components/text';
import { Input } from 'antd';
import React from 'react';
import { useBusterDashboards } from '@/context/Dashboards';

export const DashboardEditTitles: React.FC<{
  title: string;
  onUpdateDashboard: ReturnType<typeof useBusterDashboards>['onUpdateDashboard'];
  description: string;
  allowEdit?: boolean;
  dashboardId: string;
}> = React.memo(({ onUpdateDashboard, allowEdit, title, description, dashboardId }) => {
  const onChangeTitle = useMemoizedFn((title: string) => {
    onUpdateDashboard({ title, id: dashboardId });
  });

  const onChangeDescription = useMemoizedFn((description: string) => {
    onUpdateDashboard({ description, id: dashboardId });
  });

  const onChangeDashboardDescription = useMemoizedFn(
    (value: React.ChangeEvent<HTMLInputElement>) => {
      onChangeDescription(value.target.value);
    }
  );

  return (
    <div className="flex flex-col space-y-0">
      <EditableTitle
        className="w-full truncate"
        disabled={!allowEdit}
        onChange={onChangeTitle}
        placeholder="New Dashboard"
        level={3}>
        {title}
      </EditableTitle>

      {(description || allowEdit) && (
        <Input
          variant="borderless"
          className={'!pl-0'}
          disabled={!allowEdit}
          onChange={onChangeDashboardDescription}
          defaultValue={description}
          placeholder="Add description..."
        />
      )}
    </div>
  );
});
DashboardEditTitles.displayName = 'DashboardEditTitles';
