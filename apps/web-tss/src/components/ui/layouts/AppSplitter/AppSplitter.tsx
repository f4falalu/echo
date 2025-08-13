'use client';

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useCookieState } from '@/hooks/useCookieState';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/classMerge';
import type { AppSplitterRef, IAppSplitterProps, SplitterState } from './AppSplitter.types';
import { AppSplitterProvider } from './AppSplitterProvider';
import { createAutoSaveId, easeInOutCubic, sizeToPixels } from './helpers';
import { Panel } from './Panel';
import { Splitter } from './Splitter';
import { useDefaultValue } from './useDefaultValue';
import { useInitialValue } from './useInitialValue';

// ================================
// INTERFACES AND TYPES
// ================================

const AppSplitterContext = createContext<{
  splitterAutoSaveId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}>({
  splitterAutoSaveId: '',
  containerRef: { current: null },
});

const useAppSplitterContext = () => {
  return useContext(AppSplitterContext);
};

// ================================
// MAIN COMPONENT
// ================================

/**
 * AppSplitter - A resizable split panel component with localStorage persistence
 *
 * Features:
 * - Horizontal or vertical splitting
 * - Drag to resize with constraints
 * - Auto-save layout to localStorage
 * - Smooth animations
 * - Responsive container resizing
 * - Panel hiding/showing
 * - Imperative API via ref
 */
const AppSplitterWrapper = forwardRef<AppSplitterRef, IAppSplitterProps>(
  ({ autoSaveId, style, className, split = 'vertical', ...props }, componentRef) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isVertical = split === 'vertical';
    const [mounted, setMounted] = useState(
      !props.leftPanelMinSize &&
        !props.rightPanelMinSize &&
        !props.leftPanelMaxSize &&
        !props.rightPanelMaxSize
    );
    const splitterAutoSaveId = createAutoSaveId(autoSaveId);

    const { splitterAutoSaveId: parentSplitterAutoSaveId } = useAppSplitterContext();
    const {
      leftPanelMinSize,
      preserveSide,
      rightPanelMinSize,
      leftPanelMaxSize,
      rightPanelMaxSize,
    } = props;

    // Calculate initialValue using custom hook

    useMount(async () => {
      //we need to wait for the parent to be mounted and the container to be sized
      if (parentSplitterAutoSaveId || !containerRef.current?.offsetWidth) {
        requestAnimationFrame(() => {
          setMounted(true);
        });
      } else {
        setMounted(true);
      }
    });

    const initialValue = useInitialValue({
      initialLayout: props.initialLayout,
      split,
      preserveSide,
      leftPanelMinSize,
      rightPanelMinSize,
      leftPanelMaxSize,
      rightPanelMaxSize,
      containerRef,
      mounted,
    });

    return (
      <AppSplitterContext.Provider value={{ splitterAutoSaveId, containerRef }}>
        <div
          ref={containerRef}
          id={splitterAutoSaveId}
          className={cn('flex h-full w-full', isVertical ? 'flex-row' : 'flex-col', className)}
          style={style}
        >
          {mounted && (
            <AppSplitterBase
              {...props}
              ref={componentRef}
              isVertical={isVertical}
              containerRef={containerRef}
              splitterAutoSaveId={splitterAutoSaveId}
              split={split}
              calculatedInitialValue={initialValue}
            />
          )}
        </div>
      </AppSplitterContext.Provider>
    );
  }
);

AppSplitterWrapper.displayName = 'AppSplitterWrapper';

// ================================
// CORE IMPLEMENTATION
// ================================

const AppSplitterBase = forwardRef<
  AppSplitterRef,
  Omit<IAppSplitterProps, 'autoSaveId' | 'style' | 'className' | 'initialLayout'> & {
    isVertical: boolean;
    containerRef: React.RefObject<HTMLDivElement | null>;
    splitterAutoSaveId: string;
    calculatedInitialValue: number | null;
  }
