import { useRouter } from '@tanstack/react-router';
import { useMemo } from 'react';

export const useBuildLocation = () => {
  const { buildLocation } = useRouter();
  return useMemo(() => buildLocation, [buildLocation]);
};
