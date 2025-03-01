import { AppSegmented } from '@/components/ui';
import { useMemoizedFn } from 'ahooks';
import { createStyles } from 'antd-style';
import { type SegmentedItem } from '@/components/ui/segmented';
import React from 'react';

export enum EditorApps {
  PREVIEW = 'preview',
  METADATA = 'metadata'
}

const options = [
  { label: 'SQL', value: EditorApps.PREVIEW },
  { label: 'Metadata', value: EditorApps.METADATA }
];

export const EditorContainerSubHeader: React.FC<{
  selectedApp: EditorApps;
  setSelectedApp: (app: EditorApps) => void;
}> = React.memo(({ selectedApp, setSelectedApp }) => {
  const { styles, cx } = useStyles();

  const onSegmentedChange = useMemoizedFn((value: SegmentedItem<EditorApps>) => {
    setSelectedApp(value.value);
  });

  return (
    <div className={cx(styles.subHeader, 'flex items-center justify-between px-4')}>
      <AppSegmented options={options} value={selectedApp} onChange={onSegmentedChange} />
    </div>
  );
});

EditorContainerSubHeader.displayName = 'EditorContainerSubHeader';

const useStyles = createStyles(({ token, css }) => ({
  subHeader: css`
    height: 36px;
    width: 100%;
    background-color: ${token.colorBgContainerDisabled};
    border-bottom: 0.5px solid ${token.colorBorder};
  `
}));
