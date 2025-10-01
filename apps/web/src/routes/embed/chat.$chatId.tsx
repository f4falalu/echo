import { createFileRoute, Outlet } from '@tanstack/react-router';
import * as chatLayoutServerContext from '@/context/BusterAssets/chat-server/chatLayoutServer';

export const Route = createFileRoute('/embed/chat/$chatId')({
  ...chatLayoutServerContext,
  ssr: false,
  component: () => {
    return (
      <div className="h-full w-full p-2 max-h-[100vh] ">
        <div className="h-full w-full border rounded bg-background">
          {chatLayoutServerContext.component()}
        </div>
      </div>
    );
  },
});
