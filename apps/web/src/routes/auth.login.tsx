import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { LoginForm } from '@/components/features/auth/LoginForm';

const searchParamsSchema = z.object({
  next: z.string().optional(),
});

export const Route = createFileRoute('/auth/login')({
  head: () => ({
    meta: [
      { title: 'Login' },
      { name: 'description', content: 'Login to your Buster account' },
      { name: 'og:title', content: 'Login' },
      { name: 'og:description', content: 'Login to your Buster account' },
    ],
  }),
  validateSearch: searchParamsSchema,
  component: LoginComp,
});

function LoginComp() {
  const { next } = Route.useSearch();
  const cxt = Route.useRouteContext();

  return <LoginForm redirectTo={next} />;
}
