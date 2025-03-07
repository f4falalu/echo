'use client';

import { useSupabaseContext } from '@/context/Supabase/SupabaseContextProvider';
import { useQuery, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

type PaginatedQueryProps<T> = Parameters<typeof useQuery>[0] & {
  page?: number;
  pageSize?: number;
  initialData?: T;
  isUseSession?: boolean;
};

export const useQueryPaginated = <T>({
  queryKey,
  queryFn,
  isUseSession = true,
  enabled = true,
  initialData,
  refetchOnWindowFocus = false,
  refetchOnMount = true,
  page = 0,
  pageSize = 25,
  ...rest
}: PaginatedQueryProps<T>) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);
  const baseEnabled = isUseSession ? !!accessToken : true;

  return useQuery({
    queryKey: [...queryKey, { page, pageSize }],
    queryFn,
    enabled: baseEnabled && !!enabled,
    initialData,
    retry: 0,
    refetchOnWindowFocus,
    refetchOnMount,
    placeholderData: keepPreviousData,
    ...rest
  });
};

type InfiniteQueryReturnType<T> = Omit<ReturnType<typeof useInfiniteQuery>, 'data'> & {
  data: T | undefined;
};

export const useCreateReactInfiniteQuery = <T>({
  queryKey,
  queryFn,
  enabled = true,
  initialPageParam = 0,
  getNextPageParam,
  ...rest
}: Parameters<typeof useInfiniteQuery>[0]) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);
  const baseEnabled = !!accessToken;

  return useInfiniteQuery({
    ...rest,
    queryKey: [...queryKey],
    getNextPageParam,
    initialPageParam,
    enabled: baseEnabled && !!enabled
  }) as InfiniteQueryReturnType<T>;
};
