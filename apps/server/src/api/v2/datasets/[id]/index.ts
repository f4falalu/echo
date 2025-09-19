import type { User } from '@buster/database/queries';
import { Hono } from 'hono';
import { sample } from './sample';

// Create Hono app for dataset by ID routes
export const datasetById = new Hono<{
  Variables: {
    busterUser: User;
  };
}>()
  // Mount sample route at /sample
  .route('/sample', sample);
