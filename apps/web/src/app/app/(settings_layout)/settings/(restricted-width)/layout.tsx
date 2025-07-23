import type React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center px-5 pt-16">
      <div className="w-full max-w-[630px] min-w-[500px]">{children}</div>
    </div>
  );
}
