import { GlobalErrorComponent } from '@/components/features/errors/GlobalErrorComponent';
import { BusterReactQueryProvider } from '@/context/BusterReactQuery/BusterReactQueryAndApi';
import { BusterPosthogProvider } from '@/context/Posthog';

export default async function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalErrorComponent>
      <BusterReactQueryProvider>
        <BusterPosthogProvider>{children}</BusterPosthogProvider>
      </BusterReactQueryProvider>
    </GlobalErrorComponent>
  );
}
