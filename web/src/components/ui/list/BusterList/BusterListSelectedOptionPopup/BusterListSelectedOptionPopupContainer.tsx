import { AppMaterialIcons } from '@/components/ui';
import { Text } from '@/components/ui';
import { useAntToken } from '@/styles/useAntToken';
import { createStyles } from 'antd-style';
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PopupContainer, PopupSplitter } from '@/components/ui/popup/PopupContainer';

export const BusterListSelectedOptionPopupContainer: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  buttons?: React.ReactNode[];
  show?: boolean;
}> = ({ selectedRowKeys, onSelectChange, buttons = [], show: showProp }) => {
  const token = useAntToken();

  const show = showProp ?? selectedRowKeys.length > 0;

  return (
    <PopupContainer show={show}>
      <div className="flex w-full items-center space-x-2">
        <SelectedButton selectedRowKeys={selectedRowKeys} onSelectChange={onSelectChange} />

        {buttons.length > 0 && <PopupSplitter />}

        {buttons.map((button, index) => (
          <React.Fragment key={index}>{button}</React.Fragment>
        ))}
      </div>
    </PopupContainer>
  );
};

const useStyles = createStyles(({ token, css }) => ({
  closeSelectedButton: css`
    transition: color 0.2s ease;
    color: ${token.colorTextSecondary};
    &:hover {
      color: ${token.colorText};
    }
  `
}));

const SelectedButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const token = useAntToken();
  const { styles, cx } = useStyles();
  const text = `${selectedRowKeys.length} selected`;

  return (
    <div
      className="flex items-center"
      style={{
        backgroundColor: token.colorBgContainer,
        borderRadius: token.borderRadius,
        padding: `0 ${0}px 0 ${token.paddingXS}px`,
        height: token.controlHeight,
        border: `0.5px dashed ${token.colorBorder}`
      }}>
      <Text>{text}</Text>

      <div
        className="ml-1.5"
        style={{
          borderLeft: `0.5px dashed ${token.colorBorder}`,
          height: token.controlHeight - 2
        }}
      />
      <div
        onClick={() => {
          onSelectChange([]);
        }}
        className={cx(
          'flex cursor-pointer items-center justify-center px-0.5',
          styles.closeSelectedButton
        )}>
        <AppMaterialIcons icon="close" />
      </div>
    </div>
  );
};
