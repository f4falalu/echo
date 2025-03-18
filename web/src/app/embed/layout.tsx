import { GlobalErrorComponent } from '@/components/features/errors/GlobalErrorComponent';
import { BusterReactQueryProvider } from '@/context/BusterReactQuery/BusterReactQueryAndApi';
import { BusterPosthogProvider } from '@/context/Posthog';
import { SupabaseContextProvider } from '@/context/Supabase';
import { getSupabaseServerContext } from '@/context/Supabase/getSupabaseServerContext';

export default async function EmbedLayout({ children }: { children: React.ReactNode }) {
  const supabaseContext = await getSupabaseServerContext();

  return (
    <GlobalErrorComponent>
      <SupabaseContextProvider supabaseContext={supabaseContext}>
        <BusterReactQueryProvider>
          <BusterPosthogProvider>
            <main className="bg-background min-h-screen w-full">{children}</main>
          </BusterPosthogProvider>
        </BusterReactQueryProvider>
      </SupabaseContextProvider>
    </GlobalErrorComponent>
  );
}
