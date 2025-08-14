import { Store, useStore } from '@tanstack/react-store';
import { useCallback, useMemo } from 'react';

const inviteModalStore = new Store({
  openInviteModal: false,
});

export const toggleInviteModal = (v?: boolean) => {
  const newState = v ?? !inviteModalStore.state.openInviteModal;
  inviteModalStore.setState({ openInviteModal: newState });
};

export const closeInviteModal = () => {
  inviteModalStore.setState({ openInviteModal: false });
};

export const useInviteModalStore = () => {
  const state = useStore(inviteModalStore);

  return useMemo(
    () => ({
      ...state,
      toggleInviteModal,
      closeInviteModal,
    }),
    [state]
  );
};
