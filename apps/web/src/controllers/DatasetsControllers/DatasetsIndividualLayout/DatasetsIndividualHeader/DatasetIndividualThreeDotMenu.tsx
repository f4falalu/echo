import { useNavigate } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { useDeleteDataset } from '@/api/buster_rest/datasets';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import { Dots, Trash } from '@/components/ui/icons';

export const DatasetIndividualThreeDotMenu: React.FC<{
  datasetId?: string;
}> = React.memo(({ datasetId }) => {
  const navigate = useNavigate();
  const { mutateAsync: onDeleteDataset } = useDeleteDataset();

  const items: IDropdownItems = useMemo(() => {
    return [
      {
        value: '1',
        label: 'Delete dataset',
        icon: <Trash />,
        onClick: datasetId
          ? async () => {
              await onDeleteDataset([datasetId]);
              await navigate({
                to: '/app/datasets',
              });
            }
          : undefined,
      },
    ];
  }, [datasetId, onDeleteDataset]);

  return (
    <Dropdown items={items} side={'bottom'} align={'end'}>
      <Button variant={'ghost'} prefix={<Dots />} />
    </Dropdown>
  );
});
DatasetIndividualThreeDotMenu.displayName = 'DatasetIndividualThreeDotMenu';
