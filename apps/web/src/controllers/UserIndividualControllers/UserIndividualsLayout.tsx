import { LayoutHeaderAndSegment, UsersBackButton } from './LayoutHeaderAndSegment';

export const UserIndividualsLayout = ({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) => {
  return (
    <div className="flex h-full flex-col space-y-5 overflow-y-auto px-12 py-12">
      <UsersBackButton />
      {<LayoutHeaderAndSegment userId={userId}>{children}</LayoutHeaderAndSegment>}
    </div>
  );
};
