import { LoginForm } from '@/components/features/auth/LoginForm';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useSupabaseServerContext } from '@/context/Supabase/useSupabaseContext';

export default async function Login() {
  const supabase = await useSupabaseServerContext();
  const { user } = supabase;

  if (user?.id) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.APP_ROOT
      })
    );
  }

  return <LoginForm user={user} />;
}
