'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import React, { useLayoutEffect, useState } from 'react';
import mainApi from '@/api/buster_rest/instances';
import { defaultRequestHandler } from '@/api/createInstance';
import nextApi from '@/api/next/instances';
import { useSupabaseContext } from '../Supabase/SupabaseContextProvider';
import { getQueryClient } from './getQueryClient';
import {} from '@tanstack/react-query-devtools';
import dynamic from 'next/dynamic';
import { useHotkeys } from 'react-hotkeys-hook';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const ReactQueryDevtoolsProduction = dynamic(
  () =>
    import('@tanstack/react-query-devtools/build/modern/production.js').then((d) => ({
      default: d.ReactQueryDevtools
    })),
  {
    ssr: false,
    loading: () => <div>Loading dev tools...</div>
  }
);

export const BusterReactQueryProvider = ({ children }: { children: React.ReactElement<any> }) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);
  const checkTokenValidity = useSupabaseContext((state) => state.checkTokenValidity);
  const queryClient = getQueryClient(accessToken);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  useLayoutEffect(() => {
    //reset all request interceptors
    mainApi.interceptors.request.eject(0);
    nextApi.interceptors.request.eject(0);
    mainApi.interceptors.request.use((v) => defaultRequestHandler(v, { checkTokenValidity }));
    nextApi.interceptors.request.use((v) => defaultRequestHandler(v, { checkTokenValidity }));
  }, []);

  useHotkeys('meta+shift+i', () => {
    console.log('meta+shift+i');
    setIsDevToolsOpen((prev) => !prev);
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {isDevToolsOpen && (
        <>
          <ReactQueryDevtools initialIsOpen={true} />
          <ReactQueryDevtoolsProduction initialIsOpen={true} />
        </>
      )}
    </QueryClientProvider>
  );
};
