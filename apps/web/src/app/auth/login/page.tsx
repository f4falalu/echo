import { LoginForm } from '@/components/features/auth/LoginForm';

export default async function Login({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = typeof params.next === 'string' ? params.next : null;

  return <LoginForm redirectTo={redirectTo} />;
}
