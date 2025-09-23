import { Store, useStore } from '@tanstack/react-store';
import { useCallback } from 'react';

export const blockerStore = new Store<{
  blocker: boolean;
  cooldownBlockerTimer: ReturnType<typeof setTimeout> | null;
}>({
  blocker: false,
  cooldownBlockerTimer: null,
});

export const setBlocker = (blocker: boolean) => {
  blockerStore.setState((v) => ({ ...v, blocker }));
};

export const getBlocker = () => {
  return blockerStore.state.blocker;
};

export const resetBlocker = () => {
  blockerStore.setState((v) => ({ ...v, blocker: false }));
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

//blocker cooldown timer
export const startCooldownTimer = (timeout: number = 750) => {
  const timeoutId = setTimeout(() => {
    cancelCooldownTimer();
  }, timeout);

  blockerStore.setState((v) => ({
    ...v,
    cooldownBlockerTimer: timeoutId,
  }));
};

export const cancelCooldownTimer = () => {
  if (blockerStore.state.cooldownBlockerTimer) {
    clearTimeout(blockerStore.state.cooldownBlockerTimer);
    blockerStore.setState((v) => ({ ...v, cooldownBlockerTimer: null }));
  }
};

export const useCooldownTimer = () => {
  const cooldownBlockerTimer = useStore(
    blockerStore,
    useCallback(
      (v: { cooldownBlockerTimer: typeof blockerStore.state.cooldownBlockerTimer }) =>
        v.cooldownBlockerTimer,
      []
    )
  );
  return {
    cooldownBlockerTimer,
    startCooldownTimer,
    cancelCooldownTimer,
  };
};
