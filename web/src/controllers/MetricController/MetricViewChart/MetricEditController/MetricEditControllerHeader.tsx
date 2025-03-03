import { createStyles } from 'antd-style';
import React from 'react';
import { Text } from '@/components/ui';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components/ui';
import { useChatLayoutContextSelector } from '@chatLayout/ChatLayoutContext';

export const MetricEditControllerHeader: React.FC = React.memo(() => {
  const { styles, cx } = useStyles();
  const closeSecondaryView = useChatLayoutContextSelector((x) => x.closeSecondaryView);

  return (
    <div className={cx(styles.container, 'flex items-center justify-between', 'px-4 py-2.5')}>
      <Text>Edit chart</Text>
      <Button onClick={closeSecondaryView} type="text" icon={<AppMaterialIcons icon="close" />} />
    </div>
  );
});

MetricEditControllerHeader.displayName = 'MetricEditControllerHeader';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    height: 38px;
    min-height: 38px;
    border-bottom: 0.5px solid ${token.colorBorder};
  `
}));
