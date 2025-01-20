import React from 'react';
import { UsersBackButton } from './UsersBackButton';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-5 px-12 py-12">
      <UsersBackButton />
      {children}
    </div>
  );
}