>(
  (
    {
      leftChildren,
      rightChildren,
      defaultLayout,
      leftPanelMinSize = 0,
      rightPanelMinSize = 0,
      leftPanelMaxSize,
      rightPanelMaxSize,
      allowResize = true,
      splitterClassName,
      preserveSide,
      rightHidden = false,
      leftHidden = false,
      hideSplitter: hideSplitterProp = false,
      leftPanelClassName,
      rightPanelClassName,
      isVertical,
      splitterAutoSaveId,
      containerRef,
      split = 'vertical',
      calculatedInitialValue,
    },
    ref
  ) => {
    // ================================
    // REFS AND STATE
    // ================================

    const startPosRef = useRef(0);
    const startSizeRef = useRef(0);
    const animationRef = useRef<number | null>(null);

    // Consolidated state management
    const [state, setState] = useState<SplitterState>({
      containerSize:
        split === 'vertical'
          ? (containerRef.current?.offsetWidth ?? 0)
          : (containerRef.current?.offsetHeight ?? 0),
      isDragging: false,
      isAnimating: false,
      sizeSetByAnimation: false,
      hasUserInteracted: false,
    });

    // ================================
    // STORAGE MANAGEMENT
    // ================================

    const defaultValue = useDefaultValue({
      defaultLayout,
      split,
      preserveSide,
      leftPanelMinSize,
      rightPanelMinSize,
      leftPanelMaxSize,
      rightPanelMaxSize,
      containerRef,
    });

    // Load saved layout from cookies
    const [savedLayout, setSavedLayout] = useCookieState<number | null>(splitterAutoSaveId, {
      defaultValue,
      initialValue: () => calculatedInitialValue ?? defaultValue(),
    });

    // ================================
    // SIZE CALCULATION LOGIC
    // ================================

    // Calculate initial size based on default layout
    const calculateInitialSize = useMemoizedFn((containerSize: number): number => {
      if (containerSize === 0) return 0;

      const [leftValue, rightValue] = defaultLayout;

      if (preserveSide === 'left' && leftValue !== 'auto') {
        return sizeToPixels(leftValue, containerSize);
      } else if (preserveSide === 'right' && rightValue !== 'auto') {
        return sizeToPixels(rightValue, containerSize);
      }
      if (preserveSide === 'left') {
        return containerSize;
      }
      if (preserveSide === 'right') {
        return containerSize;
      }

      return 280; // Default fallback
    });

    // Calculate size constraints once per container size change
    const constraints = useMemo(() => {
      if (!state.containerSize) return null;

      return {
        leftMin: sizeToPixels(leftPanelMinSize, state.containerSize),
        leftMax: leftPanelMaxSize
          ? sizeToPixels(leftPanelMaxSize, state.containerSize)
          : state.containerSize,
        rightMin: sizeToPixels(rightPanelMinSize, state.containerSize),
        rightMax: rightPanelMaxSize
          ? sizeToPixels(rightPanelMaxSize, state.containerSize)
          : state.containerSize,
      };
    }, [
      state.containerSize,
      leftPanelMinSize,
      rightPanelMinSize,
      leftPanelMaxSize,
      rightPanelMaxSize,
    ]);

    // Apply constraints to a size value
    const applyConstraints = useMemoizedFn((size: number): number => {
      if (!constraints || !state.containerSize) return size;

      let constrainedSize = size;

      if (preserveSide === 'left') {
        constrainedSize = Math.max(constraints.leftMin, Math.min(size, constraints.leftMax));
        const rightSize = state.containerSize - constrainedSize;

        if (rightSize < constraints.rightMin) {
          constrainedSize = state.containerSize - constraints.rightMin;
        }
        if (rightSize > constraints.rightMax) {
          constrainedSize = state.containerSize - constraints.rightMax;
        }
      } else {
        constrainedSize = Math.max(constraints.rightMin, Math.min(size, constraints.rightMax));
        const leftSize = state.containerSize - constrainedSize;

        if (leftSize < constraints.leftMin) {
          constrainedSize = state.containerSize - constraints.leftMin;
        }
        if (leftSize > constraints.leftMax) {
          constrainedSize = state.containerSize - constraints.leftMax;
        }
      }

      return constrainedSize;
    });

    // Calculate panel sizes with simplified logic
    const { leftSize, rightSize } = useMemo(() => {
      const { containerSize, isAnimating, sizeSetByAnimation, isDragging, hasUserInteracted } =
        state;

      if (!containerSize) {
        return { leftSize: 0, rightSize: 0 };
      }

      // Handle hidden panels
      if (leftHidden && !rightHidden) return { leftSize: 0, rightSize: containerSize };
      if (rightHidden && !leftHidden) return { leftSize: containerSize, rightSize: 0 };
      if (leftHidden && rightHidden) return { leftSize: 0, rightSize: 0 };

      const currentSize = savedLayout ?? 0;

      // Check if a panel is at 0px and should remain at 0px
      const isLeftPanelZero = currentSize === 0 && preserveSide === 'left';
      const isRightPanelZero = currentSize === 0 && preserveSide === 'right';

      // If a panel is at 0px, keep it at 0px and give all space to the other panel
      if (isLeftPanelZero) {
        return { leftSize: 0, rightSize: containerSize };
      }
      if (isRightPanelZero) {
        return { leftSize: containerSize, rightSize: 0 };
      }

      // During animation or when size was set by animation (and not currently dragging),
      // don't apply constraints to allow smooth animations
      const shouldApplyConstraints =
        !isAnimating && !sizeSetByAnimation && hasUserInteracted && !isDragging;

      const finalSize = shouldApplyConstraints ? applyConstraints(currentSize) : currentSize;

      if (preserveSide === 'left') {
        const left = Math.max(0, finalSize);
        const right = Math.max(0, containerSize - left);
        return { leftSize: left, rightSize: right };
      } else {
        const right = Math.max(0, finalSize);
        const left = Math.max(0, containerSize - right);
        return { leftSize: left, rightSize: right };
      }
    }, [state, savedLayout, leftHidden, rightHidden, preserveSide, applyConstraints]);

    // ================================
    // CONTAINER RESIZE HANDLING
    // ================================

    // Update container size and handle initialization
    const updateContainerSize = useMemoizedFn(() => {
      if (!containerRef.current) return;

      const size = isVertical
        ? containerRef.current.offsetWidth
        : containerRef.current.offsetHeight;

      setState((prev) => {
        if (prev.containerSize === size) return prev;

        const newState = { ...prev, containerSize: size };

        // Initialize if needed - only when container has actual size
        if (!prev.isAnimating && size > 0) {
          // Set initial size if no saved layout exists
          if (savedLayout === null || savedLayout === undefined) {
            const initialSize = calculateInitialSize(size);
            setSavedLayout(initialSize);
          }
        }

        // Handle container resize when one panel is at 0px
        // Only adjust layout during resize if we're not currently animating
        if (prev.containerSize > 0 && size > 0 && savedLayout !== null && !prev.isAnimating) {
          const currentSavedSize = savedLayout;

          // If a panel is at 0px, preserve the other panel's size during resize
          if (currentSavedSize === 0) {
            if (preserveSide === 'left') {
              // Left panel is 0px, preserve right panel's size (which is the full previous container)
              setSavedLayout(0); // Keep left at 0
            } else {
              // Right panel is 0px, preserve left panel's size (which is the full previous container)
              setSavedLayout(0); // Keep right at 0
            }
          } else {
            // Check if the current layout represents a panel that should remain preserved
            const oldContainerSize = prev.containerSize;

            if (preserveSide === 'left') {
              // If left panel was at full size (right was 0), keep it at full size
              if (currentSavedSize === oldContainerSize) {
                setSavedLayout(size);
              }
            } else {
              // If right panel was at full size (left was 0), keep it at full size
              if (currentSavedSize === oldContainerSize) {
                setSavedLayout(size);
              }
            }
          }
        }

        return newState;
      });
    });

    // ================================
    // ANIMATION LOGIC
    // ================================

    // Animation function
    const animateWidth = useMemoizedFn(
      async (
        width: string | number,
        side: 'left' | 'right',
        duration: number = 250
      ): Promise<void> => {
        return new Promise((resolve) => {
          if (!state.containerSize) {
            resolve();
            return;
          }

          setState((prev) => ({ ...prev, isAnimating: true }));

          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }

          // Convert target to pixels and clamp to constraints
          const targetPixelsRaw = sizeToPixels(width, state.containerSize);
          const constrainedTargetPixels = applyConstraints(
            preserveSide === 'left' ? targetPixelsRaw : state.containerSize - targetPixelsRaw
          );
          let targetSize: number;

          if (side === 'left') {
            targetSize =
              preserveSide === 'left'
                ? constrainedTargetPixels
                : state.containerSize - constrainedTargetPixels;
          } else {
            targetSize =
              preserveSide === 'right'
                ? constrainedTargetPixels
                : state.containerSize - constrainedTargetPixels;
          }

          const startSize = savedLayout ?? 0;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutCubic(progress);

            const currentSize = startSize + (targetSize - startSize) * easedProgress;
            setSavedLayout(currentSize);

            if (progress < 1) {
              animationRef.current = requestAnimationFrame(animate);
            } else {
              animationRef.current = null;
              setState((prev) => ({
                ...prev,
                isAnimating: false,
                sizeSetByAnimation: true,
              }));
              resolve();
            }
          };

          animationRef.current = requestAnimationFrame(animate);
        });
      }
    );

    // ================================
    // IMPERATIVE API METHODS
    // ================================

    // Set split sizes function
    const setSplitSizes = useMemoizedFn((sizes: [string | number, string | number]) => {
      if (!state.containerSize) return;

      const [leftValue, rightValue] = sizes;

      // Calculate both potential sizes
      const leftPixels = leftValue !== 'auto' ? sizeToPixels(leftValue, state.containerSize) : 0;
      const rightPixels = rightValue !== 'auto' ? sizeToPixels(rightValue, state.containerSize) : 0;

      // Determine which side to actually preserve based on which panel has content (non-zero size)
      let effectivePreserveSide = preserveSide;

      if (preserveSide === 'left' && leftValue !== 'auto') {
        // If left panel would be 0px, preserve right side instead
        if (leftPixels === 0 && rightValue !== 'auto') {
          effectivePreserveSide = 'right';
        }
      } else if (preserveSide === 'right' && rightValue !== 'auto') {
        // If right panel would be 0px, preserve left side instead
        if (rightPixels === 0 && leftValue !== 'auto') {
          effectivePreserveSide = 'left';
        }
      }

      // Apply the preservation logic with the effective side
      if (effectivePreserveSide === 'left' && leftValue !== 'auto') {
        setSavedLayout(applyConstraints(leftPixels));
      } else if (effectivePreserveSide === 'right' && rightValue !== 'auto') {
        setSavedLayout(applyConstraints(rightPixels));
      }

      setState((prev) => ({ ...prev, sizeSetByAnimation: false }));
    });

    // Check if side is closed
    const isSideClosed = useCallback(
      (side: 'left' | 'right') => {
        if (side === 'left') {
          return leftHidden || leftSize === 0;
        } else {
          return rightHidden || rightSize === 0;
        }
      },
      [leftHidden, rightHidden, leftSize, rightSize]
    );

    // Get sizes in pixels
    const getSizesInPixels = useCallback((): [number, number] => {
      return [leftSize, rightSize];
    }, [leftSize, rightSize]);

    // ================================
    // MOUSE EVENT HANDLERS
    // ================================

    const handleMouseDown = useMemoizedFn((e: React.MouseEvent) => {
      if (!allowResize) return;

      setState((prev) => ({
        ...prev,
        isDragging: true,
        hasUserInteracted: true,
        sizeSetByAnimation: false,
      }));

      startPosRef.current = isVertical ? e.clientX : e.clientY;
      startSizeRef.current = savedLayout ?? 0;
      e.preventDefault();
    });

    const handleMouseMove = useMemoizedFn((e: MouseEvent) => {
      if (!state.isDragging || !state.containerSize) return;

      const currentPos = isVertical ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;

      let newSize: number;

      if (preserveSide === 'left') {
        newSize = startSizeRef.current + delta;
      } else {
        newSize = startSizeRef.current - delta;
      }

      const constrainedSize = applyConstraints(newSize);
      setSavedLayout(constrainedSize);
    });

    const handleMouseUp = useMemoizedFn(() => {
      setState((prev) => ({ ...prev, isDragging: false }));
    });

    // ================================
    // EFFECTS AND LIFECYCLE
    // ================================

    // Container resize monitoring
    useEffect(() => {
      updateContainerSize();

      // If container is still 0 after layout, try again with animation frame
      if (containerRef.current?.offsetWidth === 0 || containerRef.current?.offsetHeight === 0) {
        requestAnimationFrame(updateContainerSize);
      }

      const resizeObserver = new ResizeObserver(updateContainerSize);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      window.addEventListener('resize', updateContainerSize);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateContainerSize);
      };
    }, [updateContainerSize]);

    // Mouse event handling during drag
    useEffect(() => {
      if (state.isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = isVertical ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        };
      }
    }, [state.isDragging, handleMouseMove, handleMouseUp, isVertical]);

    // Expose imperative API via ref
    useImperativeHandle(
      ref,
      () => ({
        animateWidth,
        setSplitSizes,
        isSideClosed,
        getSizesInPixels,
      }),
      [animateWidth, setSplitSizes, isSideClosed, getSizesInPixels]
    );

    // ================================
    // RENDER LOGIC
    // ================================

    // Determine if splitter should be hidden
    const shouldHideSplitter =
      hideSplitterProp || (leftHidden && rightHidden) || leftSize === 0 || rightSize === 0;

    const showSplitter = !leftHidden && !rightHidden;

    const sizes: [string | number, string | number] = [`${leftSize}px`, `${rightSize}px`];

    const content = (
      <>
        <Panel
          className={leftPanelClassName}
          width={isVertical ? leftSize : 'auto'}
          height={!isVertical ? leftSize : 'auto'}
          hidden={leftHidden}
        >
          {leftChildren}
        </Panel>
        {showSplitter && (
          <Splitter
            onMouseDown={handleMouseDown}
            isDragging={state.isDragging}
            split={split}
            className={splitterClassName}
            disabled={!allowResize}
            hidden={shouldHideSplitter}
          />
        )}
        <Panel
          className={rightPanelClassName}
          width={isVertical ? rightSize : 'auto'}
          height={!isVertical ? rightSize : 'auto'}
          hidden={rightHidden}
        >
          {rightChildren}
        </Panel>
      </>
    );

    return (
      <AppSplitterProvider
        animateWidth={animateWidth}
        setSplitSizes={setSplitSizes}
        isSideClosed={isSideClosed}
        getSizesInPixels={getSizesInPixels}
        sizes={sizes}
      >
        {content}
      </AppSplitterProvider>
    );
  }
);

export const AppSplitter = React.memo(AppSplitterWrapper);

AppSplitter.displayName = 'AppSplitter';
AppSplitterBase.displayName = 'AppSplitterBase';
