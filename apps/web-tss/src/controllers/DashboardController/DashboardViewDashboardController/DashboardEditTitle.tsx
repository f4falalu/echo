import React, { useRef } from 'react';
import { useUpdateDashboard } from '@/api/buster_rest/dashboards';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { useMount } from '@/hooks/useMount';

export const DASHBOARD_TITLE_INPUT_ID = (dashboardId: string) => `${dashboardId}-title-input`;

const DEFAULT_TITLE = 'Untitled Dashboard';

export const DashboardEditTitles: React.FC<{
  title: string;
  description: string;
  readOnly?: boolean;
  dashboardId: string;
}> = React.memo(({ readOnly, title, description, dashboardId }) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: onUpdateDashboard } = useUpdateDashboard({
    saveToServer: false,
  });

  const onChangeTitle = (name: string) => {
    if (!readOnly) onUpdateDashboard({ name, id: dashboardId, description });
  };

  const onChangeDashboardDescription = (value: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!readOnly) {
      onUpdateDashboard({ description: value.target.value, id: dashboardId, name: title });
    }
  };

  useMount(() => {
    const isDefaultTitle = title === DEFAULT_TITLE;
    if (isDefaultTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  });

  return (
    <div className="flex flex-col space-y-1.5">
      <EditableTitle
        ref={titleRef}
        className="w-full truncate"
        readOnly={readOnly}
        onSetValue={onChangeTitle}
        onChange={onChangeTitle}
        id={DASHBOARD_TITLE_INPUT_ID(dashboardId)}
        placeholder="New dashboard"
        level={3}
      >
        {title}
      </EditableTitle>

      {(description || !readOnly) && (
        <InputTextArea
          variant="ghost"
          readOnly={readOnly}
          onChange={onChangeDashboardDescription}
          value={description}
          minRows={1}
          maxRows={25}
          className={'py-0! pl-0!'}
          placeholder="Add description..."
        />
      )}
    </div>
  );
});
DashboardEditTitles.displayName = 'DashboardEditTitles';
