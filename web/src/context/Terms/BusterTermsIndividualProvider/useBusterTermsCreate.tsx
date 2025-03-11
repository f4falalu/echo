import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import type { TermDeleteParams } from '@/api/request_interfaces/terms';
import { useBusterTermsListContextSelector } from '../BusterTermsListProvider';
import { useCreateTerm, useDeleteTerm } from '@/api/buster_rest/terms';

export const useBusterTermsCreate = () => {
  const { openConfirmModal } = useBusterNotifications();

  const { mutateAsync: createTerm, isPending: isCreatingTerm } = useCreateTerm();

  const { mutate: deleteTermMutation, isPending: isDeletingTerm } = useDeleteTerm();

  const onDeleteTerm = useMemoizedFn(({ ids }: TermDeleteParams, ignoreConfirm = false) => {
    const method = async () => {
      deleteTermMutation(ids);
    };

    if (ignoreConfirm) {
      return method();
    }

    return openConfirmModal({
      title: 'Delete term',
      content: 'Are you sure you want to delete this term?',
      onOk: method
    });
  });

  return {
    createTerm,
    onDeleteTerm,
    isCreatingTerm,
    isDeletingTerm
  };
};
