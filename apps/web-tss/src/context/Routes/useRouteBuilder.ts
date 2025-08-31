import { type BuildLocationFn, type RegisteredRouter, useRouter } from '@tanstack/react-router';
import { useMemo } from 'react';

export const useBuildLocation = <TRouter extends RegisteredRouter>() => {
  const { buildLocation } = useRouter();

  return buildLocation;
};
