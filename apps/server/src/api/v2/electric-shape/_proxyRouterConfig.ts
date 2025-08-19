import type { Context } from 'hono';
import { chatsProxyRouter } from './chats';
import { messagesProxyRouter } from './messages';
import { reportFilesProxyRouter } from './report-files';

type SupportedTables = 'messages' | 'chats' | 'report_files';

const proxyRouter: Record<
  SupportedTables,
  (url: URL, userId: string, c: Context) => Promise<URL | Response | undefined>
> = {
  messages: messagesProxyRouter,
  chats: chatsProxyRouter,
  report_files: reportFilesProxyRouter,
};

export default proxyRouter;
