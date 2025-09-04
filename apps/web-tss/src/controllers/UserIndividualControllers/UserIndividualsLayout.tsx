export const UserIndividualsLayout = () => {
  return (
    <div className="flex h-full flex-col space-y-5 overflow-y-auto px-12 py-12">
      <UsersBackButton />
      <HydrationBoundary state={dehydrate(queryClient)}>
        {<LayoutHeaderAndSegment userId={params.userId}>{children}</LayoutHeaderAndSegment>}
      </HydrationBoundary>
    </div>
  );
};
