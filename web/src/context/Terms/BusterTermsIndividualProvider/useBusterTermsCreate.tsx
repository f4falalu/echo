import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { type BusterTerm } from '@/api/asset_interfaces';
import { queryKeys } from '@/api/query_keys';

import { queryOptions } from '@tanstack/react-query';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from 'ahooks';
import type { TermDeleteParams } from '@/api/request_interfaces/terms';
import { useBusterTermsListContextSelector } from '../BusterTermsListProvider';

export const useBusterTermsCreate = () => {
  const { openConfirmModal } = useBusterNotifications();
  const refetchTermsList = useBusterTermsListContextSelector((x) => x.refetchTermsList);

  const { mutateAsync: createTerm } = useSocketQueryMutation({
    emitEvent: '/terms/post',
    responseEvent: '/terms/post:PostTerm',
    options: queryOptions<BusterTerm>({
      queryKey: []
    }),
    callback: (newData, currentData, variables) => {
      refetchTermsList();
      return newData;
    }
  });

  const { mutate: deleteTermMutation } = useSocketQueryMutation({
    emitEvent: '/terms/delete',
    responseEvent: '/terms/delete:DeleteTerm',
    options: queryKeys['/terms/list:getTermsList'],
    preCallback: (currentData, variables) => {
      return (currentData || []).filter((term) => !variables.ids.includes(term.id));
    }
  });

  const onDeleteTerm = useMemoizedFn(({ ids }: TermDeleteParams, ignoreConfirm = false) => {
    const method = async () => {
      deleteTermMutation({ ids });
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
    onDeleteTerm
  };
};
