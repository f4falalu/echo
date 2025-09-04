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
import { cn } from '@/lib/classMerge';
import type { AppSplitterRef, IAppSplitterProps, SplitterState } from './AppSplitter.types';
import { AppSplitterProvider } from './AppSplitterProvider';
import { createAutoSaveId } from './create-auto-save-id';
import { easeInOutCubic, sizeToPixels } from './helpers';
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
    const splitterAutoSaveId = createAutoSaveId(autoSaveId);

    const {
      leftPanelMinSize,
      preserveSide,
      rightPanelMinSize,
      leftPanelMaxSize,
      rightPanelMaxSize,
    } = props;

    // Calculate initialValue using custom hook
    const initialValue = useInitialValue({
      initialLayout: props.initialLayout,
      split,
      preserveSide,
      leftPanelMinSize,
      rightPanelMinSize,
      leftPanelMaxSize,
      rightPanelMaxSize,
      containerRef,
    });

    return (
      <AppSplitterContext.Provider value={{ splitterAutoSaveId, containerRef }}>
        <div
          ref={containerRef}
          id={splitterAutoSaveId}
          className={cn('flex h-full w-full', isVertical ? 'flex-row' : 'flex-col', className)}
          style={style}
        >
          <AppSplitterBase
            {...props}
            ref={componentRef}
            isVertical={isVertical}
            containerRef={containerRef}
            splitterAutoSaveId={splitterAutoSaveId}
            split={split}
            calculatedInitialValue={initialValue}
          />
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
    calculatedInitialValue: number | '100%' | null;
  }
>(
  (
    {
      leftChildren,
      rightChildren,
      defaultLayout,
      leftPanelElement = 'div',
      rightPanelElement = 'div',
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
      initialValue: () => {
        // Convert '100%' to null so it gets handled in initialization effect
        if (calculatedInitialValue === '100%') return null;
        return calculatedInitialValue ?? defaultValue();
      },
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

    // Initialize savedLayout if needed
    useEffect(() => {
      if (savedLayout === null && state.containerSize > 0) {
        let initialSize: number;

        if (calculatedInitialValue === '100%') {
          initialSize = state.containerSize;
        } else if (typeof calculatedInitialValue === 'number') {
          initialSize = calculatedInitialValue;
        } else {
          initialSize = calculateInitialSize(state.containerSize);
        }

        setSavedLayout(initialSize);
      }
    }, [
      savedLayout,
      state.containerSize,
      calculatedInitialValue,
      calculateInitialSize,
      setSavedLayout,
    ]);

    // Calculate preserved panel size - non-preserved panel will use flex-1
    const preservedPanelSize = useMemo(() => {
      const { isAnimating, sizeSetByAnimation, isDragging, hasUserInteracted } = state;

      // Handle hidden panels
      if (leftHidden || rightHidden) return 0;

      // Use current saved layout or 0 as fallback
      const currentSize = savedLayout ?? 0;

      // Return 0 immediately for 0px panels (unless animating)
      if (currentSize === 0 && !isAnimating && !sizeSetByAnimation) {
        return 0;
      }

      // Apply constraints only when not animating and user has interacted
      const shouldApplyConstraints =
        !isAnimating && !sizeSetByAnimation && hasUserInteracted && !isDragging;

      return shouldApplyConstraints ? applyConstraints(currentSize) : Math.max(0, currentSize);
    }, [state, savedLayout, leftHidden, rightHidden, applyConstraints]);

    // Determine panel sizes based on preserve side
    const { leftSize, rightSize } = useMemo(() => {
      if (preserveSide === 'left') {
        return { leftSize: preservedPanelSize, rightSize: 'auto' as const };
      } else {
        return { leftSize: 'auto' as const, rightSize: preservedPanelSize };
      }
    }, [preservedPanelSize, preserveSide]);

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
        duration: number = 250,
        honorConstraints: boolean = false
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

          const targetPixelsRaw = sizeToPixels(width, state.containerSize);
          const constrainedTargetPixels = applyConstraints(
            preserveSide === 'left' ? targetPixelsRaw : state.containerSize - targetPixelsRaw
          );
          const targetPixels = honorConstraints ? constrainedTargetPixels : targetPixelsRaw;
          let targetSize: number;

          if (side === 'left') {
            targetSize =
              preserveSide === 'left' ? targetPixels : state.containerSize - targetPixels;
          } else {
            targetSize =
              preserveSide === 'right' ? targetPixels : state.containerSize - targetPixels;
          }

          const startSize = savedLayout ?? 0;
          const startTime = performance.now();

          // Frame-based animation for smoother performance
          // We'll track the expected frame count based on 60fps for timing reference
          const expectedFrameCount = Math.ceil((duration / 1000) * 60);
          let frameCount = 0;
          let lastFrameTime = startTime;

          const animate = (currentTime: number) => {
            frameCount++;
            const deltaTime = currentTime - lastFrameTime;
            lastFrameTime = currentTime;

            // Use frame-based progress as primary, with time-based as fallback
            // This ensures smooth animation even when frames are dropped
            const frameProgress = frameCount / expectedFrameCount;
            const timeProgress = (currentTime - startTime) / duration;

            // Use the more conservative progress to prevent overshooting
            const progress = Math.min(Math.max(frameProgress, timeProgress), 1);
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
          return (
            leftHidden ||
            leftSize === 0 ||
            (preserveSide === 'right' && preservedPanelSize === state.containerSize)
          );
        } else {
          return (
            rightHidden ||
            rightSize === 0 ||
            (preserveSide === 'left' && preservedPanelSize === state.containerSize)
          );
        }
      },
      [
        leftHidden,
        rightHidden,
        leftSize,
        rightSize,
        preserveSide,
        preservedPanelSize,
        state.containerSize,
      ]
    );

    // Get sizes in pixels
    const getSizesInPixels = useCallback((): [number, number] => {
      const containerSize = state.containerSize;

      if (preserveSide === 'left') {
        const left = typeof leftSize === 'number' ? leftSize : 0;
        const right = containerSize - left;
        return [left, right];
      } else {
        const right = typeof rightSize === 'number' ? rightSize : 0;
        const left = containerSize - right;
        return [left, right];
      }
    }, [leftSize, rightSize, preserveSide, state.containerSize]);

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
      hideSplitterProp || (leftHidden && rightHidden) || preservedPanelSize === 0;

    const showSplitter = !leftHidden && !rightHidden;

    const sizes: [string | number, string | number] =
      preserveSide === 'left'
        ? [`${preservedPanelSize}px`, 'auto']
        : ['auto', `${preservedPanelSize}px`];

    const content = (
      <>
        <Panel
          className={leftPanelClassName}
          width={isVertical ? leftSize : 'auto'}
          height={!isVertical ? leftSize : 'auto'}
          hidden={leftHidden}
          as={leftPanelElement}
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
          as={rightPanelElement}
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
