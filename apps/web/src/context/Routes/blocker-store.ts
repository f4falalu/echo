import { Store, useStore } from '@tanstack/react-store';
import { useCallback } from 'react';

export const blockerStore = new Store({
  blocker: false,
});

export const setBlocker = (blocker: boolean) => {
  blockerStore.setState({ blocker });
};

export const getBlocker = () => {
  return blockerStore.state.blocker;
};

export const resetBlocker = () => {
  blockerStore.setState({ blocker: false });
};

export const useIsBlockerEnabled = () => {
  const blocker = useStore(
    blockerStore,
    useCallback((v: { blocker: boolean }) => v.blocker, [])
  );
  return {
    blocker,
    setBlocker,
    resetBlocker,
  };
};
