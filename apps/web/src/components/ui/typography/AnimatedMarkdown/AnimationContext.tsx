import type React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

interface AnimationContextValue {
  shouldStopAnimations: boolean;
}

const AnimationContext = createContext<AnimationContextValue | undefined>(undefined);

export const AnimationProvider: React.FC<{
  children: React.ReactNode;
  shouldStopAnimations: boolean;
}> = ({ children, shouldStopAnimations }) => {
  return (
    <AnimationContext.Provider value={{ shouldStopAnimations }}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimationContext = () => {
  const context = useContextSelector(AnimationContext, (x) => x);
  if (!context) {
    // Return default value if context is not provided
    return { shouldStopAnimations: false };
  }
  return context;
};
