import type { User } from '@buster/database/queries';
import { Hono } from 'hono';
import { requireAuth } from '../../../../../middleware/auth';
import { GET } from './GET';

// Create Hono app for dataset sample route
export const sample = new Hono<{
  Variables: {
    busterUser: User;
  };
}>()
  // Apply authentication middleware
  .use('*', requireAuth)
  // Mount GET route
  .route('/', GET);
