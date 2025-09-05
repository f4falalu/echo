import React, { useMemo } from 'react';
import {
  Breadcrumb,
  type BreadcrumbItemType,
  createBreadcrumbItems,
} from '@/components/ui/breadcrumb';

export const DatasetBreadcrumb: React.FC<{
  datasetName?: string;
}> = React.memo(({ datasetName }) => {
  const breadcrumbItems: BreadcrumbItemType[] = useMemo(() => {
    return createBreadcrumbItems([
      {
        label: 'Datasets',
        link: {
          to: '/app/datasets',
        },
      },
      { label: datasetName ?? '' },
    ]).filter((item) => item.label);
  }, [datasetName]);

  return <Breadcrumb items={breadcrumbItems} />;
});

DatasetBreadcrumb.displayName = 'DatasetBreadcrumb';
