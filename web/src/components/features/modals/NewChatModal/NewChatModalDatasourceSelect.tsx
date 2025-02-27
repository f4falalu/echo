import type { BusterDatasetListItem } from '@/api/asset_interfaces';
import { AppMaterialIcons } from '@/components/ui';
import { SelectProps, Select } from 'antd';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';
import { Text } from '@/components/ui';
import { useMemoizedFn } from 'ahooks';
import { cn } from '@/lib/utils';

export const NewChatModalDataSourceSelect: React.FC<{
  dataSources: BusterDatasetListItem[];
  onSetSelectedChatDataSource: (dataSource: { id: string; name: string } | null) => void;
  selectedChatDataSource: { id: string; name: string } | null;
  loading: boolean;
}> = React.memo(({ dataSources, selectedChatDataSource, onSetSelectedChatDataSource, loading }) => {
  const AutoSelectDataSource = useMemo(
    () => ({
      label: (
        <div className="flex items-center space-x-1">
          <AppMaterialIcons size={14} className={cn(`text-icon-color min-w-[14px]`)} icon="stars" />
          <span>Auto-select</span>
        </div>
      ),
      value: 'auto',
      name: 'Auto-select'
    }),
    []
  );

  const options: SelectProps['options'] = useMemo(() => {
    return [
      AutoSelectDataSource,
      ...dataSources.map((dataSource) => ({
        label: (
          <div className="flex items-center space-x-1">
            <AppMaterialIcons className={cn(`text-icon-color min-w-[14px]`)} icon="database" />
            <Text>{dataSource.name}</Text>
          </div>
        ),
        icon: <AppMaterialIcons icon="database" />,
        name: dataSource.name,
        value: dataSource.id
      }))
    ];
  }, [dataSources]);

  const selected = useMemo(
    () =>
      options.find((option) => option.value === selectedChatDataSource?.id) || AutoSelectDataSource,
    [options, selectedChatDataSource]
  );

  const onSelectPreflight = useMemoizedFn((value: string) => {
    const selectedDataSource = dataSources.find((dataSource) => dataSource.id === value);
    onSetSelectedChatDataSource(selectedDataSource || null);
  });

  const onChange = useMemoizedFn((v: (typeof options)[0]) => {
    onSelectPreflight(v.value as string);
  });

  const onFilter: SelectProps['filterOption'] = useMemoizedFn((v, option) => {
    return option.name?.toLowerCase().includes(v?.toLowerCase());
  });

  return (
    <div>
      <Select
        defaultActiveFirstOption
        defaultValue={options[0]}
        value={selected}
        disabled={isEmpty(dataSources) || loading}
        options={options}
        allowClear={false}
        loading={loading}
        labelInValue={true}
        popupMatchSelectWidth={false}
        onChange={onChange}
        showSearch={true}
        filterOption={onFilter}
      />
    </div>
  );
});
NewChatModalDataSourceSelect.displayName = 'NewChatModalDataSourceSelect';
