import { createFileRoute, useRouter } from '@tanstack/react-router';
import { z } from 'zod';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { signInWithEmailAndPassword } from '../integrations/supabase/signIn';

const searchParamsSchema = z.object({
  next: z.string().optional(),
});

export const Route = createFileRoute('/auth/login')({
  // Validate and type the `next` search param if present
  validateSearch: searchParamsSchema,
  component: LoginComp,
});

function LoginComp() {
  const { next } = Route.useSearch();

  return <LoginForm redirectTo={next} />;
}
