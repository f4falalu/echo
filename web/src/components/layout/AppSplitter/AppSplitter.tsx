'use client';

import { useMemoizedFn } from 'ahooks';
import React, {
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef
} from 'react';
import SplitPane, { Pane } from './SplitPane';
import { createAutoSaveId, setAppSplitterCookie } from './helper';
import Cookies from 'js-cookie';
import { createStyles } from 'antd-style';

// First, define the ref type
export interface AppSplitterRef {
  setSplitSizes: (newSizes: (number | string)[]) => void;
  animateWidth: (width: string, side: 'left' | 'right', duration?: number) => Promise<void>;
}

export const AppSplitter = React.memo(
  forwardRef<
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
      const containerRef = useRef<HTMLDivElement>(null);
      const [isDragging, setIsDragging] = useState(false);
      const [sizes, setSizes] = useState<(number | string)[]>(defaultLayout);
      const hasHidden = useMemo(() => leftHidden || rightHidden, [leftHidden, rightHidden]);
      const _allowResize = useMemo(
        () => (hasHidden ? false : allowResize),
        [hasHidden, allowResize]
      );

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
          setAppSplitterCookie(key, sizesString);
        }
      });

      const animateWidth = useMemoizedFn(
        async (width: string, side: 'left' | 'right', duration = 0.25) => {
          const { value: targetValue, unit: targetUnit } = parseWidthValue(width);
          const container = containerRef.current;
          if (!container) return;

          const containerWidth = container.getBoundingClientRect().width;
          let targetPercentage: number;

          // Convert target width to percentage
          if (targetUnit === 'px') {
            targetPercentage = convertPxToPercentage(targetValue, containerWidth);
          } else {
            targetPercentage = targetValue;
          }

          const bothSizesAreNumber = typeof _sizes[0] === 'number' && typeof _sizes[1] === 'number';
          const leftPanelSize = bothSizesAreNumber
            ? `${(Number(_sizes[0]) / (Number(_sizes[0]) + Number(_sizes[1]))) * 100}%`
            : _sizes[0];
          const rightPanelSize = bothSizesAreNumber
            ? `${(Number(_sizes[1]) / (Number(_sizes[0]) + Number(_sizes[1]))) * 100}%`
            : _sizes[1];
          const currentSize = side === 'left' ? leftPanelSize : rightPanelSize;
          const otherSize = side === 'left' ? rightPanelSize : leftPanelSize;

          // Calculate current percentage considering 'auto' cases
          const currentSizeNumber = getCurrentSizePercentage(currentSize, otherSize, container);

          await new Promise((resolve) => {
            const startTime = performance.now();
            const endTime = startTime + duration * 1000;

            const animate = (currentTime: number) => {
              const elapsedTime = currentTime - startTime;
              const progress = Math.min(elapsedTime / (duration * 1000), 1);

              const easedProgress = easeInOutCubic(progress);
              const newSizeNumber =
                currentSizeNumber + (targetPercentage - currentSizeNumber) * easedProgress;

              const newSize = `${newSizeNumber}%`;
              const otherSize = `${100 - newSizeNumber}%`;

              const newSizes = side === 'left' ? [newSize, otherSize] : [otherSize, newSize];
              setSplitSizes(newSizes);

              if (currentTime < endTime) {
                requestAnimationFrame(animate);
              } else {
                resolve(true);
              }
            };

            requestAnimationFrame(animate);
          });
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
        <div className="h-full w-full" ref={containerRef}>
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
  )
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

const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const parseWidthValue = (width: string): { value: number; unit: 'px' | '%' } => {
  const match = width.match(/^(\d+(?:\.\d+)?)(px|%)$/);
  if (!match) throw new Error('Invalid width format. Must be in px or %');
  return {
    value: parseFloat(match[1]),
    unit: match[2] as 'px' | '%'
  };
};

const convertPxToPercentage = (px: number, containerWidth: number): number => {
  return (px / containerWidth) * 100;
};

const getCurrentSizePercentage = (
  size: string | number,
  otherSize: string | number,
  container: HTMLElement
): number => {
  if (size === 'auto') {
    // If this side is auto, calculate based on the other side
    const otherPercentage = getCurrentSizePercentage(otherSize, size, container);
    return 100 - otherPercentage;
  }

  if (typeof size === 'number') {
    return size;
  }

  // Handle percentage
  if (size.endsWith('%')) {
    return parseFloat(size);
  }

  // Handle pixel values
  if (size.endsWith('px')) {
    const pixels = parseFloat(size);
    return convertPxToPercentage(pixels, container.getBoundingClientRect().width);
  }

  return 0;
};
