import { BusterDatasetListItem } from '@/api/buster_rest/datasets';
import { AppMaterialIcons } from '@/components';
import { SelectProps, Select } from 'antd';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';
import { BsStars } from 'react-icons/bs';
import { Text } from '@/components/text';
import { useMemoizedFn } from 'ahooks';
import { createStyles } from 'antd-style';

export const NewChatModalDataSourceSelect: React.FC<{
  dataSources: BusterDatasetListItem[];
  onSetSelectedChatDataSource: (dataSource: BusterDatasetListItem | null) => void;
  selectedChatDataSource: BusterDatasetListItem | null;
  loading: boolean;
}> = React.memo(({ dataSources, selectedChatDataSource, onSetSelectedChatDataSource, loading }) => {
  const { styles } = useStyles();

  const AutoSelectDataSource = useMemo(
    () => ({
      label: (
        <div className="flex items-center space-x-1">
          <BsStars size={14} className={`min-w-[14px] ${styles.icon}`} />
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
            <AppMaterialIcons className={styles.icon} icon="database" />
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

const useStyles = createStyles(({ css, token }) => ({
  icon: css`
    color: ${token.colorIcon};
  `
}));
