import React from 'react';

export default function Layout({
  children,
  params: { threadId, collectionId }
}: Readonly<{
  children: React.ReactNode;
  params: { threadId: string; collectionId: string };
}>) {
  return <>{children}</>;
}
