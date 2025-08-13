import { Store, useStore } from '@tanstack/react-store';
import { useCallback, useMemo } from 'react';

const contactSupportModalStore = new Store<{
  formType: 'feedback' | 'help' | false;
}>({
  formType: false,
});

export const useContactSupportModalStore = () => {
  const state = useStore(contactSupportModalStore);

  const onOpenContactSupportModal = useCallback((v: typeof state.formType) => {
    contactSupportModalStore.setState({ formType: v });
  }, []);

  return useMemo(
    () => ({
      ...state,
      onOpenContactSupportModal,
    }),
    [state, onOpenContactSupportModal]
  );
};
