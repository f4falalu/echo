import { useQuery } from '@tanstack/react-query';
import { listAllGoogleFontsFromGoogle } from './requests';

export enum GOOGLE_QUERY_KEYS {
  getGoogleFonts = 'getGoogleFonts'
}

export const useGetGoogleFonts = () => {
  const d = useQuery({
    queryKey: [GOOGLE_QUERY_KEYS.getGoogleFonts],
    queryFn: listAllGoogleFontsFromGoogle,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  return d;
};
