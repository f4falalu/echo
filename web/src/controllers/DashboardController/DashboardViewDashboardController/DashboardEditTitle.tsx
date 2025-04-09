import { useDebounceFn, useMemoizedFn } from '@/hooks';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import React from 'react';
import { useUpdateDashboard } from '@/api/buster_rest/dashboards';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';

export const DASHBOARD_TITLE_INPUT_ID = 'dashboard-title-input';

const descriptionAutoResize = {
  minRows: 1,
  maxRows: 25
};

export const DashboardEditTitles: React.FC<{
  title: string;
  description: string;
  readOnly?: boolean;
  dashboardId: string;
}> = React.memo(({ readOnly, title, description, dashboardId }) => {
  const { mutateAsync: onUpdateDashboard } = useUpdateDashboard({
    saveToServer: false
  });

  const onChangeTitle = useMemoizedFn((name: string) => {
    if (!readOnly) onUpdateDashboard({ name, id: dashboardId });
  });

  const onChangeDashboardDescription = useMemoizedFn(
    (value: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!readOnly) onUpdateDashboard({ description: value.target.value, id: dashboardId });
    }
  );

  return (
    <div className="flex flex-col space-y-1.5">
      <EditableTitle
        className="w-full truncate"
        readOnly={readOnly}
        onSetValue={onChangeTitle}
        onChange={onChangeTitle}
        id={DASHBOARD_TITLE_INPUT_ID}
        placeholder="New dashboard"
        level={3}>
        {title}
      </EditableTitle>

      {(description || !readOnly) && (
        <InputTextArea
          variant="ghost"
          className={'py-0! pl-0!'}
          readOnly={readOnly}
          onChange={onChangeDashboardDescription}
          defaultValue={description}
          autoResize={descriptionAutoResize}
          placeholder="Add description..."
        />
      )}
    </div>
  );
});
DashboardEditTitles.displayName = 'DashboardEditTitles';
