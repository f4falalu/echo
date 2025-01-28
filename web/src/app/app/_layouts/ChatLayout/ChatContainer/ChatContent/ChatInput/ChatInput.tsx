import React from 'react';
import { Input, Button } from 'antd';
import { Text } from '@/components/text';
import { createStyles } from 'antd-style';

export const ChatInput: React.FC = () => {
  const { styles, cx } = useStyles();

  return (
    <div
      className={cx(
        styles.inputContainer,
        'relative z-10 flex flex-col items-center space-y-1 px-3 pb-2 pt-0.5'
      )}>
      <Input.TextArea />
      <Text size="xs" type="tertiary">
        Our AI may make mistakes. Check important info.
      </Text>
    </div>
  );
};

const useStyles = createStyles(({ token, css }) => ({
  inputContainer: css`
    box-shadow: 0px -10px 18px 10px ${token.colorBgContainerDisabled};
  `
}));
