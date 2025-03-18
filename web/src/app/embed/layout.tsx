import { GlobalErrorComponent } from '@/components/features/errors/GlobalErrorComponent';
import { BusterAssetsProvider } from '@/context/Assets/BusterAssetsProvider';
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
          <BusterAssetsProvider>
            <BusterPosthogProvider>
              <main className="bg-background flex min-h-screen w-full">
                <div className="flex-1 overflow-hidden">{children}</div>
              </main>
            </BusterPosthogProvider>
          </BusterAssetsProvider>
        </BusterReactQueryProvider>
      </SupabaseContextProvider>
    </GlobalErrorComponent>
  );
}
