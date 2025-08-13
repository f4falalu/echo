export type PanelSize = `${number}px` | `${number}%` | 'auto' | number;
export type LayoutSize = [PanelSize, PanelSize];

export interface IAppSplitterProps {
  /** Content to display in the left panel */
  leftChildren: React.ReactNode;

  /** Content to display in the right panel */
  rightChildren: React.ReactNode;

  /** Unique identifier for auto-saving layout to cookies */
  autoSaveId: string;

  /**
   * Initial preserved-side size from cookies (in pixels)
   */
  initialLayout: LayoutSize | null;

  /**
   * Default layout configuration as [left, right] sizes
   * Can be numbers (pixels), percentages (strings like "50%"), or "auto"
   */
  defaultLayout: LayoutSize;

  /**
   * Minimum size for the left panel
   * Can be a number (pixels) or string (percentage)
   * @default 0
   */
  leftPanelMinSize?: number | string;

  /**
   * Minimum size for the right panel
   * Can be a number (pixels) or string (percentage)
   * @default 0
   */
  rightPanelMinSize?: number | string;

  /**
   * Maximum size for the left panel
   * Can be a number (pixels) or string (percentage)
   * If not specified, defaults to container size
   */
  leftPanelMaxSize?: number | string;

  /**
   * Maximum size for the right panel
   * Can be a number (pixels) or string (percentage)
   * If not specified, defaults to container size
   */
  rightPanelMaxSize?: number | string;

  /** Additional CSS classes for the container */
  className?: string;

  /**
   * Whether the splitter can be resized by dragging
   * @default true
   */
  allowResize?: boolean;

  /**
   * Split direction
   * @default 'vertical'
   */
  split?: 'vertical' | 'horizontal';

  /** Additional CSS classes for the splitter element */
  splitterClassName?: string;

  /**
   * Which side to preserve when resizing
   * 'left' - left panel maintains its size, right panel adjusts
   * 'right' - right panel maintains its size, left panel adjusts
   */
  preserveSide: 'left' | 'right';

  /**
   * Whether to hide the right panel completely
   * @default false
   */
  rightHidden?: boolean;

  /**
   * Whether to hide the left panel completely
   * @default false
   */
  leftHidden?: boolean;

  /** Inline styles for the container */
  style?: React.CSSProperties;

  /**
   * Whether to hide the splitter handle
   * @default false
   */
  hideSplitter?: boolean;

  /** Additional CSS classes for the left panel */
  leftPanelClassName?: string;

  /** Additional CSS classes for the right panel */
  rightPanelClassName?: string;

  /**
   * Whether to clear saved layout from cookies on initialization
   * Can be a boolean or a function that returns a boolean based on preserved side value and container width
   */
  bustStorageOnInit?: boolean | ((preservedSideValue: number | null, refSize: number) => boolean);
}

/**
 * Props for the AppSplitter component
 */

/**
 * Ref interface for controlling the AppSplitter imperatively
 */
export interface AppSplitterRef {
  /**
   * Animate a panel to a specific width
   * @param width - Target width (pixels or percentage)
   * @param side - Which side to animate
   * @param duration - Animation duration in milliseconds
   */
  animateWidth: (
    width: string | number,
    side: 'left' | 'right',
    duration?: number
  ) => Promise<void>;

  /**
   * Set the split sizes programmatically
   * @param sizes - [left, right] sizes as pixels or percentages
   */
  setSplitSizes: (sizes: [string | number, string | number]) => void;

  /**
   * Check if a side is closed (hidden or 0px)
   * @param side - Which side to check
   */
  isSideClosed: (side: 'left' | 'right') => boolean;

  /**
   * Get current sizes in pixels
   * @returns [leftSize, rightSize] in pixels
   */
  getSizesInPixels: () => [number, number];
}

/**
 * Internal state interface for the splitter
 */
export interface SplitterState {
  /** Current container size in pixels */
  containerSize: number;
  /** Whether the user is currently dragging the splitter */
  isDragging: boolean;
  /** Whether an animation is currently in progress */
  isAnimating: boolean;
  /** Whether the current size was set by an animation */
  sizeSetByAnimation: boolean;
  /** Whether the user has interacted with the splitter */
  hasUserInteracted: boolean;
}
