// mocks/next-navigation.ts
export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  refresh: () => {},
  back: () => {}
});

export const usePathname = () => '/';
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({});
