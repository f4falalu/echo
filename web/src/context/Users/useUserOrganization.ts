import { useMemoizedFn } from '@/hooks';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import type { BusterUserResponse } from '@/api/asset_interfaces/users';
import { useUpdateUser } from '@/api/buster_rest';

export const useUserOrganization = ({
  userResponse,
  refetchUserResponse
}: {
  userResponse: BusterUserResponse | null | undefined;
  refetchUserResponse: () => Promise<unknown>;
}) => {
  const { mutateAsync: createOrganization } = useSocketQueryMutation({
    emitEvent: '/organizations/post',
    responseEvent: '/organizations/post:post'
  });

  const { mutateAsync: updateUserInfo } = useUpdateUser();

  const onCreateUserOrganization = useMemoizedFn(
    async ({ name, company }: { name: string; company: string }) => {
      const alreadyHasOrganization = !!userResponse?.organizations?.[0];

      if (!alreadyHasOrganization) await createOrganization({ name: company });
      if (userResponse)
        await updateUserInfo({
          userId: userResponse.user.id,
          name
        });

      await refetchUserResponse();
    }
  );

  return {
    onCreateUserOrganization
  };
};
