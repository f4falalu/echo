import { createStyles } from 'antd-style';
import { Text } from '@/components/ui';
import React from 'react';

export const VersionPill: React.FC<{ version_number: number }> = React.memo(
  ({ version_number = 1 }) => {
    const { cx, styles } = useStyles();

    const text = `v${version_number}`;

    return (
      <div className={cx(styles.fileVersion, 'flex items-center justify-center')}>
        <Text type="secondary" lineHeight={'100%'} size="sm">
          {text}
        </Text>
      </div>
    );
  }
);

VersionPill.displayName = 'VersionPill';

const useStyles = createStyles(({ token, css }) => {
  return {
    fileVersion: css`
      border-radius: ${token.borderRadius}px;
      padding: 3px;
      background: ${token?.colorFill};
      height: 18px;
      min-width: 18px;
      border: 0.5px solid ${token.colorBorder};
    `
  };
});
