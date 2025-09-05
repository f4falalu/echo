import type React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

interface AppSplitterProviderProps {
  animateWidth: (width: string | number, side: 'left' | 'right', duration: number) => Promise<void>;
  setSplitSizes: (sizes: [string | number, string | number]) => void;
  isSideClosed: (side: 'left' | 'right') => boolean;
  getSizesInPixels: () => [number, number];
  sizes: [string | number, string | number];
}

const AppSplitterContext = createContext<AppSplitterProviderProps>({
  animateWidth: async () => {},
  setSplitSizes: () => {},
  isSideClosed: () => false,
  getSizesInPixels: () => [0, 0],
  sizes: ['0', '0'],
});

export const AppSplitterProvider: React.FC<
  AppSplitterProviderProps & { children: React.ReactNode }
> = ({ children, ...props }) => {
  return <AppSplitterContext.Provider value={props}>{children}</AppSplitterContext.Provider>;
};

const useAppSplitterContext = <T,>(selector: (value: AppSplitterProviderProps) => T) =>
  useContextSelector(AppSplitterContext, selector);

const stableAnimateWidth = (p: AppSplitterProviderProps) => p.animateWidth;
export const useAppSplitterAnimateWidth = () => {
  return useAppSplitterContext(stableAnimateWidth);
};

const stableGetSizesInPixels = (p: AppSplitterProviderProps) => p.getSizesInPixels;
export const useAppSplitterSizesInPixels = () => {
  return useAppSplitterContext(stableGetSizesInPixels);
};

const stableSizes = (p: AppSplitterProviderProps) => p.sizes;
export const useAppSplitterSizes = () => {
  return useAppSplitterContext(stableSizes);
};
