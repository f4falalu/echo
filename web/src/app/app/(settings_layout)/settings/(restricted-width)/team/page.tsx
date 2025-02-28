import { BusterRoutes, createBusterRoute } from '@/routes';
import { permanentRedirect } from 'next/navigation';

export default function Page() {
  return permanentRedirect(
    createBusterRoute({
      route: BusterRoutes.APP_SETTINGS_PROFILE
    })
  );
}
