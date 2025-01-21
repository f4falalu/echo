import { useDatasetUpdateDatasetGroups } from '@/api/buster-rest';
import { AppMaterialIcons } from '@/components';
import { useMemoizedFn } from 'ahooks';
import { MenuProps, Dropdown, Button } from 'antd';
import React, { useMemo } from 'react';

const options = [
  {
    label: 'Included',
    value: true,
    icon: <AppMaterialIcons icon="done_all" />
  },
  {
    label: 'Not Included',
    value: false,
    icon: <AppMaterialIcons icon="remove_done" />
  }
];

export const PermissionAssignedButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetId: string;
}> = ({ selectedRowKeys, onSelectChange, datasetId }) => {
  const { mutateAsync: updateDatasetGroups } = useDatasetUpdateDatasetGroups(datasetId);

  const onAssignClick = useMemoizedFn(async (assigned: boolean) => {
    try {
      const groups: { id: string; assigned: boolean }[] = selectedRowKeys.map((v) => ({
        id: v,
        assigned
      }));
      await updateDatasetGroups(groups);
      onSelectChange([]);
    } catch (error) {
      //  openErrorMessage('Failed to delete collection');
    }
  });

  const menuProps: MenuProps = useMemo(() => {
    return {
      selectable: true,
      items: options.map((v) => ({
        icon: v.icon,
        label: v.label,
        key: v.value ? 'included' : 'not_included',
        onClick: () => onAssignClick(v.value)
      }))
    };
  }, [selectedRowKeys]);

  const onButtonClick = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
  });

  return (
    <Dropdown menu={menuProps} trigger={['click']}>
      <Button icon={<AppMaterialIcons icon="done_all" />} type="default" onClick={onButtonClick}>
        Included
      </Button>
    </Dropdown>
  );
};
