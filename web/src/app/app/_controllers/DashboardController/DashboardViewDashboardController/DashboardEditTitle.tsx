import { useEffect } from 'react';
import { useMemoizedFn } from 'ahooks';
import { EditableTitle } from '@/components/text';
import { Input } from 'antd';
import React from 'react';
import { useDashboardUpdateConfig } from '@/context/Dashboards/useDashboardIndividual/useDashboardUpdateConfig';

export const DashboardEditTitles: React.FC<{
  title: string;
  onUpdateDashboard: ReturnType<typeof useDashboardUpdateConfig>['onUpdateDashboard'];
  description: string;
  allowEdit?: boolean;
}> = React.memo(({ onUpdateDashboard, allowEdit, title, description }) => {
  const onChangeTitle = useMemoizedFn((name: string) => {
    onUpdateDashboard({ name });
  });

  const onChangeDescription = useMemoizedFn((description: string) => {
    onUpdateDashboard({ description });
  });

  const onChangeDashboardDescription = useMemoizedFn(
    (value: React.ChangeEvent<HTMLInputElement>) => {
      onChangeDescription(value.target.value);
    }
  );

  return (
    <div className="flex flex-col space-y-1.5">
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
