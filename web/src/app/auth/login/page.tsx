import { LoginForm } from '@/components/features/auth/LoginForm';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { getSupabaseServerContext } from '@/context/Supabase/getSupabaseServerContext';

export const dynamic = 'force-dynamic';

export default async function Login() {
  const supabase = await getSupabaseServerContext();
  const { user } = supabase;

  // if (user?.id && !user?.is_anonymous) {
  //   return redirect(
  //     createBusterRoute({
  //       route: BusterRoutes.APP_HOME
  //     })
  //   );
  // }

  return <LoginForm user={user} />;
}
