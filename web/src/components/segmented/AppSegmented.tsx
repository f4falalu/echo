import React, { useMemo } from 'react';
import { ConfigProvider, Segmented, SegmentedProps, ThemeConfig } from 'antd';
import { createStyles } from 'antd-style';
import { busterAppStyleConfig } from '@/styles/busterAntDStyleConfig';
import Link from 'next/link';
const token = busterAppStyleConfig.token!;

type SegmentedOption = { value: string; label: string; link?: string; onHover?: () => void };
export interface AppSegmentedProps extends SegmentedProps {
  bordered?: boolean;
  options: SegmentedOption[];
}

const useStyles = createStyles(({ css, token }) => {
  return {
    segmented: css``
  };
});

const THEME_CONFIG: ThemeConfig = {
  components: {
    Segmented: {
      itemColor: token.colorTextDescription,
      trackBg: 'transparent',
      itemSelectedColor: token.colorTextBase,
      itemSelectedBg: token.controlItemBgActive,
      colorBorder: token.colorBorder,
      boxShadowTertiary: 'none'
    }
  }
};

export const AppSegmented = React.memo<AppSegmentedProps>(
  ({ size = 'small', bordered = true, options: optionsProps, ...props }) => {
    const { cx, styles } = useStyles();

    const options = useMemo(() => {
      return optionsProps.map((option) => ({
        value: option.value,
        label: <SegmentedItem option={option} />
      }));
    }, [optionsProps]);

    return (
      <ConfigProvider theme={THEME_CONFIG}>
        <Segmented
          {...props}
          options={options}
          size={size}
          className={cx(
            styles.segmented,
            props.className,
            '!shadow-none',
            !bordered && 'no-border'
          )}
        />
      </ConfigProvider>
    );
  }
);
AppSegmented.displayName = 'AppSegmented';

const SegmentedItem: React.FC<{ option: SegmentedOption }> = ({ option }) => {
  return (
    <SegmentedItemLink href={option.link}>
      <div onClick={option.onHover}>{option.label}</div>
    </SegmentedItemLink>
  );
};

const SegmentedItemLink: React.FC<{ href?: string; children: React.ReactNode }> = ({
  href,
  children
}) => {
  if (!href) return children;
  return <Link href={href}>{children}</Link>;
};
