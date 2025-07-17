import type { User as BusterUser } from '@buster/database';
import type { OrganizationRole } from '@buster/server-shared/organization';
import type { User } from '@supabase/supabase-js';

declare module 'hono' {
  interface ContextVariableMap {
    supabaseUser: User;
    busterUser: BusterUser;
    // This is the user's organization ID and role. It is set in the requireOrganizationAdmin and requireOrganization middleware. YOU MUST SET THIS IN THE MIDDLEWARE IF YOU USE THIS CONTEXT VARIABLE.
    userOrganizationInfo: {
      organizationId: string;
      role: OrganizationRole;
    };
  }
}
