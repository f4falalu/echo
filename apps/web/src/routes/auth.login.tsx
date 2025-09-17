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
      { name: 'og:title', content: 'Buster - the AI framework for self-serve analytics' },
      {
        name: 'description',
        content: `Buster helps data teams deliver reliable self-serve analytics with AI. It's open source, purpose-built for dbt, and empowers business users to explore company data on their own.`,
      },
      {
        name: 'og:description',
        content: `Buster helps data teams deliver reliable self-serve analytics with AI. It's open source, purpose-built for dbt, and empowers business users to explore company data on their own.`,
      },
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
