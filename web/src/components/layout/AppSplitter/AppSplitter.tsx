'use client';

import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import SplitPane, { Pane } from './SplitPane';
import { createAutoSaveId } from './helper';
import Cookies from 'js-cookie';
import { createStyles } from 'antd-style';

// First, define the ref type
export interface AppSplitterRef {
  setSplitSizes: (newSizes: (number | string)[]) => void;
  animateWidth: (width: string, side: 'left' | 'right', duration?: number) => Promise<void>;
}

export const AppSplitter = forwardRef<
  AppSplitterRef,
  {
    leftChildren: React.ReactNode;
    rightChildren: React.ReactNode;
    autoSaveId: string;
    defaultLayout: (string | number)[];
    leftPanelMinSize?: number | string;
    rightPanelMinSize?: number | string;
    leftPanelMaxSize?: number | string;
    rightPanelMaxSize?: number | string;
    className?: string;
    allowResize?: boolean;
    split?: 'vertical' | 'horizontal';
    splitterClassName?: string;
    preserveSide: 'left' | 'right' | null;
    rightHidden?: boolean;
    leftHidden?: boolean;
    style?: React.CSSProperties;
    hideSplitter?: boolean;
  }
>(
  (
    {
      style,
      leftChildren,
      preserveSide,
      rightChildren,
      autoSaveId,
      defaultLayout,
      leftPanelMinSize,
      rightPanelMinSize,
      split = 'vertical',
      leftPanelMaxSize,
      rightPanelMaxSize,
      allowResize,
      className = '',
      splitterClassName = '',
      leftHidden,
      rightHidden,
      hideSplitter
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    const [sizes, setSizes] = useState<(number | string)[]>(defaultLayout);
    const hasHidden = useMemo(() => leftHidden || rightHidden, [leftHidden, rightHidden]);
    const _allowResize = useMemo(() => (hasHidden ? false : allowResize), [hasHidden, allowResize]);

    const _sizes = useMemo(
      () => (hasHidden ? (leftHidden ? ['0px', 'auto'] : ['auto', '0px']) : sizes),
      [hasHidden, leftHidden, sizes]
    );

    const memoizedLeftPaneStyle = useMemo(() => {
      return {
        display: leftHidden ? 'none' : undefined
      };
    }, [leftHidden]);

    const memoizedRightPaneStyle = useMemo(() => {
      return {
        display: rightHidden ? 'none' : undefined
      };
    }, [rightHidden]);

    const sashRender = useMemoizedFn((_: number, active: boolean) => (
      <AppSplitterSash
        hideSplitter={hideSplitter}
        active={active}
        splitterClassName={splitterClassName}
        splitDirection={split}
      />
    ));

    const onDragEnd = useMemoizedFn(() => {
      setIsDragging(false);
    });

    const onDragStart = useMemoizedFn(() => {
      setIsDragging(true);
    });

    const onChangePanels = useMemoizedFn((sizes: number[]) => {
      if (!isDragging) return;
      setSizes(sizes);
      const key = createAutoSaveId(autoSaveId);
      const sizesString = preserveSide === 'left' ? [sizes[0], 'auto'] : ['auto', sizes[1]];
      Cookies.set(key, JSON.stringify(sizesString), { expires: 365 });
    });

    const onPreserveSide = useMemoizedFn(() => {
      const [left, right] = sizes;
      if (preserveSide === 'left') {
        setSizes([left, 'auto']);
      } else if (preserveSide === 'right') {
        setSizes(['auto', right]);
      }
    });

    useEffect(() => {
      if (preserveSide && !hideSplitter && split === 'vertical') {
        window.addEventListener('resize', onPreserveSide);
        return () => {
          window.removeEventListener('resize', onPreserveSide);
        };
      }
    }, [preserveSide]);

    const setSplitSizes = useMemoizedFn((newSizes: (number | string)[]) => {
      // Convert all sizes to percentage strings
      const percentageSizes = newSizes.map((size) =>
        typeof size === 'number' ? `${size * 100}%` : size
      );

      setSizes(percentageSizes);
      if (preserveSide) {
        const key = createAutoSaveId(autoSaveId);
        const sizesString =
          preserveSide === 'left' ? [percentageSizes[0], 'auto'] : ['auto', percentageSizes[1]];
        Cookies.set(key, JSON.stringify(sizesString), { expires: 365 });
      }
    });

    const animateWidth = useMemoizedFn(
      async (width: string, side: 'left' | 'right', duration = 0.25) => {
        const leftPanelSize = _sizes[0];
        const rightPanelSize = _sizes[1];
        const currentSize = side === 'left' ? leftPanelSize : rightPanelSize;
        const isNumeric = typeof leftPanelSize === 'number';

        // Convert current size to number
        const currentSizeNumber = isNumeric
          ? ((currentSize as number) / (Number(leftPanelSize) + Number(rightPanelSize))) * 100
          : parseFloat(String(currentSize).replace('%', ''));

        // Convert target width to number (always in percentage scale)
        const targetSizeNumber = parseFloat(width.replace('%', ''));

        const NUMBER_OF_STEPS = 24;
        const stepDuration = (duration * 1000) / NUMBER_OF_STEPS;

        for (let i = 0; i < NUMBER_OF_STEPS + 1; i++) {
          await new Promise((resolve) =>
            setTimeout(() => {
              const progress = i / NUMBER_OF_STEPS;
              const easedProgress = easeInOutCubic(progress);
              const newSizeNumber =
                currentSizeNumber + (targetSizeNumber - currentSizeNumber) * easedProgress;

              // Always use percentage strings
              const newSize = `${newSizeNumber}%`;
              const otherSize = `${100 - newSizeNumber}%`;

              // Update both sides
              const newSizes = side === 'left' ? [newSize, otherSize] : [otherSize, newSize];

              setSplitSizes(newSizes);
              resolve(true);
            }, stepDuration)
          );
        }
      }
    );

    const imperativeHandleMethods = useMemo(() => {
      return () => ({
        setSplitSizes,
        animateWidth
      });
    }, [setSplitSizes, animateWidth]);

    // Add useImperativeHandle to expose the function
    useImperativeHandle(ref, imperativeHandleMethods);

    return (
      <div className="h-full w-full">
        <SplitPane
          split={split}
          className={`${className}`}
          sizes={_sizes}
          style={style}
          allowResize={_allowResize}
          onChange={onChangePanels}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          resizerSize={3}
          sashRender={sashRender}>
          <Pane
            style={memoizedLeftPaneStyle}
            className="left-pane flex h-full flex-col"
            minSize={leftPanelMinSize}
            maxSize={leftPanelMaxSize}>
            {leftHidden ? null : leftChildren}
          </Pane>
          <Pane
            className="right-pane flex h-full flex-col"
            style={memoizedRightPaneStyle}
            minSize={rightPanelMinSize}
            maxSize={rightPanelMaxSize}>
            {rightHidden ? null : rightChildren}
          </Pane>
        </SplitPane>
      </div>
    );
  }
);
AppSplitter.displayName = 'AppSplitter';

const AppSplitterSash: React.FC<{
  active: boolean;
  splitterClassName?: string;
  hideSplitter?: boolean;
  splitDirection?: 'vertical' | 'horizontal';
}> = React.memo(
  ({ active, splitterClassName = '', hideSplitter = false, splitDirection = 'vertical' }) => {
    const { styles, cx } = useStyles();

    return (
      <div
        className={cx(
          splitterClassName,
          styles.splitter,
          'absolute transition',
          `cursor-${splitDirection}-resize`,
          splitDirection === 'vertical' ? 'h-full w-[0.5px]' : 'h-[0.5px] w-full',
          hideSplitter && 'hide',
          active && 'active',
          !active && 'inactive'
        )}
      />
    );
  }
);
AppSplitterSash.displayName = 'AppSplitterSash';

const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const useStyles = createStyles(({ css, token }) => ({
  splitter: css`
    background: ${token.colorPrimary};
    left: 1px;

    &.hide {
      background: transparent;

      &.active {
        background: ${token.colorBorder};
      }
    }

    &:not(.hide) {
      &.active {
        background: ${token.colorPrimary};
      }

      &.inactive {
        background: ${token.colorBorder};
      }
    }
  `
}));
