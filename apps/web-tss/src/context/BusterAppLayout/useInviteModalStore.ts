import { Store, useStore } from '@tanstack/react-store';
import { useCallback, useMemo } from 'react';

const inviteModalStore = new Store({
  openInviteModal: false,
});

export const useInviteModalStore = () => {
  const state = useStore(inviteModalStore);

  const onToggleInviteModal = useCallback(
    (v?: boolean) => {
      inviteModalStore.setState({ openInviteModal: v ?? !state.openInviteModal });
    },
    [state.openInviteModal]
  );

  return useMemo(
    () => ({
      ...state,
      onToggleInviteModal,
    }),
    [state, onToggleInviteModal]
  );
};
