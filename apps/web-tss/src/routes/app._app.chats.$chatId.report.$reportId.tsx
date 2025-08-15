import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  report_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/chats/$chatId/report/$reportId')({
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/report/$reportId"!</div>;
}
