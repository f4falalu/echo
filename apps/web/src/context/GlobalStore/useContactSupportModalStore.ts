import { Store, useStore } from '@tanstack/react-store';
import { useMemo } from 'react';

const contactSupportModalStore = new Store<{
  formType: 'feedback' | 'help' | false;
}>({
  formType: false,
});

export const toggleContactSupportModal = (v: typeof contactSupportModalStore.state.formType) => {
  const newState = v ?? !contactSupportModalStore.state.formType;
  contactSupportModalStore.setState({ formType: newState });
};

export const closeContactSupportModal = () => {
  contactSupportModalStore.setState({ formType: false });
};

export const useContactSupportModalStore = () => {
  const state = useStore(contactSupportModalStore);

  return useMemo(
    () => ({
      ...state,
      toggleContactSupportModal,
      closeContactSupportModal,
    }),
    [state]
  );
};
