import { BusterReactQueryProvider } from '@/context/BusterReactQuery/BusterReactQueryAndApi';
import { QueryClient } from '@tanstack/react-query';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <BusterReactQueryProvider>{children}</BusterReactQueryProvider>;
}
